import { Link } from "@tanstack/react-router";
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="M212.MA home">
      <svg viewBox="0 0 64 64" className="h-11 w-11 sm:h-12 sm:w-12" aria-hidden><rect width="64" height="64" rx="12" className="fill-brand-navy-deep" /><path d="M14 46V18h7l11 14 11-14h7v28h-7V30l-11 13-11-13v16z" className="fill-on-dark" /><rect x="14" y="50" width="36" height="3" className="fill-brand-red" /></svg>
      <span className={onDark ? "font-display text-lg font-extrabold text-on-dark" : "font-display text-lg font-extrabold text-brand-navy"}>M212<span className="text-brand-red">.MA</span></span>
    </Link>
  );
}
