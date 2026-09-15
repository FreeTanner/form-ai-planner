import { z } from "zod";
import { AppError, errorResponse, profileContext, requestBody, structured } from "@/lib/ai";
import { constraintIssues, replaceItem } from "@/lib/plan";
import { exerciseSchema, mealSchema, replacementRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    const data = replacementRequestSchema.parse(await requestBody(request));
    const { profile, plan, kind, dayIndex, itemIndex, reason } = data;
    const items = kind === "meal" ? plan.days[dayIndex].meals : plan.days[dayIndex].workout.exercises;
    const original = items[itemIndex];
    if (!original) throw new AppError("This item is no longer available. Close this dialog and choose it again.", 400);
    const input = JSON.stringify({ task: `Replace only the selected ${kind}. Respect the reason, all original constraints, and the surrounding plan. For a meal retain the same slot and stay within roughly 20% of its calories and protein. For an exercise keep its training purpose and do not exceed its allocated minutes. If impossible return feasible false, explanation and replacement null.`, profile: profileContext(profile), plan, selected: { dayIndex, itemIndex, original }, reason });
    const result = kind === "meal"
      ? await structured(z.object({ feasible: z.boolean(), explanation: z.string(), replacement: mealSchema.nullable() }), "meal_replacement", input, request.signal)
      : await structured(z.object({ feasible: z.boolean(), explanation: z.string(), replacement: exerciseSchema.nullable() }), "exercise_replacement", input, request.signal);
    if (!result.feasible || !result.replacement) throw new AppError(result.explanation || "No suitable replacement was found. Try another reason.");
    if (result.replacement.name.trim().toLowerCase() === original.name.trim().toLowerCase()) throw new AppError("The AI returned the same item. Please try a more specific replacement reason.");
    if (kind === "meal") {
      const oldMeal = mealSchema.parse(original);
      const newMeal = mealSchema.parse(result.replacement);
      newMeal.slot = oldMeal.slot;
      if (Math.abs(newMeal.calories - oldMeal.calories) > oldMeal.calories * .25 || Math.abs(newMeal.protein - oldMeal.protein) > Math.max(5, oldMeal.protein * .25)) throw new AppError("That replacement changed the nutrition too much. Please try again.");
      result.replacement = newMeal;
    } else if (exerciseSchema.parse(result.replacement).minutes > exerciseSchema.parse(original).minutes) throw new AppError("That replacement would take too long. Please try again.");
    const next = replaceItem(plan, data, result.replacement);
    const issues = constraintIssues(next, profile);
    if (issues.length) throw new AppError(`That replacement didn't meet your constraints. ${issues.slice(0, 2).join(" ")} Please try again.`);
    return Response.json({ replacement: result.replacement });
  } catch (error) { return errorResponse(error); }
}
