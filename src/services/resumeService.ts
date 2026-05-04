import { supabase } from "@/lib/supabase";
import { parseResumeText } from "./intelligenceService";

export async function processResumes() {
  // 1. Get unprocessed resumes
  const { data: resumes, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('processed', false);

  if (error || !resumes || resumes.length === 0) return { count: 0 };

  let processedCount = 0;

  for (const resume of resumes) {
    if (!resume.extracted_text) continue;

    // 2. Parse with AI
    const parsed = await parseResumeText(resume.extracted_text);
    
    if (parsed) {
      // 3. Update resume record
      const { error: updateError } = await supabase
        .from('resumes')
        .update({
          parsed_data: parsed,
          extracted_skills: parsed.skills,
          processed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', resume.id);

      if (!updateError) {
        processedCount++;
        
        // 4. (Optional) Auto-convert to candidate for CRM
        await supabase.from('candidates').insert({
          name: parsed.name,
          email: parsed.email,
          skills: parsed.skills,
          current_title: parsed.current_title,
          experience: parsed.experience?.toString(),
          source: 'resume_upload'
        });
      }
    }
  }

  // Log action
  await supabase.from('agent_logs').insert({
    type: 'processing',
    message: `Bulk processed ${processedCount} resumes into unified talent pool.`,
    agent_name: 'Recruiter AI',
    status: 'success'
  });

  return { count: processedCount };
}
