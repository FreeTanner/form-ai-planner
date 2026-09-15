"use client";

import { useState } from "react";
import { weightBasis } from "@/lib/equipment";
import type { EquipmentWeights } from "@/lib/schemas";

export function EquipmentWeightInput({ equipment, value, defaultUnit, onChange }: {
  equipment: string; value?: EquipmentWeights; defaultUnit: "kg" | "lb";
  onChange: (value: EquipmentWeights | undefined) => void;
}) {
  const [draft, setDraft] = useState(value?.values.join(", ") ?? "");
  const [unit, setUnit] = useState<"kg" | "lb">(value?.unit ?? defaultUnit);
  const [error, setError] = useState("");

  function parse(raw: string) {
    if (!raw.trim()) return [];
    const entries = raw.split(/[,;\n]/).map(item => item.trim()).filter(Boolean);
    if (!entries.length || entries.some(item => !/^\d+(\.\d+)?$/.test(item) || Number(item) <= 0 || Number(item) > 2000) || entries.length > 100) return null;
    return [...new Set(entries.map(Number))].sort((a, b) => a - b);
  }
  function save(raw: string, nextUnit: "kg" | "lb") {
    const values = parse(raw);
    if (values === null) return;
    onChange(values.length ? { equipment, unit: nextUnit, values } : undefined);
  }

  return <div className="equipment-weight-card">
    <div className="equipment-weight-heading"><strong>{equipment}</strong><label>Units<select aria-label={`${equipment} weight units`} value={unit} disabled={!!error} onChange={event => {
      const nextUnit = event.target.value as "kg" | "lb";
      const values = parse(draft);
      // Preserve the physical weights when changing units, independently of body units.
      const nextDraft = values?.map(amount => +(amount * (nextUnit === "kg" ? 1 / 2.20462 : 2.20462)).toFixed(3)).join(", ") ?? draft;
      setUnit(nextUnit); setDraft(nextDraft); save(nextDraft, nextUnit);
    }}><option value="lb">lb</option><option value="kg">kg</option></select></label></div>
    <label className="field">Available weights ({weightBasis(equipment)})
      <input className="equipment-weight-input" aria-label={`${equipment} available weights`} type="text" maxLength={800} placeholder={unit === "lb" ? "e.g. 5, 10, 15, 20" : "e.g. 2.5, 5, 7.5, 10"} value={draft} aria-invalid={!!error} onChange={event => {
        const raw = event.target.value;
        const message = parse(raw) === null ? "Enter individual weights separated by commas, e.g. 5, 10, 15." : "";
        event.target.setCustomValidity(message); setError(message); setDraft(raw); save(raw, unit);
      }} />
    </label>
    <p className="field-hint">{error || (/barbell|\bez[ -]?bar\b|smith machine/i.test(equipment) ? "List total weights you can assemble, including the bar—not individual plates." : "List each size or adjustable setting you have, separated by commas. Leave blank if unsure.")}</p>
  </div>;
}
