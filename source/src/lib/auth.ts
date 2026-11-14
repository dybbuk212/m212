import type { Role } from "@/types/models";
import { createPersisted } from "./store";
import { DEMO_CUSTOMER_ID, DEMO_RESELLER_ID } from "@/data/seed";

/**
 * DEMO SESSION ONLY. This is NOT authentication: it stores no password and grants no real authorization.
 * Production must replace it with server-side authentication (see services/auth-service.ts).
 */
export interface DemoSession { role: Role; name: string; email: string; customerId?: string; resellerId?: string }

export const sessionStore = createPersisted<DemoSession | null>("m212.demo-session.v2", null);

export const DEMO_ACCOUNTS: Record<Exclude<Role, "guest">, DemoSession> = {
  customer: { role: "customer", name: "Yasmine Alaoui", email: "yasmine@atlas-demo.ma", customerId: DEMO_CUSTOMER_ID },
  reseller: { role: "reseller", name: "Mehdi Ouazzani", email: "mehdi@demo-webagency.ma", resellerId: DEMO_RESELLER_ID },
  admin: { role: "admin", name: "Admin (demo)", email: "admin@m212.ma" },
};

export function demoSignIn(role: Exclude<Role, "guest">, override?: Partial<DemoSession>) {
  const s = { ...DEMO_ACCOUNTS[role], ...override };
  sessionStore.set(s);
  return s;
}
export function signOut() { sessionStore.set(null); }
export function useSession() { return sessionStore.use(); }

export function validatePassword(pw: string): string | null {
  if (pw.length < 10) return "Use at least 10 characters.";
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/\d/.test(pw)) return "Mix upper-case, lower-case letters and digits.";
  return null;
}
export function validateEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()); }
