import Anthropic from "@anthropic-ai/sdk";
import type {
  BrainLevel,
  Candidate,
  Era,
  FilmRef,
  Person,
  Pick,
  TimeBucket,
} from "./types";

const MODEL = "claude-sonnet-4-6";

const SYSTEM = `Ти підбираєш ОДИН фільм на сьогоднішній вечір для людей, які зараз у кімнаті.

Правила, які не обговорюються:
- Ти обираєш РІВНО ОДИН фільм зі списку кандидатів. Ти не називаєш нічого поза списком.
- Смак групи — це не середнє і не перетин смаків окремих людей. Пара дивиться те, чого не обрав би поодинці ніхто з них. "Щось середнє" — це фільм, який не подобається нікому. Обирай те, що працює для них разом.
- Заборонені жанри і заборонені типи — жорсткі. Якщо кандидат підпадає під будь-яку заборону будь-кого з групи, він викреслений, навіть якщо ідеально підходить в усьому іншому. "Заборонені типи" вужчі за жанр ("замки і дракони", "магія") — TMDB такого не вміє відфільтрувати, тому це цілком на тобі: читай опис кандидата і викреслюй сам.
- "Не зайшло" — це не заборона, а сигнал. Уникай того, що схоже, але не викреслюй механічно.
- Побажання вечора (жанр, епоха) — м'які. Сильний нахил, але не обов'язок.
- Якщо в кімнаті діти — це ЖОРСТКО, як заборонений жанр. Ніякого насильства, сексуального контенту, важкого хорору чи тем, що не годяться дітям, навіть якщо жоден заборонений жанр формально не спрацював. TMDB-фільтр за віковим рейтингом це підстрахує лише частково — фінальне рішення на тобі: читай опис.

Рядок пояснення — обов'язковий і найважливіший. З одним варіантом промах — цілком наша провина, і пояснення це те, що робить промах читабельним як "воно нас ще не знає", а не як "ця штука видає рандом".

Формат пояснення: смаковий якір + доступність + практичність.
- Смаковий якір мусить посилатися на щось конкретне про ЦИХ людей — їхній приклад хорошого, за назвою. Не загальні слова про фільм.
- Доступність: назви сервіс із їхнього списку підписок і згадай українську аудіодоріжку, якщо вона їм потрібна.
- Практичність: тривалість і чому вона пасує до їхнього стану.

Приклад тону: "Ви обидві любили Prisoners — тут той самий повільний тиск; на Netflix, 1год 50."

Пиши українською, одним реченням, без преамбул і без списків.`;

function timeLabel(t: TimeBucket) {
  return { short: "менше 1.5 години", medium: "приблизно 2 години", any: "час не обмежений" }[t];
}

function brainLabel(b: BrainLevel) {
  return b === "low"
    ? "мозку не лишилось — нічого, що вимагає зусиль"
    : "цілком здатні на щось складніше";
}

function eraLabel(e: Era) {
  return { old: "хочеться перевіреної класики", new: "хочеться чогось нового", any: "не важливо" }[e];
}

function filmList(films: FilmRef[]) {
  return (
    films.map((f) => (f.year ? `${f.title} (${f.year})` : f.title)).join(", ") ||
    "—"
  );
}

function groupContext(people: Person[]) {
  return people
    .map((p) =>
      [
        `${p.name}:`,
        `  любить: ${filmList(p.good_examples)}`,
        `  не зайшло: ${filmList(p.bad_examples)}`,
        `  заборонені жанри: ${p.genre_exclusions.join(", ") || "—"}`,
        `  заборонені типи: ${p.type_exclusions.join(", ") || "—"}`,
        `  підписки: ${p.subscriptions.join(", ") || "—"}`,
        `  українська аудіодоріжка обов'язкова: ${p.requires_ukrainian_audio ? "так" : "ні"}`,
      ].join("\n"),
    )
    .join("\n\n");
}

function candidateList(candidates: Candidate[]) {
  return candidates
    .map(
      (c) =>
        `[${c.tmdb_id}] ${c.title}${c.year ? ` (${c.year})` : ""} · ${
          c.runtime ? `${c.runtime}хв` : "тривалість невідома"
        } · ${c.genres.join(", ")} · ${c.vote_average.toFixed(1)}\n${c.overview.slice(0, 300)}`,
    )
    .join("\n\n");
}

/**
 * Stage 2 of the pipeline: the model picks, it never retrieves.
 *
 * tmdb_id is an enum over the candidate ids with strict validation, so a film
 * that is not on the list is structurally impossible to return.
 */
export async function pickOne(opts: {
  people: Person[];
  candidates: Candidate[];
  time: TimeBucket;
  brain: BrainLevel;
  genreWish: string | null;
  era: Era;
  kidsInRoom: boolean;
  relaxed: string[];
  refusedTitles: string[];
}): Promise<Pick> {
  const client = new Anthropic();
  const ids = opts.candidates.map((c) => c.tmdb_id);

  const relaxNote = opts.relaxed.length
    ? `\n\nУВАГА: під ці обмеження нічого пристойного не знайшлось, тому послаблено: ${opts.relaxed.join(", ")}. Скажи про це в поясненні чесно і коротко, на кшталт "нічого з жахів під ваш час — найближче, що є:".`
    : "";

  const retryNote = opts.refusedTitles.length
    ? `\n\nЦього вечора вони вже відмовились від: ${opts.refusedTitles.join(", ")}. Не пропонуй щось у тому ж дусі.`
    : "";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: SYSTEM,
    tools: [
      {
        name: "pick_film",
        description: "Обрати рівно один фільм зі списку кандидатів.",
        input_schema: {
          type: "object",
          properties: {
            tmdb_id: {
              type: "number",
              enum: ids,
              description: "id обраного фільму — тільки зі списку кандидатів",
            },
            reason: {
              type: "string",
              description:
                "Одне речення українською: смаковий якір + доступність + практичність.",
            },
          },
          required: ["tmdb_id", "reason"],
          additionalProperties: false,
        },
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: "pick_film" },
    messages: [
      {
        role: "user",
        content: `Хто дивиться:\n\n${groupContext(opts.people)}\n\nСьогоднішній вечір:\n- часу: ${timeLabel(
          opts.time,
        )}\n- стан: ${brainLabel(opts.brain)}\n- хочеться: ${
          opts.genreWish ?? "нічого конкретного, вирішуй сам"
        }\n- епоха: ${eraLabel(opts.era)}\n- у кімнаті діти: ${
          opts.kidsInRoom ? "так — це жорстке правило, дивись системний промпт" : "ні"
        }${relaxNote}${retryNote}\n\nКандидати:\n\n${candidateList(opts.candidates)}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Model did not return a pick");
  }

  const { tmdb_id, reason } = block.input as { tmdb_id: number; reason: string };
  const film = opts.candidates.find((c) => c.tmdb_id === tmdb_id);
  if (!film) throw new Error(`Model picked ${tmdb_id}, which is not a candidate`);

  return {
    tmdb_id: film.tmdb_id,
    title: film.title,
    year: film.year,
    runtime: film.runtime,
    poster_path: film.poster_path,
    reason,
  };
}
