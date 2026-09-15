"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Heart, Leaf, Plus, ShoppingBasket, Sparkles, Target, TrendingUp, X } from "lucide-react";
import { profileSchema, type Profile } from "@/lib/schemas";
import { equipmentSummary, hasWeightOptions } from "@/lib/equipment";
import { EquipmentWeightInput } from "./equipment-weights";

const steps = ["You", "Movement", "Food", "Pantry", "Review"];
const goals = [
  { name: "General fitness", text: "Feel stronger, every day", icon: Heart },
  { name: "Fat loss", text: "Build sustainable habits", icon: Target },
  { name: "Muscle gain", text: "Grow strength and muscle", icon: TrendingUp },
  { name: "Maintenance", text: "Keep a good thing going", icon: Leaf },
] as const;

export function TagInput({ label, hint, placeholder, values, onChange, suggestions = [] }: {
  label: string; hint?: string; placeholder: string; values: string[]; onChange: (values: string[]) => void; suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  function commit() {
    const added = draft.split(/[,;\n]/).map(v => v.trim()).filter(Boolean);
    if (added.length) onChange([...new Map([...values, ...added].map(v => [v.toLowerCase(), v])).values()]);
    setDraft("");
  }
  return <div className="field tag-field"><label>{label}<span className="tag-input-box">
    <input value={draft} maxLength={500} placeholder={placeholder} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); } }} />
    <button type="button" className="icon-button add-tag" aria-label={`Add to ${label}`} onClick={commit}><Plus size={18} /></button>
  </span></label>
    {hint && <p className="field-hint">{hint}</p>}
    {values.length > 0 && <div className="tags">{values.map(value => <button type="button" className="tag" key={value} aria-label={`Remove ${value} from ${label}`} onClick={() => onChange(values.filter(v => v !== value))}>{value}<X size={13} /></button>)}</div>}
    {suggestions.some(s => !values.includes(s)) && <div className="suggestions">{suggestions.filter(s => !values.includes(s)).map(s => <button type="button" key={s} onClick={() => onChange([...values, s])}><Plus size={12} />{s}</button>)}</div>}
  </div>;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field">{label}{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}

function feetAndInches(heightCm: number) {
  const tenths = Math.round(heightCm / 2.54 * 10);
  return { feet: Math.floor(tenths / 120), inches: (tenths % 120) / 10 };
}

function ImperialHeight({ height, onChange }: { height: number; onChange: (height: number) => void }) {
  const initial = feetAndInches(height);
  const [feet, setFeet] = useState(height ? String(initial.feet) : "");
  const [inches, setInches] = useState(height ? String(initial.inches) : "");
  function update(nextFeet: string, nextInches: string) {
    setFeet(nextFeet); setInches(nextInches);
    onChange(nextFeet === "" || nextInches === "" ? 0 : (Number(nextFeet) * 12 + Number(nextInches)) * 2.54);
  }
  return <fieldset className="field imperial-height"><legend>Height</legend><div className="height-parts">
    <label className="input-unit"><input aria-label="Height in feet" type="number" inputMode="numeric" required min={3} max={7} step={1} value={feet} onChange={e => update(e.target.value, inches)} /><span>ft</span></label>
    <label className="input-unit"><input aria-label="Height in inches" type="number" inputMode="decimal" required min={0} max={11.9} step="0.1" value={inches} onChange={e => update(feet, e.target.value)} /><span>in</span></label>
  </div></fieldset>;
}

export function Onboarding({ profile, onChange, onGenerate, hasPlan, onClose, step, setStep }: {
  profile: Profile; onChange: (profile: Profile) => void; onGenerate: () => void; hasPlan: boolean; onClose: () => void;
  step: number; setStep: (step: number) => void;
}) {
  const [validation, setValidation] = useState("");
  const patch = <K extends keyof Profile>(key: K, value: Profile[K]) => onChange({ ...profile, [key]: value });
  const titles = ["A little about you.", "Make room for movement.", "Good food. Your way.", "Start with what you have.", "Your week starts here."];
  const descriptions = ["A plan should fit your life. Let's start with the basics.", "A little consistency goes a long way. Tell us what works for you.", "Meals you'll look forward to, built around your preferences.", "Put your pantry to work and keep the shopping list simple.", "One last look before we bring your movement and meals together."];
  const imperial = profile.units === "imperial";
  const heightParts = feetAndInches(profile.height);
  return <div className="onboarding-layout">
    <aside className="onboarding-aside">
      <div className="eyebrow"><span className="small-dot" /> MADE FOR YOUR REAL LIFE</div>
      <h1>Find your <br />everyday <br /><span>balance.</span></h1>
      <p>Movement that fits. <br />Food you enjoy. <br />A week that feels like you.</p>
      <div className="balance-art" aria-hidden="true"><div className="art-orbit" /><div className="art-stone stone-one" /><div className="art-stone stone-two" /><div className="art-stone stone-three" /><span className="art-caption">SMALL STEPS. A STRONGER YOU.</span></div>
      <div className="aside-bottom"><Dumbbell size={18} /><span>Move well</span><span className="divider-dot">·</span><Leaf size={18} /><span>Eat well</span></div>
    </aside>
    <section className="onboarding-main" aria-labelledby="step-title">
      <div className="step-top"><span className="eyebrow">YOUR PERSONAL BLUEPRINT</span>{hasPlan && <button className="text-button" onClick={onClose}>Back to plan <X size={15} /></button>}</div>
      <ol className="stepper" aria-label="Onboarding progress">{steps.map((label, i) => <li key={label} className={i === step ? "current" : i < step ? "done" : ""} aria-current={i === step ? "step" : undefined}><span>{i < step ? <Check size={13} /> : i + 1}</span><small>{label}</small></li>)}</ol>
      <div className="step-heading"><span className="step-caption">STEP {step + 1} OF 5</span><h2 id="step-title">{titles[step]}</h2><p>{descriptions[step]}</p></div>
      <form onSubmit={e => {
        e.preventDefault(); setValidation("");
        if (step === 0 && (profile.height < 120 || profile.height > 230)) {
          setValidation(imperial ? "Please enter a height between 3 ft 11.3 in and 7 ft 6.5 in." : "Please enter a height between 120 and 230 cm."); return;
        }
        if (step < 4) { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
        else {
          const parsed = profileSchema.safeParse(profile);
          if (!parsed.success) { setValidation("Please check your measurements and preferences. This MVP supports adults 18–100, height 120–230 cm, and weight 35–300 kg."); return; }
          if (!profile.buyGroceries && !profile.pantry.length) { setValidation("Add some pantry ingredients, or allow additional groceries."); return; }
          onGenerate();
        }
      }}>
        <div className="step-body" key={step}>
          {step === 0 && <>
            <div className="field-heading"><h3>The basics</h3><div className="segmented compact" aria-label="Measurement units">{(["metric", "imperial"] as const).map(unit => <button type="button" key={unit} aria-pressed={profile.units === unit} className={profile.units === unit ? "selected" : ""} onClick={() => patch("units", unit)}>{unit === "metric" ? "Metric" : "Imperial"}</button>)}</div></div>
            <div className={`form-grid ${imperial ? "imperial-measurements" : "three"}`}>
              <Field label="Age"><div className="input-unit"><input aria-label="Age" type="number" required min={18} max={100} value={profile.age || ""} onChange={e => patch("age", Number(e.target.value))} /><span>years</span></div></Field>
              {!imperial && <Field label="Height"><div className="input-unit"><input aria-label="Height" type="number" required step="0.1" min={120} max={230} value={profile.height ? +profile.height.toFixed(1) : ""} onChange={e => patch("height", Number(e.target.value))} /><span>cm</span></div></Field>}
              <Field label="Weight"><div className="input-unit"><input aria-label="Weight" type="number" required step="0.1" min={imperial ? 77.2 : 35} max={imperial ? 661.3 : 300} value={profile.weight ? +(profile.weight * (imperial ? 2.20462 : 1)).toFixed(1) : ""} onChange={e => patch("weight", Number(e.target.value) / (imperial ? 2.20462 : 1))} /><span>{imperial ? "lb" : "kg"}</span></div></Field>
              {imperial && <ImperialHeight height={profile.height} onChange={value => patch("height", value)} />}
            </div>
            <div className="field"><h3>What would you like to work toward?</h3><div className="goal-grid">{goals.map(({ name, text, icon: Icon }) => <button type="button" className={`goal-option ${profile.goal === name ? "selected" : ""}`} key={name} aria-pressed={profile.goal === name} onClick={() => patch("goal", name)}><span className="goal-icon"><Icon size={21} strokeWidth={1.6} /></span><span><strong>{name}</strong><small>{text}</small></span><span className="radio-dot">{profile.goal === name && <span />}</span></button>)}</div></div>
            <Field label="Your fitness experience"><select value={profile.experience} onChange={e => patch("experience", e.target.value as Profile["experience"])}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></Field>
          </>}
          {step === 1 && <>
            <div className="field"><h3>Workout days per week <span className="subtle-label">{profile.workoutDays} days</span></h3><div className="day-count">{[1, 2, 3, 4, 5, 6, 7].map(n => <button type="button" key={n} className={profile.workoutDays === n ? "selected" : ""} aria-label={`${n} workout days`} aria-pressed={profile.workoutDays === n} onClick={() => patch("workoutDays", n)}>{n}</button>)}</div></div>
            <div className="form-grid"><Field label="Time per workout"><select value={profile.workoutMinutes} onChange={e => patch("workoutMinutes", Number(e.target.value))}>{[10, 15, 20, 30, 45, 60, 90].map(n => <option key={n} value={n}>{n} minutes</option>)}</select></Field><Field label="Where do you work out?"><select value={profile.location} onChange={e => patch("location", e.target.value as Profile["location"])}>{["At home", "At the gym", "Outdoors", "A mix"].map(s => <option key={s}>{s}</option>)}</select></Field></div>
            <TagInput label="Equipment you have" hint="Leave empty for bodyweight only. Add only what you can actually use." placeholder="Add equipment…" values={profile.equipment} onChange={equipment => onChange({ ...profile, equipment, equipmentWeights: profile.equipmentWeights.filter(item => equipment.some(name => name.toLowerCase() === item.equipment.toLowerCase())) })} suggestions={["Dumbbells", "Resistance bands", "Barbell", "Bench", "Pull-up bar", "Kettlebell", "Treadmill", "Exercise bike", "Cable machine", "Medicine ball", "Weighted vest"]} />
            {profile.equipment.filter(hasWeightOptions).map(equipment => <EquipmentWeightInput key={equipment} equipment={equipment} defaultUnit={imperial ? "lb" : "kg"} value={profile.equipmentWeights.find(item => item.equipment === equipment)} onChange={value => patch("equipmentWeights", [...profile.equipmentWeights.filter(item => item.equipment !== equipment), ...(value ? [value] : [])])} />)}
            <TagInput label="Exercises or activities to skip" hint="Optional · tap a suggestion or add your own. Press Enter or use commas to add items." placeholder="Add an exercise or activity…" values={profile.dislikedExercises} onChange={v => patch("dislikedExercises", v)} suggestions={["Burpees", "Running", "Jumping", "Push-ups", "Planks", "Squats", "Lunges", "Cycling"]} />
          </>}
          {step === 2 && <>
            <TagInput label="Dietary preferences & restrictions" placeholder="Add a preference…" values={profile.dietaryPreferences} onChange={v => patch("dietaryPreferences", v)} suggestions={["Vegetarian", "Vegan", "Pescatarian", "Dairy-free", "Gluten-free", "Halal"]} />
            <TagInput label="Food allergies" hint="List every allergy separately. Check ingredient labels when preparing meals." placeholder="e.g. peanuts, shellfish" values={profile.allergies} onChange={v => patch("allergies", v)} />
            <div className="form-grid"><TagInput label="Foods you enjoy" placeholder="e.g. rice, salmon" values={profile.likedFoods} onChange={v => patch("likedFoods", v)} /><TagInput label="Foods you'd rather skip" placeholder="e.g. mushrooms" values={profile.dislikedFoods} onChange={v => patch("dislikedFoods", v)} /></div>
            <div className="form-grid"><Field label="Meals per day"><select value={profile.mealsPerDay} onChange={e => patch("mealsPerDay", Number(e.target.value))}>{[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} meals</option>)}</select></Field><Field label="Cooking time per meal"><select value={profile.prepMinutes} onChange={e => patch("prepMinutes", Number(e.target.value))}>{[5, 10, 15, 20, 30, 45, 60, 90].map(n => <option key={n} value={n}>Up to {n} minutes</option>)}</select></Field></div>
          </>}
          {step === 3 && <>
            <div className="pantry-intro"><span className="large-icon"><ShoppingBasket size={28} strokeWidth={1.4} /></span><div><h3>A little less waste.<br />A little more possibility.</h3><p>We'll build meals around what's already in your kitchen.</p></div></div>
            <TagInput label="In your fridge & pantry" hint="Include staples, oils, and seasonings. For this first version, we'll assume you have enough of each listed item." placeholder="e.g. oats, eggs, spinach, olive oil" values={profile.pantry} onChange={v => patch("pantry", v)} suggestions={["Oats", "Eggs", "Rice", "Chicken breast", "Greek yogurt", "Olive oil", "Salt", "Black pepper"]} />
            <div className="field"><h3>Open to picking up a few things?</h3><div className="choice-stack">{[{ value: true, title: "Yes, I can buy groceries", text: "Use my pantry first, then make a shopping list." }, { value: false, title: "Just what I have", text: "Make meals using only my listed ingredients." }].map(option => <button key={String(option.value)} type="button" className={`choice-card ${profile.buyGroceries === option.value ? "selected" : ""}`} aria-pressed={profile.buyGroceries === option.value} onClick={() => patch("buyGroceries", option.value)}><span><strong>{option.title}</strong><small>{option.text}</small></span><span className="radio-dot">{profile.buyGroceries === option.value && <span />}</span></button>)}</div></div>
          </>}
          {step === 4 && <>
            <div className="review-banner"><Sparkles size={25} strokeWidth={1.5} /><div><strong>One week. Built around you.</strong><p>{profile.workoutDays} workouts · {profile.mealsPerDay * 7} meals · one simple grocery list</p></div></div>
            {[{ title: "Your foundation", to: 0, details: `${profile.goal} · ${profile.experience}\n${profile.age} years · ${imperial ? `${heightParts.feet} ft ${heightParts.inches} in` : `${+profile.height.toFixed(1)} cm`} · ${+(profile.weight * (imperial ? 2.20462 : 1)).toFixed(1)} ${imperial ? "lb" : "kg"}` },
              { title: "Your movement", to: 1, details: `${profile.workoutDays} days/week · ${profile.workoutMinutes} min · ${profile.location}\nEquipment: ${equipmentSummary(profile)}\nSkip: ${profile.dislikedExercises.join(", ") || "Nothing listed"}` },
              { title: "Your food", to: 2, details: `${profile.mealsPerDay} meals/day · Up to ${profile.prepMinutes} min prep\nDiet: ${profile.dietaryPreferences.join(", ") || "No restrictions"}\nAllergies: ${profile.allergies.join(", ") || "None listed"}\nEnjoy: ${profile.likedFoods.join(", ") || "Open to anything"}\nSkip: ${profile.dislikedFoods.join(", ") || "Nothing listed"}` },
              { title: "Your kitchen", to: 3, details: `${profile.pantry.join(", ") || "No pantry ingredients listed"}\n${profile.buyGroceries ? "Additional groceries welcome" : "Pantry ingredients only"}` }].map(section => <div className="review-row" key={section.title}><div><h3>{section.title}</h3><p>{section.details}</p></div><button type="button" className="text-button" onClick={() => setStep(section.to)}>Edit</button></div>)}
            <p className="privacy-note">Your profile is sent to the AI service to create your plan. Your current week is saved only in this browser. Nutrition values are estimates.</p>
          </>}
        </div>
        {validation && <div role="alert" className="error-banner">{validation}</div>}
        <div className="form-footer">{step > 0 ? <button className="text-button back-button" type="button" onClick={() => { setStep(step - 1); setValidation(""); }}><ArrowLeft size={17} />Back</button> : <span className="footer-note"><span className="small-dot" /> About 3 minutes</span>}<button type="submit" className="primary-button">{step === 4 ? <><Sparkles size={17} />{hasPlan ? "Build a new week" : "Create my week"}</> : <>Continue<ArrowRight size={17} /></>}</button></div>
      </form>
    </section>
  </div>;
}
