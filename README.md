# Form

A mobile-first fitness and meal planner built around real life. Complete a short profile, generate an integrated seven-day plan, explore individual workouts and recipes, shop from a calculated grocery list, and replace one meal or exercise at a time.

## Run locally (Windows PowerShell)

You need Node.js 20.9 or newer and a Gemini API key with available quota for live planning. Create a key in [Google AI Studio](https://aistudio.google.com/apikey).

```powershell
cd D:\Develpment\adaptive-fitness-planner
npm.cmd install
Copy-Item .env.example .env.local
```

Edit `.env.local` in your editor:

```dotenv
GEMINI_API_KEY=your_actual_key
GEMINI_MODEL=gemini-3.5-flash
```

Then run:

```powershell
npm.cmd run dev
```

Open **http://localhost:3000**. Restart the dev server after changing environment variables. `npm.cmd` avoids PowerShell execution-policy restrictions on `npm.ps1`. On macOS/Linux, use `npm` and `cp .env.example .env.local`.

You can select **See a sample** without a key to explore all seven days, expand exercises and recipes, use the grocery checklist, and verify local saving. The sample is explicitly labeled and is never substituted for failed AI requests. AI generation and AI swaps require a key. Creating your own plan uses your onboarding profile, not the sample profile.

## Included

- Five-step onboarding: measurements, goal, experience, workout frequency/time/location/equipment/dislikes, dietary needs/allergies/food preferences, meal count, preparation time, pantry, and grocery preference.
- Metric and imperial display; measurements are stored and sent to the AI in centimeters and kilograms.
- Selecting weight-based equipment reveals available-weight fields with independent lb/kg units (e.g. dumbbells: 5, 10, 15 lb per dumbbell). Enter each size/adjustable setting; for barbells, enter achievable totals including the bar. These values guide exercise selection, reps and starting loads for generation and swaps. Exercise cards show the selected load, and server validation rejects unlisted loads. Blank lists retain effort-based guidance without numeric weight prescriptions. Existing saved profiles/plans remain compatible.
- Server-only Gemini API through the Google GenAI SDK, with JSON Schema structured output generated from Zod for plans and replacements. Returned JSON is validated against the original Zod schemas before use.
- Interactive Monday–Sunday plan with workout details, rest days, recipe steps, ingredients, portions and estimated nutrition.
- Grocery quantities derived from meals, grouped by category, with normalized pantry exclusions and checkboxes.
- Reason-based meal/exercise replacements that change only the selected item. Meal changes update daily nutrition and groceries. Increased ingredient quantities are unchecked so they aren't missed.
- Local browser persistence, loading/cancel states, friendly API errors and clear-data control in the profile view.
- Responsive design, native keyboard-operable controls and dialogs, reduced-motion support, no external font or image dependencies.

## Structure

```text
app/
  page.tsx                 UI state, API calls and local persistence
  globals.css              Responsive design system and component styles
  api/plan/route.ts         Full-week generation and validation
  api/replace/route.ts      Targeted replacement and validation
components/
  onboarding.tsx            Profile wizard
  planner.tsx               Week, meal, exercise, grocery and swap views
lib/
  schemas.ts                Shared Zod schemas and types
  ai.ts                     Server-only AI access and prompts
  plan.ts                   Grocery, nutrition, validation and replacement logic
  sample.ts                 Explicitly labeled example plan
tests/plan.test.ts           Focused data-integrity tests
```

## Verification and production build

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

To verify that your configured Gemini model accepts all three output schemas, run `npm.cmd run check:gemini`. This optional live check uses three small synthetic requests, consumes API quota, and sends no profile or saved-plan data. The normal test suite mocks Gemini and needs no key.

Deploy as a Next.js app to a Node.js host or Vercel. Set `GEMINI_API_KEY` and `GEMINI_MODEL` in the host's server environment; never use a `NEXT_PUBLIC_` variable for the key. The API routes allow up to 180 seconds; ensure your hosting plan supports that execution duration. Generation has a 140-second AI timeout and a 165-second browser timeout, with no automatic retries. Canceling stops the client request; Gemini may still complete and bill for generation already underway. Nothing is deployed automatically.

If upgrading from the OpenAI version, run `npm.cmd install`, set the Gemini variables in your existing `.env.local`, and restart the server. OpenAI variables are no longer used. Keep your existing browser data: saved plans, profiles, and grocery checkmarks use the same format and remain compatible.

## MVP decisions and limits

- This is an adult (18+) general-wellness planner, not clinical nutrition planning. Calories/macros are AI estimates rather than nutrition-database calculations. The UI labels them as estimates. Check food labels for allergies.
- Gemini structured output constrains data shape, not semantic correctness. The API receives a compact structural schema (objects, arrays, required fields, enums and nullable values); nested numeric and length limits are omitted because Gemini can reject their combined complexity with INVALID_ARGUMENT. Local Zod validation still enforces all original limits. Server checks cover schedule counts, time limits, available equipment, explicit excluded ingredients, and pantry constraints. Dietary interpretation and ingredient aliases still depend on the model. Blocked, truncated, malformed, or invalid results are rejected with a retry message, never silently shown as successful.
- Pantry quantities are not tracked. Listed pantry ingredients are assumed to be available in sufficient amounts. The AI maps recipe ingredients to exact pantry entries; grocery aggregation combines equal normalized ingredient names with equal units, without converting units or doing fuzzy ingredient matching.
- If pantry-only constraints cannot make a reasonable week, the API reports infeasibility. The user can add ingredients or allow groceries.
- Exercise swaps preserve the allocated time; meal swaps preserve the meal slot and stay close to the original calories/protein. The remaining plan is kept intact. Profile edits apply to a newly generated week; existing-plan swaps continue to use the profile that produced that plan.
- A single current plan/profile/checklist is stored in this browser. There are no accounts, database, cross-device sync or offline AI. The profile and current plan context are sent to Google Gemini when needed. This integration uses stateless `generateContent` requests; Google's Gemini API data policies apply. There is no OpenAI `store: false` option in this integration.
- Plain CSS replaces Tailwind to keep this small design implementation dependency-light. The app uses system fonts and CSS illustration, with Lucide icons.
- There is no public endpoint abuse protection or authentication in this MVP. Use a controlled preview for deployment; a public launch would need request quotas/rate limiting to protect API spend.

Gemini structured output reference: https://ai.google.dev/gemini-api/docs/structured-output
