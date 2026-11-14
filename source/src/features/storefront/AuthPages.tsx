import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Alert, Button, ButtonLink, Card, Field, Input } from "@/components/ui";
import { demoSignIn, validateEmail, validatePassword } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useSeo } from "@/lib/seo";
import { db, uid } from "@/lib/store";
import { portalHome } from "@/components/layout/SiteLayout";
import type { Role } from "@/types/models";

export function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} className="pr-10" />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
    </div>
  );
}

export function LoginPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  useSeo({ title: fr ? "Connexion" : "Sign in", description: fr ? "Connexion à l'espace client M212.MA (démo)." : "Sign in to the M212.MA customer area (demo).", path: "/login", noindex: true });
  const navigate = useNavigate();
  const [email, setEmail] = useState("yasmine@atlas-demo.ma");
  const [pw, setPw] = useState("");
  const [role, setRole] = useState<Exclude<Role, "guest">>("customer");
  const [err, setErr] = useState("");
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-2">
      <div>
        <h1 className="text-3xl font-extrabold">{fr ? "Connexion" : "Sign in"}</h1>
        <Alert tone="warning" className="mt-4" title="DEMO MODE">{fr ? "Ceci n'est pas une authentification réelle. Le mot de passe n'est ni vérifié ni enregistré ; choisissez simplement un rôle de démonstration." : "This is not real authentication. The password is neither checked nor stored; you simply pick a demo role."}</Alert>
        <p className="mt-4 text-sm text-muted-foreground">{fr ? "En production, la connexion, la MFA et les autorisations seront gérées par un backend sécurisé." : "In production, sign-in, MFA and authorization will be handled by a secure backend."}</p>
      </div>
      <Card className="p-6">
        <form noValidate className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          if (!validateEmail(email)) { setErr(fr ? "Email invalide." : "Enter a valid email."); return; }
          if (pw.length < 1) { setErr(fr ? "Saisissez un mot de passe (non vérifié en démo)." : "Enter a password (not checked in demo)."); return; }
          setErr(""); setPw("");
          const s = demoSignIn(role);
          db.log(s.email, "auth.demo_sign_in", role);
          void navigate({ to: portalHome(role) as "/client/dashboard" });
        }}>
          <Field label="Email">{(id) => <Input id={id} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
          <Field label={fr ? "Mot de passe" : "Password"} hint={fr ? "Non enregistré." : "Never stored."}>{(id) => <PasswordInput id={id} value={pw} onChange={setPw} autoComplete="current-password" />}</Field>
          <fieldset><legend className="mb-2 text-sm font-semibold">{fr ? "Rôle de démonstration" : "Demo role"}</legend>
            <div className="grid grid-cols-3 gap-2">{(["customer", "reseller", "admin"] as const).map((r) => (
              <label key={r} className={`cursor-pointer rounded-md border p-2 text-center text-sm font-semibold ${role === r ? "border-brand-green bg-success-wash" : ""}`}><input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />{r}</label>))}</div>
          </fieldset>
          {err && <p role="alert" className="text-sm font-medium text-destructive">{err}</p>}
          <Button type="submit" variant="brand" className="w-full">{fr ? "Se connecter (démo)" : "Sign in (demo)"}</Button>
          <p className="text-center text-sm text-muted-foreground">{fr ? "Pas de compte ?" : "No account?"} <ButtonLink to="/register" variant="ghost" size="sm">{fr ? "Créer un compte" : "Create one"}</ButtonLink></p>
        </form>
      </Card>
    </div>
  );
}

export function RegisterPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  useSeo({ title: fr ? "Créer un compte" : "Create an account", description: fr ? "Créez un compte client M212.MA (démo)." : "Create an M212.MA customer account (demo).", path: "/register", noindex: true });
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", email: "", company: "", country: "MA", pw: "", pw2: "", terms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <h1 className="text-3xl font-extrabold">{fr ? "Créer un compte" : "Create an account"}</h1>
      <Alert tone="warning" className="mt-4" title="DEMO MODE">{fr ? "Le profil est créé localement. Le mot de passe sert uniquement à démontrer la validation et n'est jamais enregistré." : "The profile is created locally. The password only demonstrates validation and is never stored."}</Alert>
      <Card className="mt-6 p-6">
        <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => {
          e.preventDefault();
          const errs: Record<string, string> = {};
          if (f.name.trim().length < 2) errs.name = "Name is required";
          if (!validateEmail(f.email)) errs.email = "Enter a valid email";
          const pwErr = validatePassword(f.pw); if (pwErr) errs.pw = pwErr;
          if (f.pw !== f.pw2) errs.pw2 = "Passwords do not match";
          if (!f.terms) errs.terms = "You must accept the terms";
          setErrors(errs); if (Object.keys(errs).length) return;
          const id = uid("cus");
          db.insert("customers", { id, name: f.name.trim(), email: f.email.trim(), company: f.company || undefined, country: f.country, status: "active", createdAt: new Date().toISOString() });
          db.log(f.email, "customer.register", id);
          demoSignIn("customer", { name: f.name.trim(), email: f.email.trim(), customerId: id });
          void navigate({ to: "/client/dashboard" });
        }}>
          <Field label={fr ? "Nom complet" : "Full name"} error={errors.name}>{(id) => <Input id={id} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
          <Field label="Email" error={errors.email}>{(id) => <Input id={id} type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
          <Field label={fr ? "Société (optionnel)" : "Company (optional)"}>{(id) => <Input id={id} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />}</Field>
          <Field label={fr ? "Pays" : "Country"}>{(id) => <select id={id} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}><option value="MA">Morocco</option><option value="FR">France</option><option value="ES">Spain</option><option value="US">United States</option><option value="OTHER">Other</option></select>}</Field>
          <Field label={fr ? "Mot de passe" : "Password"} error={errors.pw} hint="10+ chars, upper, lower, digit">{(id) => <PasswordInput id={id} value={f.pw} onChange={(v) => setF({ ...f, pw: v })} autoComplete="new-password" />}</Field>
          <Field label={fr ? "Confirmer" : "Confirm password"} error={errors.pw2}>{(id) => <PasswordInput id={id} value={f.pw2} onChange={(v) => setF({ ...f, pw2: v })} autoComplete="new-password" />}</Field>
          <label className="flex items-start gap-2 text-sm sm:col-span-2"><input type="checkbox" className="mt-1 accent-brand-green" checked={f.terms} onChange={(e) => setF({ ...f, terms: e.target.checked })} />{fr ? "J'accepte les conditions générales (brouillon)." : "I accept the terms of service (draft)."}</label>
          {errors.terms && <p role="alert" className="text-xs text-destructive sm:col-span-2">{errors.terms}</p>}
          <Button type="submit" variant="brand" className="sm:col-span-2">{fr ? "Créer le compte" : "Create account"}</Button>
        </form>
      </Card>
    </div>
  );
}
