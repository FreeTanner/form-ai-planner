import assert from "node:assert/strict";
import test from "node:test";
import { constraintIssues, groceriesFor, mealTotals, replaceItem } from "../lib/plan";
import { planSchema, profileSchema } from "../lib/schemas";
import { samplePlan, sampleProfile } from "../lib/sample";

test("sample is a complete valid seven-day plan with the requested schedule", () => {
  assert.ok(profileSchema.safeParse(sampleProfile).success);
  assert.ok(planSchema.safeParse(samplePlan).success);
  assert.deepEqual(constraintIssues(samplePlan, sampleProfile), []);
  assert.equal(samplePlan.days.length, 7);
});

test("grocery list combines quantities and excludes pantry ingredients", () => {
  const groceries = groceriesFor(samplePlan, sampleProfile.pantry);
  assert.equal(groceries.find(item => item.name === "Lemon")?.quantity, 7);
  assert.equal(groceries.find(item => item.name === "Greek yogurt")?.quantity, 1400);
  assert.ok(!groceries.some(item => ["Oats", "Rice", "Olive oil"].includes(item.name)));
});

test("meal swap only changes one item and recomputes groceries and nutrition", () => {
  const original = samplePlan.days[0].meals[0];
  const replacement = { ...structuredClone(original), name: "Strawberry oat bowl", calories: original.calories + 10, ingredients: original.ingredients.map(item => item.name === "Blueberries" ? { ...item, name: "Strawberries" } : item) };
  const next = replaceItem(samplePlan, { kind: "meal", dayIndex: 0, itemIndex: 0 }, replacement);
  assert.equal(next.days[0].meals[0].name, "Strawberry oat bowl");
  assert.equal(samplePlan.days[0].meals[0].name, "Berry & yogurt oat bowl");
  assert.strictEqual(next.days[1], samplePlan.days[1]);
  assert.strictEqual(next.days[0].workout, samplePlan.days[0].workout);
  assert.strictEqual(next.days[0].meals[1], samplePlan.days[0].meals[1]);
  assert.equal(groceriesFor(next, sampleProfile.pantry).find(item => item.name === "Blueberries")?.quantity, 600);
  assert.equal(groceriesFor(next, sampleProfile.pantry).find(item => item.name === "Strawberries")?.quantity, 100);
  assert.equal(mealTotals(next.days[0].meals).calories, mealTotals(samplePlan.days[0].meals).calories + 10);
});

test("exercise swap preserves other workouts and all meals", () => {
  const replacement = { ...samplePlan.days[0].workout.exercises[0], name: "Bodyweight squat", equipment: [] };
  const next = replaceItem(samplePlan, { kind: "exercise", dayIndex: 0, itemIndex: 0 }, replacement);
  assert.equal(next.days[0].workout.exercises[0].name, "Bodyweight squat");
  assert.strictEqual(next.days[0].meals, samplePlan.days[0].meals);
  assert.strictEqual(next.days[1], samplePlan.days[1]);
  assert.deepEqual(groceriesFor(next, sampleProfile.pantry), groceriesFor(samplePlan, sampleProfile.pantry));
});

test("rejects unavailable equipment, explicit allergens, excessive prep and pantry-only violations", () => {
  assert.ok(constraintIssues(samplePlan, { ...sampleProfile, equipment: [] }).some(issue => issue.includes("unavailable equipment")));
  assert.ok(constraintIssues(samplePlan, { ...sampleProfile, allergies: ["Salmon"] }).some(issue => issue.includes("excluded ingredient")));
  assert.ok(constraintIssues(samplePlan, { ...sampleProfile, prepMinutes: 5 }).some(issue => issue.includes("preparation time")));
  assert.ok(constraintIssues(samplePlan, { ...sampleProfile, buyGroceries: false }).some(issue => issue.includes("not in the pantry")));
});
