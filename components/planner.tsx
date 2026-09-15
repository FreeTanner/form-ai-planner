"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3, Dumbbell, Flame, Leaf, Moon, RefreshCw, ShoppingBasket, Sparkles, Utensils, X } from "lucide-react";
import { groceriesFor, mealTotals } from "@/lib/plan";
import { weightBasis } from "@/lib/equipment";
import type { Exercise, Meal, Plan, Profile, ReplacementTarget } from "@/lib/schemas";

export const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export function WeekView({ plan, profile, onReplace, onGroceries, isSample }: { plan: Plan; profile: Profile; onReplace: (target: ReplacementTarget) => void; onGroceries: () => void; isSample: boolean }) {
  const [dayIndex, setDayIndex] = useState(0);
  const day = plan.days[dayIndex];
  const totals = mealTotals(day.meals);
  return <div className="week-page">
    <div className="page-heading"><div><div className="eyebrow">YOUR WEEK, IN BALANCE {isSample && <span className="sample-badge">SAMPLE PLAN</span>}</div><h1>Your everyday, elevated.</h1><p>A little movement. A good meal. One day at a time.</p></div><span className="week-badge"><span className="small-dot" />7-day plan</span></div>
    <section className="week-intro"><div className="intro-copy"><span className="eyebrow">{profile.goal.toUpperCase()}</span><h2>{plan.title}</h2><p>{plan.summary}</p><div className="intro-meta"><span><Dumbbell size={16} />{profile.workoutDays} workouts</span><span><Utensils size={16} />{profile.mealsPerDay} meals a day</span><span><Clock3 size={16} />{profile.workoutMinutes} min sessions</span></div></div><div className="week-art" aria-hidden="true"><div className="ring ring-one" /><div className="ring ring-two" /><div className="ring ring-three" /><span>ONE DAY<br />AT A TIME</span></div></section>
    <div className="day-selector" role="group" aria-label="Select a day">{dayNames.map((name, i) => <button key={name} aria-label={name} aria-pressed={dayIndex === i} className={dayIndex === i ? "selected" : ""} onClick={() => setDayIndex(i)}><span className="day-short">{name.slice(0, 3)}</span><span className="day-number">{String(i + 1).padStart(2, "0")}</span>{plan.days[i].workout.isRestDay ? <span className="day-rest">—</span> : <span className="day-training-dot" />}</button>)}</div>
    <div className="day-heading"><div><h2>{dayNames[dayIndex]}</h2><p>{day.focus}</p></div><span className="day-tag">{day.workout.isRestDay ? <Moon size={14} /> : <Dumbbell size={14} />}{day.workout.isRestDay ? "Recovery day" : "Training day"}</span></div>
    <div className="daily-layout" key={dayIndex}>
      <div className="movement-column"><div className="section-heading"><h3><Dumbbell size={18} />Movement</h3><span>{day.workout.isRestDay ? "Take it easy" : `${day.workout.minutes} minutes`}</span></div>
        <section className="workout-card card"><div className={`workout-cover ${day.workout.isRestDay ? "rest-cover" : ""}`}><span className="cover-icon">{day.workout.isRestDay ? <Moon size={34} strokeWidth={1.3} /> : <Dumbbell size={34} strokeWidth={1.3} />}</span><span className="eyebrow">{day.workout.isRestDay ? "RECOVER & RESET" : "STRENGTH & CONSISTENCY"}</span><h3>{day.workout.title}</h3><p>{day.workout.isRestDay ? "Rest is part of the plan." : `${day.workout.exercises.length} exercises · ${profile.experience}`}</p><div className="cover-circle" /></div>
          <div className="workout-content"><div className="workout-note"><span className="note-dot" /><div><h4>{day.workout.isRestDay ? "A softer pace" : "Ease into it"}</h4><p>{day.workout.warmup}</p></div></div>
            <div className="exercise-list">{day.workout.exercises.map((exercise, index) => <ExerciseRow key={`${index}-${exercise.name}`} exercise={exercise} index={index} onReplace={() => onReplace({ kind: "exercise", dayIndex, itemIndex: index })} />)}</div>
            {day.workout.cooldown && <div className="workout-note cooldown"><span className="note-dot" /><div><h4>Wind down</h4><p>{day.workout.cooldown}</p></div></div>}
          </div>
        </section>
        <div className="grocery-prompt"><span className="soft-icon"><ShoppingBasket size={22} /></span><div><h3>A well-stocked week.</h3><p>Your meals, turned into a simple list.</p></div><button className="icon-button" aria-label="Open grocery list" onClick={onGroceries}><ArrowUpRight size={20} /></button></div>
      </div>
      <div className="meals-column"><div className="section-heading"><h3><Utensils size={18} />Nourishment</h3><span>{day.meals.length} meals · 1 serving each</span></div>
        <div className="nutrition-strip"><div><Flame size={17} /><strong>{totals.calories.toLocaleString()}</strong><span>kcal</span></div><div><strong>{Math.round(totals.protein)}g</strong><span>protein</span></div><div><strong>{Math.round(totals.carbs)}g</strong><span>carbs</span></div><div><strong>{Math.round(totals.fat)}g</strong><span>fat</span></div></div>
        <div className="meal-list">{day.meals.map((meal, index) => <MealCard key={`${index}-${meal.name}`} meal={meal} index={index} onReplace={() => onReplace({ kind: "meal", dayIndex, itemIndex: index })} />)}</div><p className="estimate-note">Daily nutrition is estimated. Portions are for one person.</p>
      </div>
    </div>
    {plan.notes.length > 0 && <details className="plan-notes"><summary><Sparkles size={16} />A few notes about your week<ChevronDown size={16} /></summary><ul>{plan.notes.map((note, i) => <li key={i}>{note}</li>)}</ul></details>}
  </div>;
}

function ExerciseRow({ exercise, index, onReplace }: { exercise: Exercise; index: number; onReplace: () => void }) {
  return <div className="exercise-row"><span className="exercise-number">{String(index + 1).padStart(2, "0")}</span><details><summary><strong>{exercise.name}</strong><span>{exercise.sets} sets × {exercise.reps}<ChevronDown size={14} /></span>{exercise.loads?.map(load => <span className="exercise-load" key={load.equipment}>{load.equipment}: {load.weight} {load.unit} · {weightBasis(load.equipment)}</span>)}</summary><div className="exercise-detail"><p>{exercise.instructions}</p><div className="detail-chips"><span>{exercise.restSeconds}s rest</span><span>{exercise.minutes} min total</span>{exercise.equipment.map(item => <span key={item}>{item}</span>)}{!exercise.equipment.length && <span>Bodyweight</span>}</div></div></details><button className="icon-button swap-icon" aria-label={`Replace ${exercise.name}`} title="Replace exercise" onClick={onReplace}><RefreshCw size={16} /></button></div>;
}

function MealCard({ meal, index, onReplace }: { meal: Meal; index: number; onReplace: () => void }) {
  return <article className="meal-card card"><div className="meal-topline"><span className={`meal-label meal-label-${index % 3}`}><span className="small-dot" />{meal.slot}</span><span><Clock3 size={13} />{meal.prepMinutes} min</span></div><details><summary><h3>{meal.name}</h3><p>{meal.description}</p><span className="meal-macros">{meal.calories} kcal<span>·</span>{Math.round(meal.protein)}g protein<span className="recipe-link">Recipe<ChevronDown size={14} /></span></span></summary><div className="recipe-detail"><h4>What you'll need <span>1 serving</span></h4><ul className="ingredients-list">{meal.ingredients.map((item, i) => <li key={i}><span>{item.name}</span><span>{formatQuantity(item.quantity)} {item.unit}</span></li>)}</ul><h4>Let's make it</h4><ol>{meal.steps.map((step, i) => <li key={i}>{step}</li>)}</ol><p className="recipe-nutrition">{Math.round(meal.carbs)}g carbs · {Math.round(meal.fat)}g fat · estimates</p></div></details><div className="meal-footer"><span><Leaf size={13} />Made to fit your day</span><button className="text-button" aria-label={`Replace ${meal.name}`} onClick={onReplace}><RefreshCw size={14} />Swap meal</button></div></article>;
}

export function formatQuantity(quantity: number) { return Number(quantity.toFixed(1)).toLocaleString(); }

export function GroceryView({ plan, profile, checked, setChecked }: { plan: Plan; profile: Profile; checked: string[]; setChecked: (value: string[]) => void }) {
  const items = groceriesFor(plan, profile.pantry);
  const complete = items.filter(item => checked.includes(item.key)).length;
  const categories = [...new Set(items.map(item => item.category))];
  return <div className="grocery-page"><div className="page-heading"><div><div className="eyebrow">LESS PLANNING. MORE LIVING.</div><h1>A good week starts here.</h1><p>Everything for your meals, with your pantry already taken care of.</p></div></div>
    <div className="grocery-layout"><div><section className="shopping-summary"><div className="soft-icon"><ShoppingBasket size={26} /></div><div><h2>Your grocery list</h2><p>{items.length ? `${complete} of ${items.length} items picked up` : "Your pantry has this covered"}</p></div><span className="shopping-count">{items.length ? Math.round(complete / items.length * 100) : 100}<small>%</small></span><div className="shopping-progress"><span style={{ width: `${items.length ? complete / items.length * 100 : 100}%` }} /></div></section>
      {items.length === 0 && <div className="empty-groceries card"><Check size={32} /><h3>You're all stocked up.</h3><p>No additional ingredients are needed for this plan. Check that you have enough of each pantry item.</p></div>}
      {categories.map(category => <section className="grocery-category" key={category}><div className="section-heading"><h3>{category}</h3><span>{items.filter(item => item.category === category).length} items</span></div><div className="card grocery-items">{items.filter(item => item.category === category).map(item => <label className={`grocery-item ${checked.includes(item.key) ? "checked" : ""}`} key={item.key}><input type="checkbox" checked={checked.includes(item.key)} onChange={() => setChecked(checked.includes(item.key) ? checked.filter(key => key !== item.key) : [...checked, item.key])} /><span className="custom-checkbox"><Check size={14} /></span><span className="grocery-name">{item.name}</span><span className="grocery-quantity">{formatQuantity(item.quantity)} {item.unit}</span></label>)}</div></section>)}
      {complete > 0 && <button className="text-button reset-checks" onClick={() => setChecked([])}><RefreshCw size={14} />Uncheck all items</button>}
    </div><aside className="pantry-sidebar card"><span className="soft-icon"><Leaf size={23} /></span><h3>Already in your kitchen.</h3><p>These ingredients stay off your shopping list.</p>{profile.pantry.length ? <div className="pantry-tags">{profile.pantry.map(item => <span key={item}><Check size={12} />{item}</span>)}</div> : <p className="muted">No pantry ingredients were listed.</p>}<div className="pantry-footnote">Quantities cover all seven days for one person. Pantry amounts aren't tracked, so check your supplies before shopping.</div></aside></div>
  </div>;
}

export function ReplacementDialog({ target, plan, onClose, onSubmit, busy, error }: { target: ReplacementTarget; plan: Plan; onClose: () => void; onSubmit: (reason: string) => void; busy: boolean; error: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [custom, setCustom] = useState("");
  const item = target.kind === "meal" ? plan.days[target.dayIndex].meals[target.itemIndex] : plan.days[target.dayIndex].workout.exercises[target.itemIndex];
  const reasons = target.kind === "meal" ? ["I don't like this", "Too much preparation", "I don't have these ingredients", "I'd like more variety"] : ["I don't like this", "I don't have this equipment", "Too difficult", "I'd like a lower-impact option"];
  useEffect(() => { dialog.current?.showModal(); const current = dialog.current; return () => current?.close(); }, []);
  return <dialog className="replacement-dialog" ref={dialog} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }} aria-labelledby="replace-title"><div className="dialog-top"><span className="soft-icon"><RefreshCw size={23} /></span><button className="icon-button" aria-label="Close replacement dialog" disabled={busy} onClick={onClose}><X size={20} /></button></div><h2 id="replace-title">A better fit for you.</h2><p>Replace <strong>{item.name}</strong> with something that works for your day.</p><form onSubmit={e => { e.preventDefault(); onSubmit([reason, custom.trim()].filter(Boolean).join(". ")); }}><fieldset disabled={busy}><legend>What would you like to change?</legend><div className="reason-options">{reasons.map(value => <button key={value} type="button" aria-pressed={reason === value} className={reason === value ? "selected" : ""} onClick={() => setReason(reason === value ? "" : value)}>{value}{reason === value && <Check size={15} />}</button>)}</div><label className="field">Anything else? <span className="optional">Optional</span><textarea autoFocus maxLength={350} rows={3} placeholder={target.kind === "meal" ? "e.g. Something I can eat cold at work…" : "e.g. I only have a light resistance band…"} value={custom} onChange={e => setCustom(e.target.value)} /></label></fieldset>{error && <div className="error-banner" role="alert">{error}</div>}<p className="dialog-note">{target.kind === "meal" ? "Your nutrition stays aligned and your grocery list updates automatically." : "We'll keep your training focus and time in mind."} The rest of your week stays as it is.</p><button className="primary-button full-width" type="submit" disabled={busy || (!reason && !custom.trim())}>{busy ? <><span className="spinner" />Finding your replacement…</> : <><Sparkles size={16} />Find a replacement<ArrowRight size={16} /></>}</button></form></dialog>;
}
