
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { recordDeal } from "./financialService";
import { calculateAdjustedBudget } from "./marketplaceService";
import { callAISecureProxy } from "@/lib/ai";

/**
 * JOB POSTING: Initial trigger for marketplace
 */
export async function processNewJob(job: any) {
  // 1. Calculate Adjusted Budget (HireNest Margin)
  const adjustedBudget = await calculateAdjustedBudget(job.company_id, job.budget);
  
  // 2. Update Job in DB
  await supabase
    .from('jobs')
    .update({ adjusted_budget: adjustedBudget })
    .eq('id', job.id);

  // 3. Log System Action
  await supabase.from('agent_logs').insert({
    type: 'revenue',
    level: 'info',
    message: `[CFO AGENT] Budget adjusted for ${job.title}. Client Gross: ₹${job.budget} -> Vendor Net: ₹${adjustedBudget}`,
    metadata: { jobId: job.id, gross: job.budget, net: adjustedBudget }
  });
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  currentTitle: string;
  skills: string[];
  experience: string;
  education: string;
  summary: string;
}

export interface MatchResult {
  score: number;
  reasoning: string;
  gaps: string[];
  recommendation: 'shortlist' | 'reserve' | 'reject';
}

/**
 * Parses raw resume text into structured JSON using Gemini 3 Flash
 */
export async function parseResumeWithAI(text: string): Promise<ParsedResume> {
  const prompt = `
    Analyze the following resume text and extract structured information for a neural recruitment engine.
    Focus strictly on skills, experience, and professional identity.
    Return ONLY a JSON object with this structure:
    {
      "name": "full name",
      "email": "email address",
      "phone": "phone number",
      "currentTitle": "current or most recent job title",
      "skills": ["skill1", "skill2"],
      "experience": "brief summary of total years and key roles",
      "education": "highest degree and institution",
      "summary": "professional summary focusing on technical depth"
    }
    
    TEXT:
    ${text.substring(0, 5000)}
  `;

  try {
    const jsonString = await callAISecureProxy(prompt);
    const cleanJson = jsonString.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Parsing Error:", error);
    return {
      name: "Unknown",
      email: "",
      phone: "",
      currentTitle: "",
      skills: [],
      experience: "",
      education: "",
      summary: ""
    };
  }
}

/**
 * Neural Matcher: Semantic comparison between Job and Candidate
 */
export async function scoreCandidateForJob(job: any, candidate: any): Promise<MatchResult> {
  const prompt = `
    Act as a Senior Strategic Recruitment Director & Technical QA Chief. Perform a deep neural match between the job requirement and the candidate profile.
    
    CRITICAL CONSTRAINT: 
    - Match PURELY on Technical Skills (70%) and relevant Experience/Tenure (30%).
    - IGNORE location, phone, email, and candidate name in the matching logic.
    - Be strict about niche skills mentioned in the JD.
    
    JOB REQUISITION:
    - Title: ${job.title}
    - Critical Niche Skills: ${job.skills?.join(", ")}
    - Core Technical Responsibilities: ${job.description}
    
    CANDIDATE PROFILE:
    - Current/Recent Role: ${candidate.currentTitle || candidate.current_title}
    - Declared Technical Skills: ${candidate.skills?.join(", ")}
    - Career Summary/Experience: ${candidate.summary || candidate.experience}
    
    YOUR TASK:
    1. Calculate a conservative score (0-100). If niche skills are missing, the score MUST be below 70.
    2. Provide a 'Strategic Reasoning' (approx 3 sentences) explaining the technical overlap.
    3. Identify 3-5 specific 'Gaps'. Mention EXACT missing skills from the JD.
    4. Categorize recommending as Shortlist, Reserve (potential with training), or Reject.

    Return ONLY a structural JSON object:
    {
      "score": number,
      "reasoning": "string",
      "gaps": ["Detailed technical gap 1", "Specific experience mismatch 2"],
      "recommendation": "shortlist" | "reserve" | "reject"
    }
  `;

  try {
    const jsonString = await callAISecureProxy(prompt);
    const cleanJson = jsonString.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Matching Error:", error);
    return { score: 0, reasoning: "Evaluation failed", gaps: ["Neural engine timeout"], recommendation: 'reject' };
  }
}

/**
 * Autonomous Decision Agent: The "Brain" that runs the pipeline
 */
export async function runDecisionAgent() {
  // 1. Log Start
  await supabase.from('agent_logs').insert({
    type: 'decision',
    message: 'Autonomous Decision Agent cycle started.',
    level: 'info'
  });

  // 2. Find Pending Candidates
  const { data: candidates } = await supabase
    .from('candidates')
    .select('*')
    .eq('stage', 'screening');

  if (!candidates || candidates.length === 0) return "No pending candidates in screening.";

  // 3. Find Open Jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'open');

  if (!jobs || jobs.length === 0) return "No open jobs found.";

  let decisions = 0;
  let reviews = 0;

  for (const candidate of candidates) {
    let bestMatch: any = null;
    
    for (const job of jobs) {
       const evaluation = await scoreCandidateForJob(job, candidate);
       
       // 3-TIER DECISIONING & GUARDRAILS
       // Tier 1: Auto-Shortlist (Very high confidence)
       if (evaluation.recommendation === 'shortlist' && evaluation.score >= 85) {
         if (!bestMatch || evaluation.score > bestMatch.score) {
           bestMatch = { job, evaluation, tier: 'auto' };
         }
       } 
       // Tier 2: Human Review Priority
       else if (evaluation.score >= 70) {
         reviews++;
         await supabase.from('candidates').update({
           stage: 'review',
           notes: `[AI REVIEW QUEUE] High potential match (${evaluation.score}%). Reasoning: ${evaluation.reasoning}`
         }).eq('id', candidate.id);
       }
    }

    if (bestMatch && bestMatch.tier === 'auto') {
      // AUTO-MOVE: This is the decision!
      await supabase.from('candidates').update({
        stage: 'interview',
        notes: `[AI AUTONOMOUS DECISION] Auto-Shortlisted for ${bestMatch.job.title}. Match: ${bestMatch.evaluation.score}%. Reasoning: ${bestMatch.evaluation.reasoning}`
      }).eq('id', candidate.id);
      
      // CFO LAYER: Record potential revenue
      const estimatedValue = 150000; // Mock 15% of annual salary ₹10L
      await recordDeal(bestMatch.job, candidate, estimatedValue);
      
      decisions++;
    }
  }

  // 4. Log Completion
  await supabase.from('agent_logs').insert({
    type: 'decision',
    message: `Cycle complete. Processed ${candidates.length} profiles. Auto-Shortlisted: ${decisions} | Flagged for Review: ${reviews}.`,
    level: 'success',
    status: 'finished'
  });

  return `Cycle complete. Made ${decisions} decisions.`;
}
