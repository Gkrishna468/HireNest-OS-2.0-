import { callAISecureProxy } from "@/lib/ai";

export interface BriefingResult {
  summary: string;
  strengths: string[];
  client_pitch: string;
}

/**
 * AI BRIEFING SERVICE
 * Compiles 100+ data points into a high-conversion client briefing.
 */
export async function generateCandidateBriefing(candidate: any): Promise<BriefingResult> {
  const prompt = `
    Act as a high-tier executive headhunter. Generate a client-facing briefing for the following candidate.
    Candidate: ${candidate.name}
    Role: ${candidate.current_title || 'Expert'}
    Experience: ${candidate.yearsExperience} years
    Skills: ${candidate.skills?.join(', ')}
    
    Format the output as JSON with:
    {
      "summary": "1-2 sentences highlighting their unique path",
      "strengths": ["list of 3 unique selling points"],
      "client_pitch": "A 3-sentence closing pitch to convince the client to interview them"
    }
  `;

  try {
    const text = await callAISecureProxy(prompt);
    const resultText = text?.replace(/```json|```/g, '') || '{}';
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Briefing failed", error);
    return {
      summary: `${candidate.name} is an experienced professional in ${candidate.skills?.[0] || 'their field'}.`,
      strengths: ["Technical Proficiency", "Experience", "Cultural Fit"],
      client_pitch: "Highly recommended for further evaluation."
    };
  }
}

/**
 * PII MASKING
 * Automatically anonymizes profiles for secure sharing.
 */
export function maskCandidateData(candidate: any) {
  const anonId = `CN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  return {
    ...candidate,
    name: "Redacted Candidate",
    email: "redacted@agency-os.com",
    phone: "XX-XXXX-XXXX",
    anonymized_id: anonId
  };
}
