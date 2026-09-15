import assert from "node:assert/strict";
import test from "node:test";
import { hasWeightOptions, selectedWeights, weightBasis } from "../lib/equipment";
import { constraintIssues } from "../lib/plan";
import { profileSchema, savedSchema, type Profile } from "../lib/schemas";
import { samplePlan, sampleProfile } from "../lib/sample";

const profile: Profile = { ...sampleProfile, equipmentWeights: [{ equipment: "Dumbbells", unit: "lb", values: [5, 10, 15] }] };
function loadedPlan() {
  const plan = structuredClone(samplePlan);
  for (const day of plan.days) for (const exercise of day.workout.exercises) {
    exercise.loads = exercise.equipment.map(equipment => ({ equipment, weight: 10, unit: "lb" }));
  }
  return plan;
}

test("recognizes weighted equipment and distinguishes per-item and total-bar weights", () => {
  for (const item of ["Adjustable dumbbells", "Kettlebell", "Barbell", "EZ bar", "Medicine ball", "Cable machine", "Weighted vest"]) assert.ok(hasWeightOptions(item));
  for (const item of ["Bench", "Pull-up bar", "Resistance bands", "Treadmill"]) assert.ok(!hasWeightOptions(item));
  assert.equal(weightBasis("Barbell"), "total including the bar");
  assert.equal(weightBasis("Dumbbells"), "per item");
});

test("accepts available weights and rejects invented increments, wrong units and omitted loads", () => {
  assert.deepEqual(constraintIssues(loadedPlan(), profile), []);
  for (const load of [{ equipment: "Dumbbells", weight: 12, unit: "lb" as const }, { equipment: "Dumbbells", weight: 10, unit: "kg" as const }]) {
    const plan = loadedPlan();
    plan.days[0].workout.exercises[0].loads = [load];
    assert.ok(constraintIssues(plan, profile).some(issue => issue.includes("unavailable weight")));
  }
  assert.ok(constraintIssues(samplePlan, profile).some(issue => issue.includes("needs one starting load")));
});

test("bodyweight exercises cannot carry equipment loads and removed equipment weights are ignored", () => {
  const plan = loadedPlan();
  plan.days[0].workout.exercises[3].loads = [{ equipment: "Dumbbells", weight: 10, unit: "lb" }];
  assert.ok(constraintIssues(plan, profile).some(issue => issue.includes("unavailable weight")));
  assert.deepEqual(selectedWeights({ ...profile, equipment: [] }), []);
});

test("old saved profiles and plans load with no weight inventory, while new weights persist", () => {
  const { equipmentWeights, ...oldProfile } = sampleProfile;
  const saved = savedSchema.parse({ version: 1, profile: oldProfile, planProfile: oldProfile, plan: samplePlan, checked: [] });
  assert.deepEqual(saved.profile.equipmentWeights, []);
  assert.deepEqual(constraintIssues(saved.plan!, saved.profile), []);
  assert.deepEqual(profileSchema.parse(JSON.parse(JSON.stringify(profile))).equipmentWeights, profile.equipmentWeights);
  assert.equal(profileSchema.safeParse({ ...profile, equipmentWeights: [{ equipment: "Dumbbells", values: [-5], unit: "lb" }] }).success, false);
});
