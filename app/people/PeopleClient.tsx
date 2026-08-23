"use client";

import { useEffect, useState } from "react";
import type { Brain, Person } from "@/lib/types";
import { pickFilm, type Recommendation } from "@/lib/recommend";

const STORAGE_KEY = "screentime.people";

const TIME_OPTIONS = [
  { label: "до 1 год", maxMinutes: 60 },
  { label: "до 1.5 год", maxMinutes: 90 },
  { label: "до 2.5 год", maxMinutes: 150 },
  { label: "без обмежень", maxMinutes: 999 },
];

const BRAIN_OPTIONS: { value: Brain; label: string }[] = [
  { value: "light", label: "зовсім немає сил" },
  { value: "heavy", label: "готові подумати" },
];

export default function PeopleClient() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [maxMinutes, setMaxMinutes] = useState(TIME_OPTIONS[1].maxMinutes);
  const [brain, setBrain] = useState<Brain>("light");
  const [result, setResult] = useState<Recommendation | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setPeople(JSON.parse(raw));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  }, [people, loaded]);

  function addPerson(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setPeople((prev) => [...prev, { id: crypto.randomUUID(), name: trimmed }]);
    setName("");
  }

  function removePerson(id: string) {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  }

  function toggleSelected(id: string) {
    setResult(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }

  function search() {
    const names = people.filter((p) => selectedIds.includes(p.id)).map((p) => p.name);
    setResult(pickFilm({ people: names, maxMinutes, brain }));
  }

  return (
    <>
      <section>
        <h2>Хто дивиться</h2>
        {people.length === 0 ? (
          <p className="empty">Ще нікого не додано.</p>
        ) : (
          <ul className="chips">
            {people.map((p) => (
              <li
                key={p.id}
                className={selectedIds.includes(p.id) ? "chip selected" : "chip"}
                onClick={() => toggleSelected(p.id)}
              >
                {p.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePerson(p.id);
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addPerson}>
          <input
            type="text"
            placeholder="Ім'я"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" disabled={!name.trim()}>
            Додати
          </button>
        </form>
      </section>

      {people.length > 0 && (
        <section>
          <h2>Який вечір</h2>

          <p className="dial-label">Скільки часу є</p>
          <ul className="chips">
            {TIME_OPTIONS.map((opt) => (
              <li
                key={opt.label}
                className={maxMinutes === opt.maxMinutes ? "chip selected" : "chip"}
                onClick={() => {
                  setResult(null);
                  setMaxMinutes(opt.maxMinutes);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>

          <p className="dial-label">Скільки лишилось сил</p>
          <ul className="chips">
            {BRAIN_OPTIONS.map((opt) => (
              <li
                key={opt.value}
                className={brain === opt.value ? "chip selected" : "chip"}
                onClick={() => {
                  setResult(null);
                  setBrain(opt.value);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="search"
            disabled={selectedIds.length === 0}
            onClick={search}
          >
            Знайти фільм
          </button>
        </section>
      )}

      {result && (
        <section className="result">
          <h2>{result.film.title}</h2>
          <p className="meta">
            {result.film.year} · {result.film.genre}
          </p>
          <p className="reason">{result.reason}</p>
        </section>
      )}
    </>
  );
}
