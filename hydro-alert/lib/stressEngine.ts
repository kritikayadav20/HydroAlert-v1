import { supabase } from './supabase';

export interface Village {
  id: string;
  name: string;
  district: string;
  population: number;
  lat: number;
  lng: number;
  base_water_capacity_liters: number;
  current_water_level_pct: number;
  water_stress_index: number;
}

export interface EnvironmentalData {
  id: string;
  village_id: string;
  record_date: string;
  rainfall_mm: number;
  groundwater_level_m: number;
  temperature_c: number;
}

/**
 * Calculates the Water Stress Index (WSI) for a village based on its data.
 * WSI is 0-100, where 100 is maximum stress (severe drought).
 */
export function calculateWaterStressIndex(village: Village, envData: EnvironmentalData[]): number {
  if (!envData || envData.length === 0) {
    // If no recent data, assume moderate stress heavily influenced by population density
    return Math.min(100, 30 + (village.population / 1000) * 0.5);
  }

  // Sort by date descending to get the latest
  const sortedEnvData = [...envData].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
  
  const latestData = sortedEnvData[0];
  const previousData = sortedEnvData.length > 1 ? sortedEnvData[1] : null;

  // 1. Rainfall Deficit Factor (0-40 points)
  // Assuming a baseline average rainfall of 10mm per day during monsoon, lower is worse.
  const rainfallFactor = Math.max(0, 40 - (latestData.rainfall_mm * 2)); 

  // 2. Groundwater Depletion Factor (0-40 points)
  // Deeper groundwater = higher stress. Assuming > 30m is very bad.
  let gwFactor = (latestData.groundwater_level_m / 40) * 40;
  gwFactor = Math.min(40, Math.max(0, gwFactor));

  // If groundwater dropped rapidly since last record, add penalty
  if (previousData) {
    const gwDrop = latestData.groundwater_level_m - previousData.groundwater_level_m;
    if (gwDrop > 0) {
      gwFactor += gwDrop * 5; // Add extra stress points for rapid dropping
    }
  }

  // 3. Population Demand Factor (0-20 points)
  // Larger population = higher demand and faster depletion.
  // Assuming 100,000 is high density for a village area.
  const populationFactor = Math.min(20, (village.population / 100000) * 20);

  // 4. Current Capacity Modifier
  // If water level is low, increase stress directly.
  const capacityDeficit = 100 - (village.current_water_level_pct || 100);
  const capacityModifier = capacityDeficit * 0.5; // up to +50 points

  let wsi = rainfallFactor + gwFactor + populationFactor + capacityModifier;

  // Normalize between 0 and 100
  wsi = Math.max(0, Math.min(100, wsi));

  return parseFloat(wsi.toFixed(2));
}

export async function processAllVillagesStress() {
  const { data: villages, error: villageErr } = await supabase.from('villages').select('*');
  if (villageErr) throw villageErr;

  const results = [];

  for (const village of villages) {
    // Fetch last 30 days of env data
    const { data: envData, error: envErr } = await supabase
      .from('environmental_data')
      .select('*')
      .eq('village_id', village.id)
      .order('record_date', { ascending: false })
      .limit(30);

    if (envErr) {
      console.error(`Error fetching env data for ${village.name}:`, envErr);
      continue;
    }

    const newWsi = calculateWaterStressIndex(village, envData as EnvironmentalData[]);

    // Update the village record
    const { error: updateErr } = await supabase
      .from('villages')
      .update({ water_stress_index: newWsi, updated_at: new Date().toISOString() })
      .eq('id', village.id);

    if (updateErr) {
      console.error(`Error updating WSI for ${village.name}:`, updateErr);
    } else {
      results.push({ village: village.name, oldWsi: village.water_stress_index, newWsi });
    }
  }

  return results;
}
