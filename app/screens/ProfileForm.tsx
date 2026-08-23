"use client";

import { useState } from "react";
import { GENRES, SERVICES } from "@/lib/genres";
import { emptyPerson, type Person } from "@/lib/types";
import TagInput from "../components/TagInput";
import FilmSearch from "../components/FilmSearch";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <p className="mb-1 text-sm text-white/70">{label}</p>
      {hint && <p className="mb-2.5 text-xs text-white/30">{hint}</p>}
      {!hint && <div className="mb-2.5" />}
      {children}
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm transition ${
        on
          ? "border-white bg-white text-black"
          : "border-white/10 bg-white/[0.03] text-white/70"
      }`}
    >
      {children}
    </button>
  );
}

export default function ProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Person;
  onSave: (person: Person) => void;
  onCancel: () => void;
}) {
  const [person, setPerson] = useState<Person>(initial ?? emptyPerson());

  function set<K extends keyof Person>(key: K, value: Person[K]) {
    setPerson((p) => ({ ...p, [key]: value }));
  }

  function toggle(key: "genre_exclusions" | "subscriptions", item: string) {
    const list = person[key];
    set(
      key,
      list.includes(item) ? list.filter((x) => x !== item) : [...list, item],
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="mb-8 self-start text-sm text-white/40"
      >
        ← назад
      </button>

      <Field label="Ім'я">
        <input
          type="text"
          value={person.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="як тебе звати"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] placeholder:text-white/25 focus:border-white/30 focus:outline-none"
        />
      </Field>

      <Field label="Заборонені жанри" hint="ніколи не пропонувати">
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Chip
              key={g.label}
              on={person.genre_exclusions.includes(g.label)}
              onClick={() => toggle("genre_exclusions", g.label)}
            >
              {g.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field
        label="Заборонені типи"
        hint="вужче за жанр: «замки і дракони», «магія», «зомбі»"
      >
        <TagInput
          value={person.type_exclusions}
          onChange={(v) => set("type_exclusions", v)}
          placeholder="написати і натиснути Enter"
        />
      </Field>

      <Field label="Приклади хорошого" hint="2–3 фільми, які зайшли">
        <FilmSearch
          value={person.good_examples}
          onChange={(v) => set("good_examples", v)}
          placeholder="почни писати назву"
        />
      </Field>

      <Field label="Приклади поганого" hint="те, від чого було нудно чи бридко">
        <FilmSearch
          value={person.bad_examples}
          onChange={(v) => set("bad_examples", v)}
          placeholder="почни писати назву"
        />
      </Field>

      <Field label="Де дивишся">
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <Chip
              key={s}
              on={person.subscriptions.includes(s)}
              onClick={() => toggle("subscriptions", s)}
            >
              {s}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Українська аудіодоріжка">
        <div className="flex gap-2">
          <Chip
            on={person.requires_ukrainian_audio}
            onClick={() => set("requires_ukrainian_audio", true)}
          >
            обов'язково
          </Chip>
          <Chip
            on={!person.requires_ukrainian_audio}
            onClick={() => set("requires_ukrainian_audio", false)}
          >
            не обов'язково
          </Chip>
        </div>
      </Field>

      <div className="mt-auto pt-4 pb-2">
        <button
          type="button"
          onClick={() => onSave({ ...person, name: person.name.trim() })}
          disabled={!person.name.trim()}
          className="w-full rounded-2xl bg-white py-4 font-semibold text-black disabled:opacity-25"
        >
          Зберегти профіль
        </button>
      </div>
    </>
  );
}
