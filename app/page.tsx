"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Leaf, LoaderCircle, ShoppingBasket, Sparkles, UserRound, X } from "lucide-react";
import { Onboarding } from "@/components/onboarding";
import { GroceryView, ReplacementDialog, WeekView } from "@/components/planner";
import { groceriesFor, replaceItem } from "@/lib/plan";
import { defaultProfile, exerciseSchema, mealSchema, planSchema, profileSchema, savedSchema, type Plan, type Profile, type ReplacementTarget } from "@/lib/schemas";
import { samplePlan, sampleProfile } from "@/lib/sample";

type View = "week" | "groceries" | "profile";
const storageKey = "form-planner-v1";

async function post(path: string, body: unknown, signal?: AbortSignal) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "The server couldn't finish your request. Please try again.");
  if (!data) throw new Error("The server returned an incomplete response. Please try again.");
  return data;
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [planProfile, setPlanProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [view, setView] = useState<View>("profile");
  const [checked, setChecked] = useState<string[]>([]);
  const [isSample, setIsSample] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationSeconds, setGenerationSeconds] = useState(0);
  const [error, setError] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const [toast, setToast] = useState("");
  const [target, setTarget] = useState<ReplacementTarget | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [replacementError, setReplacementError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const validProfile = useRef<Profile>(defaultProfile);
  const [profileStep, setProfileStep] = useState(0);
  const clearDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = savedSchema.parse(JSON.parse(raw));
        validProfile.current = saved.profile;
        setProfile(saved.profile); setPlan(saved.plan); setPlanProfile(saved.planProfile); setChecked(saved.checked); setIsSample(saved.isSample);
        if (saved.plan && saved.planProfile) setView("week");
      }
    } catch { setStorageNotice("Your saved week couldn't be restored. You can create a fresh plan below."); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const parsedProfile = profileSchema.safeParse(profile);
    if (parsedProfile.success) validProfile.current = parsedProfile.data;
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, profile: validProfile.current, plan, planProfile, checked, isSample })); }
    catch { setStorageNotice("Browser storage is unavailable. You can still use your plan, but it may not survive a refresh."); }
  }, [ready, profile, plan, planProfile, checked, isSample]);

  useEffect(() => {
    if (!generating) return;
    setGenerationSeconds(0);
    const timer = setInterval(() => setGenerationSeconds(seconds => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [generating]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 4500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { if (confirmClear) clearDialog.current?.showModal(); }, [confirmClear]);

  const navigate = (next: View) => { setView(next); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  async function generate() {
    if (generating) return;
    setGenerating(true); setError("");
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort("timeout"), 165000);
    try {
      const result = await post("/api/plan", profile, abort.signal);
      const generated = planSchema.parse(result.plan);
      setPlan(generated); setPlanProfile(structuredClone(profile)); setIsSample(false); setChecked([]); navigate("week"); setToast("Your week is ready. Make it your own.");
    } catch (e) {
      if (abort.signal.aborted) { if (abort.signal.reason === "timeout") setError("This is taking longer than expected. Please try again. Your previous plan is safe."); }
      else setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally { clearTimeout(timer); setGenerating(false); controller.current = null; }
  }

  async function replace(reason: string) {
    if (!target || !plan || !planProfile || replacing) return;
    setReplacing(true); setReplacementError("");
    try {
      const result = await post("/api/replace", { profile: planProfile, plan, ...target, reason }, AbortSignal.timeout(165000));
      const item = target.kind === "meal" ? mealSchema.parse(result.replacement) : exerciseSchema.parse(result.replacement);
      const next = replaceItem(plan, target, item);
      // If a swap increases a checked ingredient's quantity, make it actionable again.
      const oldItems = new Map(groceriesFor(plan, planProfile.pantry).map(item => [item.key, item.quantity]));
      const nextItems = groceriesFor(next, planProfile.pantry);
      setChecked(previous => previous.filter(key => { const item = nextItems.find(i => i.key === key); return item && item.quantity <= (oldItems.get(key) ?? 0); }));
      setPlan(next); setTarget(null); setToast(target.kind === "meal" ? "Meal replaced. Your grocery list is up to date." : "Exercise replaced. The rest of your week is unchanged.");
    } catch (e) { setReplacementError(e instanceof Error && e.name !== "TimeoutError" ? e.message : "This replacement took too long. Please try again."); }
    finally { setReplacing(false); }
  }

  function showSample() {
    setPlan(structuredClone(samplePlan)); setPlanProfile(structuredClone(sampleProfile)); setChecked([]); setIsSample(true); navigate("week");
  }
  function clearData() {
    controller.current?.abort();
    try { localStorage.removeItem(storageKey); } catch { /* State is still cleared in memory. */ }
    validProfile.current = defaultProfile;
    setProfileStep(0); setProfile({ ...defaultProfile }); setPlan(null); setPlanProfile(null); setChecked([]); setIsSample(false); setConfirmClear(false); setError(""); setTarget(null); setView("profile"); setToast("Your profile and plan have been cleared.");
  }

  if (!ready) return <main className="boot-screen"><span className="brand-mark">f</span><LoaderCircle className="spin" size={20} aria-label="Loading your planner" /></main>;
  return <>
    <header className="app-header"><div className="header-inner"><a className="brand" href="/" aria-label="Form home"><span className="brand-mark">f<span /></span>form<span className="brand-period">.</span></a>
      {plan ? <nav className="desktop-nav" aria-label="Main navigation">{([{ key: "week", label: "My week", icon: CalendarDays }, { key: "groceries", label: "Groceries", icon: ShoppingBasket }, { key: "profile", label: "My profile", icon: UserRound }] as const).map(({ key, label, icon: Icon }) => <button key={key} onClick={() => navigate(key)} disabled={generating} className={view === key ? "active" : ""} aria-current={view === key ? "page" : undefined}><Icon size={16} />{label}</button>)}</nav> : <span className="header-tagline">A healthier week, your way.</span>}
      <div className="header-end">{!plan ? <button className="text-button" disabled={generating} onClick={showSample}>See a sample<ArrowUpRightIcon /></button> : <span className="profile-avatar" aria-label="Personal planner"><UserRound size={19} /></span>}</div>
    </div></header>
    <main className={`app-main ${view === "profile" ? "profile-main" : ""}`}>
      {storageNotice && <div className="notice-banner" role="status">{storageNotice}<button className="icon-button" aria-label="Dismiss storage notice" onClick={() => setStorageNotice("")}><X size={16} /></button></div>}
      {error && <div className="error-banner global-error" role="alert"><span>{error}</span><button className="icon-button" aria-label="Dismiss error" onClick={() => setError("")}><X size={16} /></button></div>}
      {generating ? <section className="generation-screen" aria-live="polite"><div className="generation-symbol"><Leaf size={38} strokeWidth={1.3} /><span /></div><div className="eyebrow">THOUGHTFULLY PUT TOGETHER</div><h1>Your week is taking shape.</h1><p>Bringing your goals, movement, and meals into balance.<br />A complete week usually takes a minute or two.</p><div className="generation-steps"><span><Check size={17} />Your preferences, considered</span><span><span className="spinner dark" />{generationSeconds < 35 ? "Planning movement and recovery" : generationSeconds < 70 ? "Bringing meals and ingredients together" : "Working through your personalized week"}</span></div><div className="generation-skeleton"><div /><div /><div /></div><button className="text-button" onClick={() => controller.current?.abort()}><ArrowLeft size={15} />Cancel and return</button></section>
        : view === "profile" || !plan || !planProfile ? <><Onboarding profile={profile} onChange={setProfile} onGenerate={generate} hasPlan={!!plan} onClose={() => navigate("week")} step={profileStep} setStep={setProfileStep} /><div className="profile-actions"><p>{plan ? "Profile edits apply when you build a new week. Your current plan keeps its original preferences." : "Your profile is saved in this browser as you go."}</p><button className="text-button danger-text" onClick={() => setConfirmClear(true)}>Clear profile & plan</button></div></>
        : view === "groceries" ? <GroceryView plan={plan} profile={planProfile} checked={checked} setChecked={setChecked} />
        : <><WeekView plan={plan} profile={planProfile} isSample={isSample} onReplace={value => { setReplacementError(""); setTarget(value); }} onGroceries={() => navigate("groceries")} />{isSample && <div className="sample-cta"><div><Sparkles size={20} /><span>This is a sample. Your real week starts with you.</span></div><button className="primary-button" onClick={() => navigate("profile")}>Make it personal<ArrowRight size={16} /></button></div>}</>}
    </main>
    <footer className="app-footer"><span className="footer-brand">form.</span><span>Small steps. A stronger you.</span><span>Built around real life.</span></footer>
    {plan && <nav className="mobile-nav" aria-label="Mobile navigation">{([{ key: "week", label: "My week", icon: CalendarDays }, { key: "groceries", label: "Groceries", icon: ShoppingBasket }, { key: "profile", label: "Profile", icon: UserRound }] as const).map(({ key, label, icon: Icon }) => <button key={key} disabled={generating} className={view === key ? "active" : ""} aria-current={view === key ? "page" : undefined} onClick={() => navigate(key)}><Icon size={21} strokeWidth={1.6} /><span>{label}</span></button>)}</nav>}
    {toast && <div role="status" className="toast"><Check size={17} />{toast}</div>}
    {target && plan && <ReplacementDialog target={target} plan={plan} onClose={() => setTarget(null)} onSubmit={replace} busy={replacing} error={replacementError} />}
    {confirmClear && <dialog ref={clearDialog} className="replacement-dialog clear-dialog" aria-labelledby="clear-title" onCancel={() => setConfirmClear(false)}><h2 id="clear-title">Start fresh?</h2><p>This clears your profile, plan, and grocery checkmarks from this browser.</p><div className="clear-actions"><button className="secondary-button" onClick={() => setConfirmClear(false)}>Keep my plan</button><button className="primary-button" onClick={clearData}>Clear everything</button></div></dialog>}
  </>;
}

function ArrowUpRightIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>; }
