import { Link, useRouter, type LinkComponentProps } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  brand: "bg-brand-red text-on-dark hover:brightness-110",
  success: "bg-brand-green text-on-dark hover:brightness-110",
  outline: "border border-input bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  danger: "bg-destructive text-destructive-foreground hover:opacity-90",
  onDark: "border border-on-dark/25 text-on-dark hover:bg-on-dark/10",
} as const;
const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base", icon: "h-9 w-9" } as const;
export type ButtonVariant = keyof typeof variants;
export function buttonClass(variant: ButtonVariant = "primary", size: keyof typeof sizes = "md", className?: string) {
  return cn("inline-flex items-center justify-center gap-2 rounded-md font-semibold transition disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap", variants[variant], sizes[size], className);
}

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: keyof typeof sizes }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: LinkComponentProps<"a"> & { variant?: ButtonVariant; size?: keyof typeof sizes }) {
  return <Link {...props} className={buttonClass(variant, size, className as string | undefined)} />;
}

/** For hrefs coming from content (CMS menus/blocks): internal paths navigate client-side, external open normally. */
export function HrefLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  const internal = href.startsWith("/");
  return (
    <a href={href} className={className} rel={internal ? undefined : "noopener noreferrer"} target={internal ? undefined : "_blank"}
      onClick={(e) => { if (internal && !e.metaKey && !e.ctrlKey) { e.preventDefault(); void router.navigate({ href }); } }}>{children}</a>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border bg-card text-card-foreground shadow-card", className)} {...props} />;
}

const tones = {
  neutral: "bg-muted text-muted-foreground", info: "bg-brand-ice text-brand-navy", success: "bg-success-wash text-success",
  warning: "bg-warning-wash text-warning-foreground", danger: "bg-destructive/10 text-destructive", brand: "bg-brand-red text-on-dark", demo: "border border-dashed border-warning bg-warning-wash text-warning-foreground",
} as const;
export type Tone = keyof typeof tones;
export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", tones[tone], className)} {...props} />;
}
export function statusTone(status: string): Tone {
  if (["active", "running", "online", "published", "completed", "demo-paid", "DEMO_PAID", "answered", "allow", "demo-recorded"].includes(status)) return "success";
  if (["pending", "DEMO_PENDING", "processing", "maintenance", "rebooting", "draft", "open", "customer-reply", "pending-transfer", "demo-pending"].includes(status)) return "warning";
  if (["suspended", "overdue", "expired", "cancelled", "CANCELLED", "offline", "stopped", "deny", "urgent", "closed"].includes(status)) return status === "closed" ? "neutral" : "danger";
  return "neutral";
}
export function StatusBadge({ status }: { status: string }) { return <Badge tone={statusTone(status)}>{status.replace(/[-_]/g, " ").toLowerCase()}</Badge>; }

const field = "w-full rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn(field, "h-10", className)} {...props} />; }
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn(field, "min-h-24 py-2", className)} {...props} />; }
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn(field, "h-10 pr-8", className)} {...props} />; }

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">{label}</label>
      {children(id)}
      {error ? <p role="alert" className="text-xs font-medium text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition", checked ? "bg-brand-green" : "bg-input")}>
      <span className={cn("inline-block h-5 w-5 rounded-full bg-card shadow transition", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

export function Alert({ tone = "info", title, children, className }: { tone?: "info" | "warning" | "success" | "danger"; title?: string; children?: ReactNode; className?: string }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle;
  const cls = { info: "bg-brand-ice text-brand-navy", warning: "bg-warning-wash text-warning-foreground", success: "bg-success-wash text-success", danger: "bg-destructive/10 text-destructive" }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg p-4 text-sm", cls, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="space-y-1">{title && <p className="font-semibold">{title}</p>}{children && <div className="opacity-90">{children}</div>}</div>
    </div>
  );
}

export function Dialog({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input,select,textarea,button:not([aria-label='Close'])")?.focus();
    return () => { document.removeEventListener("keydown", onKey); prev?.focus(); };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy-deep/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={cn("animate-rise flex max-h-[92vh] w-full flex-col rounded-t-xl bg-card shadow-pop sm:rounded-xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel = "Delete", onConfirm, onClose }: { open: boolean; title: string; body: string; confirmLabel?: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title={title} footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button></>}>
      <p className="text-sm text-muted-foreground">{body}</p>
    </Dialog>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("overflow-x-auto rounded-lg border bg-card", className)}><table className="w-full min-w-[640px] text-left text-sm">{children}</table></div>;
}
export function Th({ children, className }: { children?: ReactNode; className?: string }) { return <th scope="col" className={cn("border-b bg-muted/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground", className)}>{children}</th>; }
export function Td({ children, className, colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) { return <td colSpan={colSpan} className={cn("border-b px-4 py-3 align-middle [tr:last-child>&]:border-b-0", className)}>{children}</td>; }

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cn("-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition", value === t.id ? "border-brand-red text-brand-navy" : "border-transparent text-muted-foreground hover:text-foreground")}>{t.label}</button>
      ))}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            {it.to ? <HrefLink href={it.to} className="hover:text-foreground">{it.label}</HrefLink> : <span aria-current="page" className="font-medium text-foreground">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages);
  return { page: current, pages, setPage, slice: items.slice((current - 1) * pageSize, current * pageSize) };
}
export function Pagination({ page, pages, setPage }: { page: number; pages: number; setPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-end gap-2 pt-3 text-sm">
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
      <span className="tabular text-muted-foreground">Page {page} / {pages}</span>
      <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
    </nav>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <p className="font-display text-lg font-bold text-brand-navy">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-red">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}{icon}</div>
      <p className="mt-2 font-display text-2xl font-extrabold tabular text-brand-navy">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

export function Progress({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", v > 85 ? "bg-brand-red" : v > 65 ? "bg-warning" : "bg-brand-green")} style={{ width: `${v}%` }} />
    </div>
  );
}

export function BarChart({ data, label, format = String }: { data: { label: string; value: number }[]; label: string; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure aria-label={label} className="w-full">
      <div className="flex h-44 items-end gap-2">
        {data.map((d) => (
          <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100">{format(d.value)}</span>
            <div className="w-full rounded-t bg-brand-green/80 transition group-hover:bg-brand-green" style={{ height: `${(d.value / max) * 100}%`, minHeight: 2 }} title={`${d.label}: ${format(d.value)}`} />
          </div>
        ))}
      </div>
      <figcaption className="mt-1 flex gap-2 text-[10px] text-muted-foreground">{data.map((d) => <span key={d.label} className="flex-1 text-center">{d.label}</span>)}</figcaption>
    </figure>
  );
}

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const w = 240, h = 60, max = Math.max(100, ...values);
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} className="h-16 w-full text-brand-green" preserveAspectRatio="none"><polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} /></svg>;
}
