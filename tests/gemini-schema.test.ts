import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { geminiJsonSchema } from "../lib/gemini-schema";
import { generationSchema, mealSchema, exerciseSchema } from "../lib/schemas";

test("all AI schemas retain structure without nested range and length constraints", () => {
  const schemas = [generationSchema, z.object({ feasible: z.boolean(), explanation: z.string(), replacement: mealSchema.nullable() }), z.object({ feasible: z.boolean(), explanation: z.string(), replacement: exerciseSchema.nullable() })];
  for (const schema of schemas) {
    const wire = geminiJsonSchema(schema, "test");
    const json = JSON.stringify(wire);
    assert.doesNotMatch(json, /"(?:minimum|maximum|exclusiveMinimum|exclusiveMaximum|minLength|maxLength|minItems|maxItems|default|\$schema)":/);
    assert.match(json, /"type":"object"/);
    assert.match(json, /"required":/);
    assert.match(json, /"anyOf":/);
    assert.match(json, /"enum":/);
  }
});

test("schema conversion preserves property names that resemble validation keywords", () => {
  const wire = geminiJsonSchema(z.object({ minimum: z.number().min(2), maxItems: z.array(z.string()).max(3) }), "test");
  const wireObject = wire as unknown as {
    properties: Record<string, unknown>;
  };

  assert.deepEqual(wireObject.properties, {
    minimum: { type: "number" },
    maxItems: { type: "array", items: { type: "string" } }
  });
});