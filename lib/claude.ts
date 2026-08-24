import Anthropic from "@anthropic-ai/sdk";
import type {
  BrainLevel,
  Candidate,
  CombinationContext,
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
- Якщо є історія фідбеку САМЕ цієї компанії (розділ "Історія компанії" нижче) — це найсильніший смаковий сигнал з усіх, сильніший за індивідуальні приклади кожної людини. Він показує, що реально спрацювало для НИХ РАЗОМ, а не для когось із них окремо.
- Якщо власної історії немає, але є для менших груп усередині цієї компанії — це підказка, не заміна власного судження. Не підсумовуй і не усереднюй ці підгрупи в одну оцінку — просто врахуй як контекст.
- Заборонені жанри і заборонені типи — жорсткі. Якщо кандидат підпадає під будь-яку заборону будь-кого з групи, він викреслений, навіть якщо ідеально підходить в усьому іншому. "Заборонені типи" вужчі за жанр ("замки і дракони", "магія") — TMDB такого не вміє відфільтрувати, тому це цілком на тобі: читай опис кандидата і викреслюй сам.
- "Не зайшло" — це не заборона, а сигнал. Уникай того, що схоже, але не викреслюй механічно.
- Побажання вечора (жанр, епоха) — м'які. Сильний нахил, але не обов'язок.
- Якщо в кімнаті діти — це ЖОРСТКО, як заборонений жанр. Ніякого насильства, сексуального контенту, важкого хорору чи тем, що не годяться дітям, навіть якщо жоден заборонений жанр формально не спрацював. TMDB-фільтр за віковим рейтингом це підстрахує лише частково — фінальне рішення на тобі: читай опис.

Рядок пояснення — обов'язковий і найважливіший. З одним варіантом промах — цілком наша провина, і пояснення це те, що робить промах читабельним як "воно нас ще не знає", а не як "ця штука видає рандом".

Формат пояснення: смаковий якір + доступність + практичність.
- Смаковий якір мусить посилатися на щось конкретне про ЦИХ людей. Якщо в історії компанії є "зайшло" — посилайся на нього першим, за назвою: це сильніше за індивідуальний приклад. Якщо немає — бери приклад хорошого в когось із них. Не загальні слова про фільм.
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

function combinationContext(combo: CombinationContext): string {
  if (combo.history.length > 0) {
    const liked = combo.history.filter((h) => h.liked === true).map((h) => h.title);
    const disliked = combo.history.filter((h) => h.liked === false).map((h) => h.title);
    const skipped = combo.history
      .filter((h) => !h.watched)
      .map((h) => h.title);

    return [
      "Історія компанії (найсильніший сигнал, сильніший за індивідуальні приклади — це реально спрацювало для НИХ РАЗОМ):",
      liked.length ? `  зайшло: ${liked.join(", ")}` : null,
      disliked.length ? `  не зайшло: ${disliked.join(", ")}` : null,
      skipped.length
        ? `  запропонували раніше, але так і не подивились: ${skipped.join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (combo.subgroups.length > 0) {
    const lines = combo.subgroups.map((s) => {
      const liked = s.history.filter((h) => h.liked === true).map((h) => h.title);
      const disliked = s.history.filter((h) => h.liked === false).map((h) => h.title);
      return `  ${s.names.join(" + ")}: зайшло — ${liked.join(", ") || "—"}; не зайшло — ${
        disliked.join(", ") || "—"
      }`;
    });
    return [
      "Історії саме цієї компанії немає. Ось що спрацювало для менших груп усередині неї (підказка, не заміна власного судження, не підсумовуй їх в одну оцінку):",
      ...lines,
    ].join("\n");
  }

  return "Історії немає — це перший раз, коли ця компанія разом підбирає фільм.";
}

function candidateList(candidates: Candidate[]) {
  return candidates
    .map(
      (c) =>
        `[${c.tmdb_id}] ${c.title}${c.year ? ` (${c.year})` : ""} · ${
          c.runtime ? `${c.runtime}хв` : "тривалість невідома"
        } · ${c.genres.join(", ")} · ${c.vote_average.toFixed(1)}\n${c.overview.slice(0, 180)}`,
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
  combination: CombinationContext;
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

  const startedAt = Date.now();

  const response = await client.messages.create({
    model: MODEL,
    // The output is one id plus one sentence — 1000 was far more headroom
    // than this can ever use.
    max_tokens: 400,
    // Picking one item from a supplied list is not a reasoning-heavy task,
    // and the default (high) was making the user wait for depth that adds
    // nothing here.
    output_config: { effort: "low" },
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
        content: `Хто дивиться:\n\n${groupContext(opts.people)}\n\n${combinationContext(
          opts.combination,
        )}\n\nСьогоднішній вечір:\n- часу: ${timeLabel(
          opts.time,
        )}\n- стан: ${brainLabel(opts.brain)}\n- хочеться: ${
          opts.genreWish ?? "нічого конкретного, вирішуй сам"
        }\n- епоха: ${eraLabel(opts.era)}\n- у кімнаті діти: ${
          opts.kidsInRoom ? "так — це жорстке правило, дивись системний промпт" : "ні"
        }${relaxNote}${retryNote}\n\nКандидати:\n\n${candidateList(opts.candidates)}`,
      },
    ],
  });

  console.log(`[timing] claude ${Date.now() - startedAt}ms`);

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
