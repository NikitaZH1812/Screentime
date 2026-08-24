export type Lang = "en" | "uk";

/** Interface strings only — the Claude prompt and its reason line stay Ukrainian regardless of this setting. */
type Dict = {
  who: {
    title: string;
    signOut: string;
    loading: string;
    empty: string;
    edit: string;
    delete: string;
    deleteConfirm: string;
    cancel: string;
    newProfile: string;
    next: string;
    banned: (n: number) => string;
    lockedUntil: (countdown: string) => string;
  };
  login: {
    continueWithGoogle: string;
    continuingGoogle: string;
  };
  onboarding: {
    skip: string;
    next: string;
    getStarted: string;
    slides: { title: string; body: string }[];
  };
  profileForm: {
    back: string;
    name: string;
    namePlaceholder: string;
    bannedGenres: string;
    bannedGenresHint: string;
    bannedTypes: string;
    bannedTypesHint: string;
    tagInputPlaceholder: string;
    goodExamples: string;
    goodExamplesHint: string;
    badExamples: string;
    badExamplesHint: string;
    filmSearchPlaceholder: string;
    whereYouWatch: string;
    ukrainianAudio: string;
    required: string;
    notRequired: string;
    save: string;
  };
  dials: {
    back: string;
    time: string;
    timeShort: string;
    timeMedium: string;
    timeAny: string;
    brain: string;
    brainHint: string;
    brainLow: string;
    brainNormal: string;
    era: string;
    eraOld: string;
    eraAny: string;
    eraNew: string;
    wishClose: string;
    wishOpen: string;
    pick: string;
  };
  loading: string;
  pick: {
    details: string;
    watched: string;
    alreadySeen: string;
    notTonight: string;
    runtime: (h: number, m: number) => string;
  };
  tags: {
    time: (t: "short" | "medium" | "any") => string;
    brain: (b: "low" | "normal") => string;
    era: (e: "old" | "any" | "new") => string | null;
  };
  feedback: {
    yesterdayWeSuggested: string;
    didYouWatch: string;
    yes: string;
    no: string;
    didYouLikeIt: string;
    notReally: string;
    later: string;
  };
  filmSearch: {
    searching: string;
    broken: string;
  };
  errors: {
    loadProfiles: string;
    somethingWrong: string;
    savePause: string;
    delete: string;
    saveProfile: string;
  };
  config: (missing: string) => string;
};

export const DICT: Record<Lang, Dict> = {
  en: {
    who: {
      title: "Who's watching",
      signOut: "sign out",
      loading: "Loading…",
      empty: "No one here yet. Create the first profile — takes a minute, done once.",
      edit: "edit",
      delete: "✕",
      deleteConfirm: "delete",
      cancel: "cancel",
      newProfile: "+ new profile",
      next: "Next",
      banned: (n) => `${n} restriction${n === 1 ? "" : "s"}`,
      lockedUntil: (countdown) =>
        `this group already said "not tonight" — try again in ${countdown}`,
    },
    login: {
      continueWithGoogle: "Continue with Google",
      continuingGoogle: "One moment…",
    },
    onboarding: {
      skip: "skip",
      next: "Next",
      getStarted: "Get started",
      slides: [
        {
          title: "Not 40 minutes of arguing",
          body: "The problem was never a lack of options — it's 40 minutes of negotiating and then watching nothing. We pick one film for you, with a reason why, in about 15 seconds.",
        },
        {
          title: "Set up once, use every evening",
          body: "Set up your profile once — a couple of favorite films, your subscriptions — and every evening after that comes down to three taps: who's in the room, how much time and energy you have, and “Find it”.",
        },
        {
          title: "Reroll freely — or once a day",
          body: "Already seen it? Reroll as many times as you want, that's on us. Just not your taste? One reroll, then the evening closes for the day.",
        },
        {
          title: "It learns your group, not just you",
          body: "Tell us the next day if it landed, and we remember what actually works for this exact group watching together — never an average of what each of you likes alone.",
        },
      ],
    },
    profileForm: {
      back: "← back",
      name: "Name",
      namePlaceholder: "what's your name",
      bannedGenres: "Banned genres",
      bannedGenresHint: "never suggest these",
      bannedTypes: "Banned kinds",
      bannedTypesHint: "narrower than genre: “castles and dragons”, “magic”, “zombies”",
      tagInputPlaceholder: "type and press Enter",
      goodExamples: "Examples of good",
      goodExamplesHint: "2–3 films that landed",
      badExamples: "Examples of bad",
      badExamplesHint: "what was boring or off-putting",
      filmSearchPlaceholder: "start typing a title",
      whereYouWatch: "Where you watch",
      ukrainianAudio: "Ukrainian audio",
      required: "required",
      notRequired: "not required",
      save: "Save profile",
    },
    dials: {
      back: "← back",
      time: "How much time we have",
      timeShort: "under 1.5h",
      timeMedium: "about 2h",
      timeAny: "doesn't matter",
      brain: "How much brain is left",
      brainHint: "sets how simple or demanding the plot can be",
      brainLow: "running on empty — something easy",
      brainNormal: "got it in us — can handle more",
      era: "Old or new",
      eraOld: "proven classic",
      eraAny: "no difference",
      eraNew: "something new",
      wishClose: "− no preference",
      wishOpen: "+ want something specific",
      pick: "Find it",
    },
    loading: "Finding something…",
    pick: {
      details: "More details",
      watched: "Watched it",
      alreadySeen: "already seen",
      notTonight: "not tonight",
      runtime: (h, m) => (h ? `${h}h ${m}m` : `${m}m`),
    },
    tags: {
      time: (t) => ({ short: "under 1.5h", medium: "~2h", any: "no time limit" })[t],
      brain: (b) => (b === "low" ? "easy evening" : "up for more"),
      era: (e) => ({ old: "proven classic", new: "something new", any: null })[e],
    },
    feedback: {
      yesterdayWeSuggested: "Yesterday we suggested",
      didYouWatch: "Did you watch it?",
      yes: "yes",
      no: "no",
      didYouLikeIt: "Did it land?",
      notReally: "not really",
      later: "later",
    },
    filmSearch: {
      searching: "searching…",
      broken: "search isn't working — press Enter to add the title by hand",
    },
    errors: {
      loadProfiles: "Couldn't load profiles",
      somethingWrong: "Something went wrong",
      savePause: "Couldn't save the pause",
      delete: "Couldn't delete",
      saveProfile: "Couldn't save the profile",
    },
    config: (missing) =>
      `Not configured: ${missing}. Locally — in .env.local, on Vercel — in Settings → Environment Variables, then redeploy.`,
  },
  uk: {
    who: {
      title: "Хто дивиться",
      signOut: "вийти",
      loading: "Завантажую…",
      empty: "Тут поки нікого. Створи перший профіль — це займе хвилину і робиться один раз.",
      edit: "змінити",
      delete: "✕",
      deleteConfirm: "видалити",
      cancel: "скасувати",
      newProfile: "+ новий профіль",
      next: "Далі",
      banned: (n) => `${n} заборон`,
      lockedUntil: (countdown) =>
        `ця компанія вже сказала «не сьогодні» — знову можна через ${countdown}`,
    },
    login: {
      continueWithGoogle: "Продовжити з Google",
      continuingGoogle: "Хвилинку…",
    },
    onboarding: {
      skip: "пропустити",
      next: "Далі",
      getStarted: "Почати",
      slides: [
        {
          title: "Не 40 хвилин суперечок",
          body: "Проблема не в тому, що нема що подивитись — проблема в 40 хвилинах сперечань і вимкненому телевізорі. Ми обираємо один фільм за вас, з поясненням чому, десь за 15 секунд.",
        },
        {
          title: "Налаштуй раз — користуйся щовечора",
          body: "Один раз налаштуй профіль — пара улюблених фільмів, твої підписки, — а далі щовечора все зводиться до трьох тапів: хто в кімнаті, скільки часу і сил є, і «Підібрати».",
        },
        {
          title: "Реролл без ліміту — або раз на добу",
          body: "Вже бачили — рерольте скільки завгодно, це наша помилка, не ваша. Не сподобалось за смаком — лише один реролл, і вечір закривається до завтра.",
        },
        {
          title: "Адаптується під вашу компанію",
          body: "Наступного дня питаємо, чи зайшло, і запам'ятовуємо, що реально працює саме для цієї компанії разом — а не середнє з того, що любить кожен окремо.",
        },
      ],
    },
    profileForm: {
      back: "← назад",
      name: "Ім'я",
      namePlaceholder: "як тебе звати",
      bannedGenres: "Заборонені жанри",
      bannedGenresHint: "ніколи не пропонувати",
      bannedTypes: "Заборонені типи",
      bannedTypesHint: "вужче за жанр: «замки і дракони», «магія», «зомбі»",
      tagInputPlaceholder: "написати і натиснути Enter",
      goodExamples: "Приклади хорошого",
      goodExamplesHint: "2–3 фільми, які зайшли",
      badExamples: "Приклади поганого",
      badExamplesHint: "те, від чого було нудно чи бридко",
      filmSearchPlaceholder: "почни писати назву",
      whereYouWatch: "Де дивишся",
      ukrainianAudio: "Українська аудіодоріжка",
      required: "обов'язково",
      notRequired: "не обов'язково",
      save: "Зберегти профіль",
    },
    dials: {
      back: "← назад",
      time: "Скільки часу є",
      timeShort: "менше 1.5 год",
      timeMedium: "десь 2 год",
      timeAny: "не важливо",
      brain: "Скільки лишилось сил",
      brainHint: "визначає, наскільки просте чи важке за сюжетом обирати",
      brainLow: "на нулі — щось легке",
      brainNormal: "є сили — можна складніше",
      era: "Старе чи нове",
      eraOld: "перевірене старе",
      eraAny: "без різниці",
      eraNew: "щось нове",
      wishClose: "− без конкретики",
      wishOpen: "+ хочеться чогось конкретного",
      pick: "Підібрати",
    },
    loading: "Підбираємо…",
    pick: {
      details: "Детальніше",
      watched: "Подивились",
      alreadySeen: "вже бачили",
      notTonight: "не сьогодні",
      runtime: (h, m) => (h ? `${h}год ${m}хв` : `${m}хв`),
    },
    tags: {
      time: (t) => ({ short: "до 1.5 год", medium: "~2 год", any: "час не обмежений" })[t],
      brain: (b) => (b === "low" ? "легкий вечір" : "можна складніше"),
      era: (e) => ({ old: "старе перевірене", new: "щось нове", any: null })[e],
    },
    feedback: {
      yesterdayWeSuggested: "Вчора ми запропонували",
      didYouWatch: "Подивились?",
      yes: "так",
      no: "ні",
      didYouLikeIt: "Зайшло?",
      notReally: "не дуже",
      later: "пізніше",
    },
    filmSearch: {
      searching: "шукаю…",
      broken: "пошук не працює — Enter, щоб додати назву вручну",
    },
    errors: {
      loadProfiles: "Не вдалося завантажити профілі",
      somethingWrong: "Щось пішло не так",
      savePause: "Не вдалося зберегти паузу",
      delete: "Не вдалося видалити",
      saveProfile: "Не вдалося зберегти профіль",
    },
    config: (missing) =>
      `Не налаштовано: ${missing}. Локально — у .env.local, на Vercel — у Settings → Environment Variables, і потім Redeploy.`,
  },
};

/** Genre labels are stored and sent to TMDB/Claude in Ukrainian regardless of UI language — this is display-only. */
const GENRE_EN_LABEL: Record<string, string> = {
  бойовик: "action",
  пригоди: "adventure",
  анімація: "animation",
  комедія: "comedy",
  кримінал: "crime",
  документальний: "documentary",
  драма: "drama",
  сімейний: "family",
  фентезі: "fantasy",
  історичний: "history",
  жахи: "horror",
  мюзикл: "musical",
  детектив: "mystery",
  романтика: "romance",
  фантастика: "sci-fi",
  трилер: "thriller",
  військовий: "war",
  вестерн: "western",
};

export function genreLabel(canonical: string, lang: Lang): string {
  return lang === "en" ? (GENRE_EN_LABEL[canonical] ?? canonical) : canonical;
}
