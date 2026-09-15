import { AppError, errorResponse, profileContext, requestBody, structured } from "@/lib/ai";
import { constraintIssues } from "@/lib/plan";
import { generationSchema, profileSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    const profile = profileSchema.parse(await requestBody(request));
    if (!profile.buyGroceries && !profile.pantry.length) throw new AppError("Add the ingredients you have, or allow additional groceries, so there is something to build your meals around.");
    const result = await structured(generationSchema, "weekly_plan", JSON.stringify({ task: "Generate an integrated weekly plan. If infeasible, return feasible false, a helpful explanation, and plan null.", profile: profileContext(profile) }), request.signal);
    if (!result.feasible || !result.plan) throw new AppError(result.explanation || "These preferences could not produce a complete plan. Please adjust your profile.");
    const issues = constraintIssues(result.plan, profile);
    if (issues.length) throw new AppError(`The generated plan didn't meet all your constraints. Please try again. ${issues.slice(0, 2).join(" ")}`);
    return Response.json({ plan: result.plan });
  } catch (error) { return errorResponse(error); }
}
