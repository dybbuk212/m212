import type { Currency, Locale, Localized } from "@/types/models";
import { createPersisted, db } from "./store";

export const prefs = createPersisted<{ locale: Locale; currency: Currency; cookiesAccepted: boolean }>("m212.prefs.v2", { locale: "en", currency: "MAD", cookiesAccepted: false });

const dict = {
  "nav.domains": { en: "Domains", fr: "Domaines" },
  "nav.hosting": { en: "Hosting", fr: "Hébergement" },
  "nav.servers": { en: "Servers", fr: "Serveurs" },
  "nav.security": { en: "Security & email", fr: "Sécurité & email" },
  "nav.pricing": { en: "Pricing", fr: "Tarifs" },
  "nav.support": { en: "Support", fr: "Support" },
  "nav.login": { en: "Sign in", fr: "Connexion" },
  "nav.register": { en: "Create account", fr: "Créer un compte" },
  "nav.cart": { en: "Cart", fr: "Panier" },
  "nav.account": { en: "My account", fr: "Mon compte" },
  "nav.logout": { en: "Sign out", fr: "Déconnexion" },
  "demo.banner": { en: "DEMO MODE — no real registrations, payments or provisioning. Data stays in this browser.", fr: "MODE DÉMO — aucune réservation, paiement ou provisionnement réel. Les données restent dans ce navigateur." },
  "home.title": { en: "Domains, hosting and cloud built for Morocco and beyond.", fr: "Domaines, hébergement et cloud pour le Maroc et au-delà." },
  "home.subtitle": { en: "Find your domain, launch your website and scale to VPS or dedicated servers — with local support and pricing in MAD.", fr: "Trouvez votre domaine, lancez votre site et passez au VPS ou au dédié — avec un support local et des prix en MAD." },
  "search.placeholder": { en: "Find your domain, e.g. mybusiness.ma", fr: "Trouvez votre domaine, ex. monentreprise.ma" },
  "search.button": { en: "Search", fr: "Rechercher" },
  "search.demoNote": { en: "Availability shown is SIMULATED. No registrar is connected.", fr: "La disponibilité affichée est SIMULÉE. Aucun registraire n'est connecté." },
  "common.addToCart": { en: "Add to cart", fr: "Ajouter au panier" },
  "common.added": { en: "Added to cart", fr: "Ajouté au panier" },
  "common.from": { en: "from", fr: "à partir de" },
  "common.perMonth": { en: "/mo", fr: "/mois" },
  "common.perYear": { en: "/yr", fr: "/an" },
  "common.save": { en: "Save", fr: "Enregistrer" },
  "common.cancel": { en: "Cancel", fr: "Annuler" },
  "common.delete": { en: "Delete", fr: "Supprimer" },
  "common.edit": { en: "Edit", fr: "Modifier" },
  "common.create": { en: "Create", fr: "Créer" },
  "common.search": { en: "Search", fr: "Rechercher" },
  "common.faq": { en: "Frequently asked questions", fr: "Questions fréquentes" },
  "common.compare": { en: "Compare plans", fr: "Comparer les offres" },
  "common.exclTax": { en: "excl. tax", fr: "HT" },
  "cookie.text": { en: "We use only essential local storage to remember your cart, language and demo data. No tracking cookies.", fr: "Nous utilisons uniquement un stockage local essentiel pour votre panier, votre langue et les données de démo. Aucun cookie de suivi." },
  "cookie.ok": { en: "Understood", fr: "Compris" },
  "footer.rights": { en: "All rights reserved.", fr: "Tous droits réservés." },
} satisfies Record<string, Localized>;

export type DictKey = keyof typeof dict;

export function translate(key: DictKey, locale: Locale) { return dict[key][locale]; }

export function useI18n() {
  const p = prefs.use();
  const t = (key: DictKey) => translate(key, p.locale);
  const l = (v: Localized | string) => (typeof v === "string" ? v : v[p.locale]);
  return { locale: p.locale, currency: p.currency, t, l, setLocale: (locale: Locale) => prefs.set({ ...prefs.get(), locale }), setCurrency: (currency: Currency) => prefs.set({ ...prefs.get(), currency }) };
}

export function formatMoney(amountMad: number, currency: Currency, locale: Locale = "en", rates = db.get().settings.rates) {
  const value = amountMad * (rates[currency] ?? 1);
  return new Intl.NumberFormat(locale === "fr" ? "fr-MA" : "en-MA", { style: "currency", currency, maximumFractionDigits: currency === "MAD" ? 0 : 2, minimumFractionDigits: currency === "MAD" ? 0 : 2 }).format(value);
}

export function useMoney() {
  const { currency, locale } = useI18n();
  return (mad: number) => formatMoney(mad, currency, locale);
}

export function formatDate(iso: string, locale: Locale = "en") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}
