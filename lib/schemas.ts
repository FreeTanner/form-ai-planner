import { z } from "zod";

const text = z.string().trim().max(1600);
const tags = z.array(z.string().trim().min(1).max(100)).max(50);
export const equipmentWeightsSchema = z.object({
  equipment: z.string().trim().min(1).max(100),
  unit: z.enum(["kg", "lb"]),
  values: z.array(z.number().positive().max(2000)).min(1).max(100),
});
export type EquipmentWeights = z.infer<typeof equipmentWeightsSchema>;
export const profileSchema = z.object({
  age: z.number().int().min(18).max(100),
  height: z.number().min(120).max(230),
  weight: z.number().min(35).max(300),
  units: z.enum(["metric", "imperial"]),
  goal: z.enum(["General fitness", "Fat loss", "Muscle gain", "Maintenance"]),
  experience: z.enum(["Beginner", "Intermediate", "Advanced"]),
  workoutDays: z.number().int().min(1).max(7),
  workoutMinutes: z.number().int().min(10).max(120),
  location: z.enum(["At home", "At the gym", "Outdoors", "A mix"]),
  equipment: tags,
  equipmentWeights: z.array(equipmentWeightsSchema).max(50).default([]),
  dislikedExercises: tags,
  dietaryPreferences: tags,
  allergies: tags,
  likedFoods: tags,
  dislikedFoods: tags,
  mealsPerDay: z.number().int().min(2).max(5),
  prepMinutes: z.number().int().min(5).max(90),
  pantry: tags,
  buyGroceries: z.boolean(),
});
export type Profile = z.infer<typeof profileSchema>;

export const defaultProfile: Profile = {
  age: 30, height: 170, weight: 70, units: "metric", goal: "General fitness",
  experience: "Beginner", workoutDays: 3, workoutMinutes: 30, location: "At home",
  equipment: [], equipmentWeights: [], dislikedExercises: [], dietaryPreferences: [], allergies: [],
  likedFoods: [], dislikedFoods: [], mealsPerDay: 3, prepMinutes: 20, pantry: [], buyGroceries: true,
};

export const ingredientSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().positive().max(10000),
  unit: z.enum(["g", "ml", "piece", "tsp", "tbsp"]),
  category: z.enum(["Produce", "Protein", "Dairy & alternatives", "Grains & pantry", "Other"]),
  pantryItem: z.string().max(100).describe("Exact matching entry from the user's pantry, or empty string if not available."),
});
export const mealSchema = z.object({
  name: z.string().min(1).max(120),
  slot: z.string().min(1).max(40),
  description: text,
  prepMinutes: z.number().int().min(1).max(180),
  calories: z.number().int().min(1).max(2500),
  protein: z.number().min(0).max(250),
  carbs: z.number().min(0).max(400),
  fat: z.number().min(0).max(200),
  ingredients: z.array(ingredientSchema).min(1).max(15),
  steps: z.array(z.string().min(1).max(500)).min(1).max(6),
});
export const exerciseSchema = z.object({
  name: z.string().min(1).max(100),
  sets: z.number().int().min(1).max(10),
  reps: z.string().min(1).max(60),
  restSeconds: z.number().int().min(0).max(300),
  minutes: z.number().min(1).max(120).describe("Total time for all sets, including rest."),
  equipment: z.array(z.string().max(100)).max(8).describe("Only exact entries from available equipment. Empty for bodyweight."),
  loads: z.array(z.object({
    equipment: z.string().min(1).max(100),
    weight: z.number().positive().max(2000),
    unit: z.enum(["kg", "lb"]),
  })).max(8).optional().describe("Prescribed starting loads. For every equipment item with specified available weights, choose exactly one of those weights in its original unit. Per implement, or total including bar for barbells. Empty for bodyweight or unspecified weights."),
  instructions: text,
});
export const daySchema = z.object({
  focus: z.string().min(1).max(80),
  workout: z.object({
    title: z.string().min(1).max(100),
    isRestDay: z.boolean(),
    minutes: z.number().int().min(0).max(120),
    warmup: text,
    cooldown: text,
    exercises: z.array(exerciseSchema).max(10),
  }),
  meals: z.array(mealSchema).min(2).max(5),
});
export const planSchema = z.object({
  title: z.string().min(1).max(100),
  summary: text,
  notes: z.array(z.string().max(500)).max(5),
  days: z.array(daySchema).length(7),
});
export const generationSchema = z.object({
  feasible: z.boolean(),
  explanation: text,
  plan: planSchema.nullable(),
});
export type Plan = z.infer<typeof planSchema>;
export type Meal = z.infer<typeof mealSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export const replacementRequestSchema = z.object({
  profile: profileSchema,
  plan: planSchema,
  kind: z.enum(["meal", "exercise"]),
  dayIndex: z.number().int().min(0).max(6),
  itemIndex: z.number().int().min(0).max(9),
  reason: z.string().trim().min(1).max(500),
});
export type ReplacementTarget = { kind: "meal" | "exercise"; dayIndex: number; itemIndex: number };

export const savedSchema = z.object({
  version: z.literal(1), profile: profileSchema, plan: planSchema.nullable(),
  planProfile: profileSchema.nullable(), checked: z.array(z.string()).max(500),
  isSample: z.boolean().default(false),
});
