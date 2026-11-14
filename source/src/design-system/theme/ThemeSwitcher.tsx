import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "./ThemeProvider";

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();
  const SelectedIcon = options.find((option) => option.value === preference)?.icon ?? Monitor;
  return (
    <label className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground">
      <SelectedIcon className="h-3.5 w-3.5" aria-hidden />
      {!compact && <span className="sr-only sm:not-sr-only">Theme</span>}
      <select aria-label="Appearance theme" value={preference} onChange={(event) => setPreference(event.target.value as ThemePreference)} className="max-w-[5.5rem] bg-transparent outline-none">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
