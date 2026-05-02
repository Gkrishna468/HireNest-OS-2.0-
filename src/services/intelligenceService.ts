
import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabase";
import { recordDeal } from "./financialService";
import { calculateAdjustedBudget } from "./marketplaceService";

let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

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
    Analyze the following resume text and extract structured information.
    Return ONLY a JSON object with this structure:
    {
      "name": "full name",
      "email": "email address",
      "phone": "phone number",
      "currentTitle": "current or most recent job title",
      "skills": ["skill1", "skill2"],
      "experience": "brief summary of years and key roles",
      "education": "highest degree and institution",
      "summary": "professional summary"
    }
    
    TEXT:
    ${text.substring(0, 5000)}
  `;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const cleanText = response.text || "{}";
    return JSON.parse(cleanText);
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
    Act as an expert technical recruiter. Score the candidate against the job description.
    
    JOB: ${job.title}
    SKILLS REQUIRED: ${job.skills?.join(", ")}
    DESCRIPTION: ${job.description}
    
    CANDIDATE: ${candidate.name}
    CURRENT ROLE: ${candidate.currentTitle || candidate.current_title}
    CANDIDATE SKILLS: ${candidate.skills?.join(", ")}
    CANDIDATE SUMMARY: ${candidate.summary || candidate.experience}
    
    Return ONLY a JSON object:
    {
      "score": number (0-100),
      "reasoning": "1-2 sentences explanation",
      "gaps": ["missing skill 1", "missing experience X"],
      "recommendation": "shortlist" | "reserve" | "reject"
    }
  `;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const cleanText = response.text || "{}";
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("AI Matching Error:", error);
    return { score: 0, reasoning: "Evaluation failed", gaps: [], recommendation: 'reject' };
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
