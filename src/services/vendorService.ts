import { supabase } from "@/lib/supabase";

export interface VendorPerformance {
  vendorId: string;
  rating: number;
  totalPlacements: number;
  successRate: number;
}

/**
 * VENDOR INTELLIGENCE SERVICE
 * Calculates dynamic ratings based on placement history and submission quality.
 */
export async function getVendorPerformance(vendorId: string): Promise<VendorPerformance> {
  // 1. Fetch collaborations to calculate "Submission Quality"
  const { data: collabs } = await supabase
    .from('collaborations')
    .select('status')
    .eq('vendor_id', vendorId);

  // 2. Fetch deals to calculate "Financial Weight"
  const { data: deals } = await supabase
    .from('deals')
    .select('status')
    .eq('status', 'placed'); 
    // Note: In a real system, the deal should have a vendor_id. 
    // Since our deals table has vendor_name string, we'll try to match or use collaborations.

  const totalSubmissions = collabs?.length || 0;
  const successfulStages = collabs?.filter(c => ['interviewing', 'placed'].includes(c.status || '')).length || 0;
  
  // Placement count from collaborations (more reliable for specific vendor mapping)
  const placements = collabs?.filter(c => c.status === 'placed').length || 0;

  // Rating Logic:
  // - 1 star base
  // - +1 star for every 2 placements (max 3)
  // - +1 star if success rate > 50%
  const successRate = totalSubmissions > 0 ? (successfulStages / totalSubmissions) * 100 : 0;
  
  let rating = 3.5; // Base organic rating
  if (placements > 0) rating += 0.5;
  if (placements > 3) rating += 0.5;
  if (successRate > 50) rating += 0.5;

  return {
    vendorId,
    rating: Math.min(5, rating),
    totalPlacements: placements,
    successRate
  };
}

export async function getAllVendorRatings(): Promise<Record<string, VendorPerformance>> {
  const { data: vendors } = await supabase.from('companies').select('id').eq('type', 'vendor');
  
  const ratings: Record<string, VendorPerformance> = {};
  
  if (vendors) {
    for (const v of vendors) {
      ratings[v.id] = await getVendorPerformance(v.id);
    }
  }
  
  return ratings;
}
