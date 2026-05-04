
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
  matchedSkills?: string[];
  missingSkills?: string[];
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
 * Extracts structured technical skills from a raw Job Description text.
 */
export async function extractJobSkills(jdText: string): Promise<string[]> {
  const prompt = `
    Extract ONLY a clean list of technical skills and tools from this Job Description.
    Focus on niche technologies and core frameworks.
    Ignore soft skills.
    Return as a simple JSON array: ["skill1", "skill2"]
    JD: ${jdText}
  `;
  try {
    const raw = await callAISecureProxy(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    // Fallback: simple split if AI fails or returns weird format
    return jdText.split(/[,;\n]/).map(s => s.trim().toLowerCase()).filter(s => s.length > 2 && s.length < 50);
  }
}

function normalize(text: string) {
  return (text || '').toLowerCase().trim();
}

function fuzzyMatch(skill: string, candidateSkills: string[]) {
  const normSkill = normalize(skill);
  return candidateSkills.some(cs => {
    const normCs = normalize(cs);
    return normCs.includes(normSkill) || normSkill.includes(normCs);
  });
}

/**
 * Neural Matcher: Semantic comparison between Job and Candidate.
 * Strategic Weights: 60% Skills, 20% Experience, 20% Semantic Alignment.
 */
export async function scoreCandidateForJob(job: any, candidate: any): Promise<MatchResult> {
  const jobSkills = (job.skills || []).map(normalize);
  const candSkills = (candidate.skills || []).map(normalize);
  
  // High-fidelity heuristic pre-score
  const matched = jobSkills.filter(s => fuzzyMatch(s, candSkills));
  const skillScore = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 100 : 0;
  const expMatch = candidate.experience >= (job.min_experience || 0) ? 100 : 60;

  const prompt = `
    Act as a Senior Strategic Recruitment Director & Technical QA Chief. 
    Perform a deep neural match using GEMINI-1.5-PRO power.
    
    JOB: ${job.title} | Critical Skills: ${jobSkills.join(", ")}
    CANDIDATE: ${candSkills.join(", ")} | Exp: ${candidate.experience}
    
    Heuristic Pre-Score: ${Math.round(skillScore)}% skill match.
    
    YOUR TASK:
    1. Calculate a Final Neural Score (0-100). 
    2. Provide 'Strategic Reasoning' explaining tech overlap.
    3. Identify EXACT 'Gaps' from the JD.
    4. Recommendation: 'shortlist' or 'reserve'.

    Return JSON:
    {
      "score": number,
      "reasoning": "string",
      "gaps": ["string"],
      "recommendation": "shortlist"
    }
  `;

  try {
    const jsonString = await callAISecureProxy(prompt, { model: 'gemini-1.5-pro', useProxy: true });
    const cleanJson = jsonString.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJson);
    
    // Balanced Score: AI judgment mixed with hard heuristic to prevent halluciations or overly strict filters
    const finalScore = Math.round((result.score * 0.5) + (skillScore * 0.4) + (expMatch * 0.1));
    
    return {
      ...result,
      score: finalScore,
      matchedSkills: matched,
      missingSkills: jobSkills.filter(s => !matched.includes(s))
    } as any;
  } catch (error) {
    console.error("AI Matching Error, triggering heuristic fallback:", error);
    
    return { 
      score: Math.round(skillScore * 0.8 + expMatch * 0.2), 
      reasoning: `Matched ${matched.length} key technical nodes.`, 
      gaps: jobSkills.filter(s => !matched.includes(s)),
      recommendation: skillScore >= 50 ? 'shortlist' : 'reserve',
      matchedSkills: matched,
      missingSkills: jobSkills.filter(s => !matched.includes(s))
    } as any;
  }
}

/**
 * Resume Parser: Converts raw text into structured candidate nodes.
 */
export async function parseResumeText(text: string): Promise<any> {
  const prompt = `
    Extract structured candidate data from this resume text.
    Return ONLY JSON:
    {
      "name": "string",
      "email": "string",
      "skills": ["skill1", "skill2"],
      "experience": number,
      "current_title": "string",
      "summary": "string"
    }
    RESUME: ${text.substring(0, 4000)}
  `;
  try {
    const raw = await callAISecureProxy(prompt, { model: 'gemini-1.5-pro', useProxy: true });
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Resume Parsing Error:", e);
    return null;
  }
}
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

/**
 * AI Interviewer Agent: Generates targeted technical questions based on gaps.
 */
export async function generateInterviewQuestions(job: any, candidate: any, match: MatchResult): Promise<any> {
  const prompt = `
    Act as a Senior Technical Interviewer.
    JOB: ${job.title}
    MATCH SCORE: ${match.score}%
    MISSING SKILLS: ${match.missingSkills?.join(", ")}
    
    Generate 3 high-impact technical questions to validate the candidate's core expertise and 2 probing questions to explore the missing skills/gaps.
    Return JSON:
    {
      "technical": ["string"],
      "gaps": ["string"]
    }
  `;
  try {
    const raw = await callAISecureProxy(prompt, { model: 'gemini-1.5-pro', useProxy: true });
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    return { technical: ["Explain your architecture approach."], gaps: ["How would you quickly learn niche tools in our JD?"] };
  }
}

/**
 * AI Sales Agent: Strategic Prediction & Hiring Probability.
 */
export async function getHiringPrediction(job: any, candidate: any, match: MatchResult): Promise<any> {
  const prompt = `
    Act as a Strategic Hiring Director & Offer Scientist.
    Predict the probability of this candidate being hired and the likelihood of them accepting an offer.
    JOB: ${job.title}
    SKILL MATCH: ${match.score}%
    GAPS: ${match.missingSkills?.join(", ")}
    EXP: ${candidate.experience} yrs
    
    Return JSON:
    {
      "hiring_probability": number,
      "offer_success": number,
      "summary": "3-sentence strategic justification.",
      "risk_level": "Low" | "Medium" | "High"
    }
  `;
  try {
    const raw = await callAISecureProxy(prompt, { model: 'gemini-1.5-pro', useProxy: true });
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    const prob = Math.min(100, Math.max(0, match.score + (candidate.experience > 5 ? 10 : 0)));
    return { 
      hiring_probability: prob, 
      offer_success: 75, 
      summary: "Prediction based on technical alignment nodes.", 
      risk_level: prob > 70 ? "Low" : "Medium" 
    };
  }
}
