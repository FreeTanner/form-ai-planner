import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { generationSchema, mealSchema, exerciseSchema } from "../lib/schemas.ts";
import { geminiJsonSchema } from "../lib/gemini-schema.ts";

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey || apiKey.startsWith("your_")) throw new Error("GEMINI_API_KEY is not configured.");
const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
// Opt-in live check: synthetic prompts only, never a user's profile or saved plan.
const client = new GoogleGenAI({ apiKey, httpOptions: { timeout: 30000, retryOptions: { attempts: 1 } } });
for (const [name, schema, field] of [
  ["weekly_plan", generationSchema, "plan"],
  ["meal_replacement", z.object({ feasible: z.boolean(), explanation: z.string(), replacement: mealSchema.nullable() }), "replacement"],
  ["exercise_replacement", z.object({ feasible: z.boolean(), explanation: z.string(), replacement: exerciseSchema.nullable() }), "replacement"],
]) {
  try {
    const response = await client.models.generateContent({
      model,
      contents: `Schema compatibility check only. Return ${JSON.stringify({ feasible: false, explanation: "Diagnostic check", [field]: null })}.`,
      config: { responseMimeType: "application/json", responseJsonSchema: geminiJsonSchema(schema, name), maxOutputTokens: 24000 },
    });
    if (response.candidates?.[0]?.finishReason !== "STOP") throw new Error("Diagnostic generation did not finish.");
    schema.parse(JSON.parse(response.text));
    console.log(JSON.stringify({ model, schema: name, schemaAccepted: true, responseValidated: true }));
  } catch (error) {
    console.error(JSON.stringify({ model, schema: name, status: error.status, message: String(error.message).split(apiKey).join("[REDACTED]").replace(/AIza[\w-]+/g, "[REDACTED]") }));
    process.exitCode = 1;
    break;
  }
}
