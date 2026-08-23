export default function LoadingScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white" />
      <p className="mt-4 text-sm text-white/40">Підбираємо…</p>
    </div>
  );
}
