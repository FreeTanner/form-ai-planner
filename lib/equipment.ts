import type { EquipmentWeights, Profile } from "./schemas";

export function hasWeightOptions(equipment: string) {
  return /dumbbell|kettlebell|barbell|\bez[ -]?bar\b|medicine ball|slam ball|sandbag|weighted vest|ankle weight|wrist weight|cable|weight machine|smith machine|leg press/i.test(equipment);
}

export function weightBasis(equipment: string) {
  if (/barbell|\bez[ -]?bar\b|smith machine/i.test(equipment)) return "total including the bar";
  if (/machine|cable|leg press/i.test(equipment)) return "machine setting";
  return "per item";
}

export function selectedWeights(profile: Profile): EquipmentWeights[] {
  const selected = new Set(profile.equipment.map(value => value.trim().toLowerCase()));
  return profile.equipmentWeights.filter(item => selected.has(item.equipment.trim().toLowerCase()));
}

export function equipmentSummary(profile: Profile) {
  return profile.equipment.map(equipment => {
    const weights = selectedWeights(profile).find(item => item.equipment.toLowerCase() === equipment.toLowerCase());
    return weights ? `${equipment}: ${weights.values.join(", ")} ${weights.unit} (${weightBasis(equipment)})` : equipment;
  }).join("; ") || "Bodyweight only";
}
