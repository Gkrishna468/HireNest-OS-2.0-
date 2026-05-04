import { supabase } from "@/lib/supabase";
import { profileClient, generatePitch, decideFollowUp, scoreCandidateForJob } from "./intelligenceService";

export async function runUnifiedBrain(text: string, source: string, contactId?: string) {
  try {
    // 1. Profile Intent
    const profile = await profileClient(text);
    
    // 2. Fetch Talent Pool if Hiring Intent
    let matches: any[] = [];
    if (profile.intent === 'hiring') {
      const { data: candidates } = await supabase.from('candidates').select('*').limit(50);
      const { data: resumes } = await supabase.from('resumes').select('*').limit(50);
      
      const pool = [
        ...(candidates || []).map(c => ({ ...c, source: 'crm' })),
        ...(resumes || []).map(r => ({ id: r.id, name: r.file_name, skills: r.extracted_skills || [], experience: 2, source: 'resume' }))
      ];

      // Quick heuristic match to find the top 5 for the pitch
      const scored = await Promise.all(pool.slice(0, 10).map(async (c) => {
        const evalRes = await scoreCandidateForJob({ title: profile.roles?.[0] || 'Professional' }, c);
        return { ...c, ...evalRes };
      }));
      
      matches = scored.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    // 3. Generate Strategic Pitch
    const pitch = await generatePitch({ profile, matches, source });

    // 4. Decide Follow-up
    const followUp = decideFollowUp(profile);

    // 5. AUTO-ACTIONS (CRM)
    if (profile.intent === 'candidate') {
      await supabase.from('candidates').upsert({
        name: profile.entities?.name || 'New Candidate',
        email: contactId?.includes('@') ? contactId : undefined,
        skills: profile.roles,
        source: `brain_${source}`,
        experience: 'Extracted via AI Brain'
      }, { onConflict: 'email' });
    } else if (profile.intent === 'hiring') {
      await supabase.from('deals').insert({
        title: `Brain Deal: ${profile.roles?.[0] || 'Unspecified Role'}`,
        client_name: contactId,
        status: 'prospecting',
        estimated_value: profile.budget === 'high' ? 50000 : 15000
      });
    }

    // 6. Commit to Memory (Logs & Metadata)
    await supabase.from('agent_logs').insert({
      type: 'brain_execution',
      message: `Brain processed ${source} lead: ${profile.intent} (${profile.urgency})`,
      level: profile.urgency === 'high' ? 'info' : 'info',
      status: 'success',
      agent_name: 'Core Intelligence',
      metadata: {
        profile,
        matches_found: matches.length,
        suggested_action: followUp.action
      }
    });

    return {
      profile,
      matches,
      pitch,
      followUp
    };
  } catch (err) {
    console.error("Unified Brain Execution Failed:", err);
    return null;
  }
}
