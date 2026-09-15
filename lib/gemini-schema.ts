import { z } from "zod";

// Gemini can reject large combinations of nested length/range constraints with
// INVALID_ARGUMENT. Constrain structure on the wire; enforce every value bound
// with the original Zod schema after generation.
export function geminiJsonSchema(schema: z.ZodType, name: string) {
  function structural(node: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of ["type", "enum", "required", "description", "title"]) {
      if (node[key] !== undefined) result[key] = node[key];
    }
    if (node.const !== undefined) result.enum = [node.const];
    if (node.properties) result.properties = Object.fromEntries(Object.entries(node.properties as Record<string, Record<string, unknown>>).map(([key, value]) => [key, structural(value)]));
    if (node.items) result.items = structural(node.items as Record<string, unknown>);
    for (const key of ["anyOf", "oneOf"]) {
      if (node[key]) result[key] = (node[key] as Record<string, unknown>[]).map(structural);
    }
    if (typeof node.additionalProperties === "boolean") result.additionalProperties = node.additionalProperties;
    else if (node.additionalProperties) result.additionalProperties = structural(node.additionalProperties as Record<string, unknown>);
    return result;
  }
  return { ...structural(z.toJSONSchema(schema)), title: name };
}
