import { defaultProfile, type Exercise, type Meal, type Plan, type Profile } from "./schemas";

export const sampleProfile: Profile = { ...defaultProfile, equipment: ["Dumbbells"], pantry: ["Oats", "Olive oil", "Rice", "Salt", "Black pepper"], likedFoods: ["Chicken", "Berries"] };
const breakfast: Meal = {
  name: "Berry & yogurt oat bowl", slot: "Breakfast", description: "Creamy, fresh, and ready before your coffee.", prepMinutes: 5, calories: 510, protein: 31, carbs: 68, fat: 13,
  ingredients: [{ name: "Oats", quantity: 60, unit: "g", category: "Grains & pantry", pantryItem: "Oats" }, { name: "Greek yogurt", quantity: 200, unit: "g", category: "Dairy & alternatives", pantryItem: "" }, { name: "Blueberries", quantity: 100, unit: "g", category: "Produce", pantryItem: "" }, { name: "Almond butter", quantity: 15, unit: "g", category: "Grains & pantry", pantryItem: "" }],
  steps: ["Stir the oats into the yogurt. Add a splash of water if you prefer a softer texture.", "Top with blueberries and almond butter. Let sit for a few minutes, or refrigerate overnight."],
};
const lunch: Meal = {
  name: "Lemon chicken grain bowl", slot: "Lunch", description: "A bright, satisfying bowl with a little crunch.", prepMinutes: 20, calories: 680, protein: 48, carbs: 78, fat: 20,
  ingredients: [{ name: "Chicken breast", quantity: 180, unit: "g", category: "Protein", pantryItem: "" }, { name: "Rice", quantity: 90, unit: "g", category: "Grains & pantry", pantryItem: "Rice" }, { name: "Cucumber", quantity: 100, unit: "g", category: "Produce", pantryItem: "" }, { name: "Cherry tomatoes", quantity: 100, unit: "g", category: "Produce", pantryItem: "" }, { name: "Lemon", quantity: .5, unit: "piece", category: "Produce", pantryItem: "" }, { name: "Olive oil", quantity: 1, unit: "tbsp", category: "Grains & pantry", pantryItem: "Olive oil" }],
  steps: ["Cook the rice according to the package. Meanwhile, dice the chicken and vegetables.", "Heat the olive oil in a skillet and cook the chicken until it reaches 165°F / 74°C internally.", "Spoon rice into a bowl. Add chicken and vegetables, then finish with lemon juice."],
};
const dinner: Meal = {
  name: "Salmon with greens & couscous", slot: "Dinner", description: "A simple skillet supper to round out your day.", prepMinutes: 20, calories: 740, protein: 48, carbs: 70, fat: 30,
  ingredients: [{ name: "Salmon", quantity: 180, unit: "g", category: "Protein", pantryItem: "" }, { name: "Couscous", quantity: 90, unit: "g", category: "Grains & pantry", pantryItem: "" }, { name: "Spinach", quantity: 100, unit: "g", category: "Produce", pantryItem: "" }, { name: "Lemon", quantity: .5, unit: "piece", category: "Produce", pantryItem: "" }, { name: "Olive oil", quantity: 1, unit: "tbsp", category: "Grains & pantry", pantryItem: "Olive oil" }],
  steps: ["Cover the couscous with boiling water according to the package and let stand.", "Heat olive oil in a skillet. Cook the salmon until it reaches 145°F / 63°C internally; transfer to a plate.", "Wilt the spinach in the same skillet. Serve with the couscous, salmon, and lemon."],
};
const exercises: Exercise[] = [
  { name: "Goblet squat", sets: 3, reps: "10–12 reps", restSeconds: 60, minutes: 6, equipment: ["Dumbbells"], instructions: "Hold one dumbbell close to your chest. Sit down between your hips, keeping your whole foot grounded. Stand tall. Choose a weight that leaves two or three comfortable reps in reserve." },
  { name: "Dumbbell floor press", sets: 3, reps: "10–12 reps", restSeconds: 60, minutes: 6, equipment: ["Dumbbells"], instructions: "Lie on the floor with your knees bent. Keep elbows about 45 degrees from your torso. Press the dumbbells up, then lower slowly until your upper arms gently touch the floor." },
  { name: "Bent-over dumbbell row", sets: 3, reps: "10–12 reps", restSeconds: 60, minutes: 6, equipment: ["Dumbbells"], instructions: "Hinge at your hips with a long, neutral back. Draw your elbows toward your hips without shrugging. Lower the weights with control." },
  { name: "Dead bug", sets: 2, reps: "8 reps per side", restSeconds: 30, minutes: 4, equipment: [], instructions: "Lie on your back with knees above hips and arms pointing up. Slowly lower one arm and the opposite leg while keeping your back gently against the floor. Alternate sides." },
];
export const samplePlan: Plan = {
  title: "A little stronger, every day.", summary: "Three focused strength sessions, simple meals, and room to recover. A balanced rhythm to make feeling good part of your everyday.",
  notes: ["This is a sample for a beginner with dumbbells, not a personalized AI-generated plan.", "Meals repeat here to demonstrate ingredient reuse. Your AI plan will be built around your own preferences.", "Pantry ingredients are assumed to be available in sufficient quantities."],
  days: Array.from({ length: 7 }, (_, i) => ({
    focus: i % 2 === 0 && i < 5 ? ["Build your foundation", "", "Find your rhythm", "", "Finish feeling strong"][i] : "Make space to recover",
    workout: i % 2 === 0 && i < 5 ? { title: "Full-body foundations", isRestDay: false, minutes: 30, warmup: "4 minutes of easy marching, arm circles, and gentle bodyweight squats.", cooldown: "4 minutes of relaxed walking and comfortable stretching.", exercises: structuredClone(exercises) } : { title: "Rest & recharge", isRestDay: true, minutes: 0, warmup: "Take an easy walk if it feels good, or simply enjoy a day off. Recovery is part of getting stronger.", cooldown: "", exercises: [] },
    meals: structuredClone([breakfast, lunch, dinner]),
  })),
};
