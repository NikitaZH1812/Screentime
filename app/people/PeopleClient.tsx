"use client";

import { useEffect, useState } from "react";
import type { Person } from "@/lib/types";

const STORAGE_KEY = "screentime.people";

export default function PeopleClient() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [loaded, setLoaded] = useState(false);

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
  }

  return (
    <>
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

      {people.length === 0 ? (
        <p className="empty">Ще нікого не додано.</p>
      ) : (
        <ul>
          {people.map((p) => (
            <li key={p.id}>
              {p.name}
              <button type="button" onClick={() => removePerson(p.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
