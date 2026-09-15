import assert from "node:assert/strict";
import test from "node:test";
import { POST as generate } from "../app/api/plan/route";
import { POST as replace } from "../app/api/replace/route";
import { samplePlan, sampleProfile } from "../lib/sample";

function request(body: unknown) {
  return new Request("http://localhost:3000/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

test("API rejects invalid profile and empty pantry-only requests before AI access", async () => {
  assert.equal((await generate(request({ age: 2 }))).status, 400);
  const pantryResponse = await generate(request({ ...sampleProfile, pantry: [], buyGroceries: false }));
  assert.equal(pantryResponse.status, 422);
  assert.match((await pantryResponse.json()).error, /Add the ingredients/);
});

test("API rejects an invalid replacement target without changing the plan", async () => {
  const response = await replace(request({ profile: sampleProfile, plan: samplePlan, kind: "exercise", dayIndex: 1, itemIndex: 0, reason: "Too difficult" }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /no longer available/);
});

test("missing API key gives a clear setup error, never a fake generated plan", async () => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const response = await generate(request(sampleProfile));
    assert.equal(response.status, 503);
    const result = await response.json();
    assert.match(result.error, /GEMINI_API_KEY/);
    assert.equal(result.plan, undefined);
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});
