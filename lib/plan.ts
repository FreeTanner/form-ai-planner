import type { Exercise, Ingredient, Meal, Plan, Profile, ReplacementTarget } from "./schemas";
import { selectedWeights } from "./equipment";

export const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
export type Grocery = { key: string; name: string; quantity: number; unit: Ingredient["unit"]; category: Ingredient["category"] };

export function groceriesFor(plan: Plan, pantry: string[]): Grocery[] {
  const available = new Set(pantry.map(normalize));
  const items = new Map<string, Grocery>();
  for (const day of plan.days) for (const meal of day.meals) for (const ingredient of meal.ingredients) {
    if (available.has(normalize(ingredient.name)) || (ingredient.pantryItem && available.has(normalize(ingredient.pantryItem)))) continue;
    const key = `${normalize(ingredient.name)}|${ingredient.unit}`;
    const existing = items.get(key);
    if (existing) existing.quantity += ingredient.quantity;
    else items.set(key, { key, name: ingredient.name, quantity: ingredient.quantity, unit: ingredient.unit, category: ingredient.category });
  }
  return [...items.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export function mealTotals(meals: Meal[]) {
  return meals.reduce((total, meal) => ({ calories: total.calories + meal.calories, protein: total.protein + meal.protein, carbs: total.carbs + meal.carbs, fat: total.fat + meal.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

export function replaceItem(plan: Plan, target: ReplacementTarget, replacement: Meal | Exercise): Plan {
  return { ...plan, days: plan.days.map((day, i) => i !== target.dayIndex ? day : target.kind === "meal"
    ? { ...day, meals: day.meals.map((meal, j) => j === target.itemIndex ? replacement as Meal : meal) }
    : { ...day, workout: { ...day.workout, exercises: day.workout.exercises.map((exercise, j) => j === target.itemIndex ? replacement as Exercise : exercise) } }) };
}

// These checks catch structural and explicit constraint violations. Semantic restrictions
// (for example dairy derivatives) also remain part of the model's instructions.
export function constraintIssues(plan: Plan, profile: Profile): string[] {
  const issues: string[] = [];
  const equipment = new Set(profile.equipment.map(normalize));
  const weights = selectedWeights(profile);
  const pantry = new Set(profile.pantry.map(normalize));
  if (plan.days.filter(day => !day.workout.isRestDay).length !== profile.workoutDays) issues.push("Match the exact requested number of training days.");
  plan.days.forEach((day, index) => {
    const label = `Day ${index + 1}`;
    if (day.meals.length !== profile.mealsPerDay) issues.push(`${label}: incorrect meal count.`);
    if (day.workout.minutes > profile.workoutMinutes) issues.push(`${label}: workout exceeds available time.`);
    if (day.workout.isRestDay && day.workout.exercises.length) issues.push(`${label}: rest days must have no prescribed exercises.`);
    if (!day.workout.isRestDay && !day.workout.exercises.length) issues.push(`${label}: training day needs exercises.`);
    if (day.workout.exercises.reduce((sum, ex) => sum + ex.minutes, 0) > day.workout.minutes) issues.push(`${label}: exercise time exceeds workout duration.`);
    day.workout.exercises.forEach(ex => {
      if (ex.equipment.some(item => !equipment.has(normalize(item)))) issues.push(`${label}: unavailable equipment in ${ex.name}.`);
      for (const item of ex.equipment) {
        const available = weights.find(entry => normalize(entry.equipment) === normalize(item));
        if (available && (ex.loads ?? []).filter(load => normalize(load.equipment) === normalize(item)).length !== 1) issues.push(`${label}: ${ex.name} needs one starting load from your available ${item} weights.`);
      }
      for (const load of ex.loads ?? []) {
        const available = weights.find(entry => normalize(entry.equipment) === normalize(load.equipment));
        if (!ex.equipment.some(item => normalize(item) === normalize(load.equipment)) || !available || load.unit !== available.unit || !available.values.some(value => Math.abs(value - load.weight) < 0.0001)) issues.push(`${label}: unavailable weight in ${ex.name} (${load.weight} ${load.unit} ${load.equipment}).`);
      }
      if (profile.dislikedExercises.some(item => normalize(ex.name).includes(normalize(item)))) issues.push(`${label}: disliked exercise ${ex.name}.`);
    });
    day.meals.forEach(meal => {
      if (meal.prepMinutes > profile.prepMinutes) issues.push(`${label}: ${meal.name} exceeds preparation time.`);
      meal.ingredients.forEach(item => {
        if (item.pantryItem && !pantry.has(normalize(item.pantryItem))) issues.push(`${label}: invalid pantry reference for ${item.name}.`);
        if (!profile.buyGroceries && !pantry.has(normalize(item.name)) && !pantry.has(normalize(item.pantryItem))) issues.push(`${label}: ${item.name} is not in the pantry.`);
        if ([...profile.allergies, ...profile.dislikedFoods].some(avoid => normalize(item.name).includes(normalize(avoid)))) issues.push(`${label}: excluded ingredient ${item.name}.`);
      });
    });
  });
  return [...new Set(issues)];
}
