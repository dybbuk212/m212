import type { Tld } from "@/types/models";

export type DomainCheck = { ok: true; label: string; tld?: string } | { ok: false; error: string };

/** Normalises user input like "https://www.My-Site.ma/path" → { label: "my-site", tld: ".ma" }. */
export function parseDomainInput(input: string, knownTlds: string[]): DomainCheck {
  let v = input.trim().toLowerCase();
  v = v.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0] ?? "";
  v = v.replace(/^www\./, "").replace(/\.$/, "");
  if (!v) return { ok: false, error: "Enter a domain name." };
  if (/\s/.test(v)) return { ok: false, error: "Domain names cannot contain spaces." };
  let label = v;
  let tld: string | undefined;
  const sorted = [...knownTlds].sort((a, b) => b.length - a.length);
  for (const t of sorted) if (v.endsWith(t) && v.length > t.length) { tld = t; label = v.slice(0, -t.length); break; }
  if (!tld && v.includes(".")) return { ok: false, error: `The extension ".${v.split(".").slice(1).join(".")}" is not in our catalogue.` };
  if (label.includes(".")) return { ok: false, error: "Enter a single name without sub-domains." };
  if (label.length < 2) return { ok: false, error: "The name must be at least 2 characters." };
  if (label.length > 63) return { ok: false, error: "The name must be 63 characters or fewer." };
  if (!/^[a-z0-9-]+$/.test(label)) return { ok: false, error: "Use only letters a–z, digits and hyphens." };
  if (label.startsWith("-") || label.endsWith("-")) return { ok: false, error: "The name cannot start or end with a hyphen." };
  if (label.slice(2, 4) === "--" && !label.startsWith("xn")) return { ok: false, error: "Hyphens in positions 3 and 4 are reserved." };
  return { ok: true, label, tld };
}

const RESERVED = new Set(["m212", "google", "example", "admin", "support", "test", "maroc", "morocco", "gov"]);

/** DEMO ONLY: deterministic pseudo-availability. Never presented as real registry data. */
export function simulateAvailability(label: string, tld: string): boolean {
  if (RESERVED.has(label)) return false;
  if (label.length <= 3) return false;
  let h = 0;
  for (const c of label + tld) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 5 !== 0;
}

export function effectiveRegisterPrice(t: Tld) { return t.promo ?? t.register; }

export function domainPeriodPrice(t: Tld, years: number) {
  return effectiveRegisterPrice(t) + t.renew * Math.max(0, years - 1);
}
