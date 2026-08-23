"use client";

export default function ClosedScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-xl font-semibold">Не наш вечір</p>
      <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-white/50">
        Буває. Завтра спробуємо ще раз — і краще, бо тепер знаємо трохи більше.
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-10 text-sm text-white/25 underline underline-offset-4"
      >
        почати спочатку
      </button>
    </div>
  );
}
