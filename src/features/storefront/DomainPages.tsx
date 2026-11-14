import { useNavigate } from "@tanstack/react-router";
import { ArrowRightLeft, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, Badge, Button, ButtonLink, Card, Input, Select, Switch, Table, Td, Th } from "@/design-system/components/ui";
import { addLine } from "@/lib/cart";
import { domainPeriodPrice, effectiveRegisterPrice, parseDomainInput, simulateAvailability } from "@/lib/domain";
import { useI18n, useMoney } from "@/lib/i18n";
import { useSeo } from "@/lib/seo";
import { useDb } from "@/lib/store";
import type { Tld } from "@/types/models";
import { DomainSearchBox, Faq, PageHero, Section, SectionHeading } from "./shared";

export function addDomainToCart(domain: string, tld: Tld, years: number, autoRenew: boolean, kind: "register" | "transfer" = "register") {
  addLine({ key: `domain:${domain}:${kind}`, productId: `domain:${tld.tld}`, name: `${domain} — ${kind === "transfer" ? "transfer" : "registration"}`, kind: "domain", cycle: `${years}y`, quantity: 1,
    unitPrice: kind === "transfer" ? tld.transfer : domainPeriodPrice(tld, years), meta: kind, autoRenew });
}

export function DomainsPage() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const data = useDb();
  const money = useMoney();
  useSeo({ title: fr ? "Noms de domaine .ma, .com et plus" : "Domain names — .ma, .com and more", description: fr ? "Enregistrez, transférez et gérez vos noms de domaine avec M212.MA." : "Register, transfer and manage domain names with M212.MA.", path: "/domains" });
  const [transfer, setTransfer] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  return (
    <>
      <PageHero eyebrow={fr ? "Domaines" : "Domains"} title={fr ? "Votre adresse sur Internet commence ici" : "Your address on the internet starts here"} body={fr ? "Plus de 15 extensions, gestion DNS incluse, verrouillage et renouvellement automatique." : "16 extensions, DNS management included, transfer lock and auto-renew."}>
        <DomainSearchBox onDark />
      </PageHero>
      <Section className="grid gap-6 md:grid-cols-3">
        {[{ i: ShieldCheck, t: fr ? "Protection" : "Protection", b: fr ? "Verrouillage de transfert et confidentialité WHOIS si disponible." : "Transfer lock and WHOIS privacy where available." },
          { i: ArrowRightLeft, t: fr ? "Transfert" : "Transfers", b: fr ? "Déplacez vos domaines avec un code d'autorisation." : "Move domains with an authorization code." },
          { i: CheckCircle2, t: "DNS", b: fr ? "Éditeur DNS complet: A, AAAA, CNAME, MX, TXT." : "Full DNS editor: A, AAAA, CNAME, MX, TXT." }].map((x) => (
          <Card key={x.t} className="p-6"><x.i className="h-6 w-6 text-brand-red" aria-hidden /><h2 className="mt-3 text-lg font-extrabold">{x.t}</h2><p className="mt-1 text-sm text-muted-foreground">{x.b}</p></Card>
        ))}
      </Section>
      <Section className="grid gap-8 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow={fr ? "Transfert" : "Transfer"} title={fr ? "Transférer un domaine vers M212" : "Transfer a domain to M212"} />
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>{fr ? "Déverrouillez le domaine chez votre registraire actuel." : "Unlock the domain at your current registrar."}</li>
            <li>{fr ? "Demandez le code d'autorisation (EPP)." : "Request the authorization (EPP) code."}</li>
            <li>{fr ? "Vérifiez que le domaine a plus de 60 jours." : "Check the domain is older than 60 days."}</li>
            <li>{fr ? "Commandez le transfert ci-contre ; il inclut un an de renouvellement." : "Order the transfer here — it includes a one-year renewal."}</li>
            <li>{fr ? "Approuvez l'email de confirmation envoyé au contact administratif." : "Approve the confirmation email sent to the admin contact."}</li>
          </ol>
        </div>
        <Card className="p-6">
          <form className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            const r = parseDomainInput(transfer, data.tlds.map((t) => t.tld));
            if (!r.ok) { setErr(r.error); return; }
            if (!r.tld) { setErr(fr ? "Indiquez l'extension complète, ex. exemple.com" : "Include the extension, e.g. example.com"); return; }
            if (authCode.trim().length < 6) { setErr(fr ? "Le code d'autorisation semble trop court." : "The authorization code looks too short."); return; }
            const tld = data.tlds.find((t) => t.tld === r.tld)!;
            setErr(""); addDomainToCart(r.label + r.tld, tld, 1, true, "transfer");
            toast.success(fr ? "Transfert ajouté au panier (démo)" : "Transfer added to cart (demo)"); void navigate({ to: "/cart" });
          }}>
            <label className="block text-sm font-semibold" htmlFor="tr-d">{fr ? "Domaine à transférer" : "Domain to transfer"}</label>
            <Input id="tr-d" value={transfer} onChange={(e) => setTransfer(e.target.value)} placeholder="example.com" />
            <label className="block text-sm font-semibold" htmlFor="tr-c">{fr ? "Code d'autorisation" : "Authorization code"}</label>
            <Input id="tr-c" value={authCode} onChange={(e) => setAuthCode(e.target.value)} autoComplete="off" />
            <p className="text-xs text-muted-foreground">{fr ? "Le code n'est pas conservé : seule la commande de démonstration est enregistrée." : "The code is not stored; only the demo order is saved."}</p>
            {err && <p role="alert" className="text-sm font-medium text-destructive">{err}</p>}
            <Button type="submit" variant="brand">{fr ? "Ajouter le transfert" : "Add transfer"}</Button>
          </form>
        </Card>
      </Section>
      <Section>
        <SectionHeading title={fr ? "Extensions populaires" : "Popular extensions"} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {data.tlds.slice(0, 8).map((t) => <Card key={t.tld} className="p-4 text-center"><p className="font-display text-xl font-extrabold">{t.tld}</p><p className="text-sm text-muted-foreground">{money(effectiveRegisterPrice(t))}</p></Card>)}
        </div>
        <div className="mt-6"><ButtonLink to="/domains/pricing" variant="outline">{fr ? "Tous les tarifs" : "All prices"}</ButtonLink></div>
      </Section>
    </>
  );
}

export function DomainSearchPage({ q }: { q: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const data = useDb();
  const money = useMoney();
  const navigate = useNavigate();
  useSeo({ title: fr ? "Recherche de domaine" : "Domain search", description: fr ? "Recherchez un nom de domaine (disponibilité simulée)." : "Search for a domain name (simulated availability).", path: "/domains/search" });
  const [years, setYears] = useState(1);
  const [autoRenew, setAutoRenew] = useState(true);
  const tlds = data.tlds;
  const parsed = useMemo(() => (q ? parseDomainInput(q, tlds.map((t) => t.tld)) : null), [q, tlds]);
  const results = parsed?.ok ? [...tlds].sort((a, b) => (a.tld === parsed.tld ? -1 : b.tld === parsed.tld ? 1 : 0)).map((t) => ({ tld: t, domain: parsed.label + t.tld, available: simulateAvailability(parsed.label, t.tld) })) : [];
  return (
    <>
      <div className="hero-surface"><div className="mx-auto max-w-4xl px-4 py-12"><h1 className="mb-5 text-3xl font-extrabold text-on-dark">{fr ? "Recherche de domaine" : "Domain search"}</h1><DomainSearchBox key={q} initial={q} onDark size="md" /></div></div>
      <Section className="max-w-5xl">
        <Alert tone="warning" title={fr ? "Disponibilité SIMULÉE" : "SIMULATED availability"}>{fr ? "Aucun registraire n'est connecté. Les résultats sont calculés localement pour la démonstration et ne garantissent pas la disponibilité réelle." : "No registrar is connected. Results are computed locally for demonstration and do not reflect real registry availability."}</Alert>
        {!q && <p className="mt-6 text-muted-foreground">{fr ? "Saisissez un nom pour commencer." : "Enter a name to start."}</p>}
        {parsed && !parsed.ok && <Alert tone="danger" className="mt-6" title={fr ? "Nom invalide" : "Invalid name"}>{parsed.error}</Alert>}
        {parsed?.ok && (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4 text-sm">
              <label className="flex items-center gap-2 font-semibold">{fr ? "Durée" : "Period"}
                <Select value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-28">{[1, 2, 3, 5].map((y) => <option key={y} value={y}>{y} {fr ? "an(s)" : y > 1 ? "years" : "year"}</option>)}</Select></label>
              <span className="flex items-center gap-2 font-semibold"><Switch checked={autoRenew} onChange={setAutoRenew} label="Auto-renew" />{fr ? "Renouvellement auto" : "Auto-renew"}</span>
            </div>
            <ul className="mt-4 divide-y rounded-lg border bg-card">
              {results.map((r) => (
                <li key={r.domain} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3">
                    {r.available ? <CheckCircle2 className="h-5 w-5 text-brand-green" aria-hidden /> : <XCircle className="h-5 w-5 text-muted-foreground" aria-hidden />}
                    <div>
                      <p className="font-display text-lg font-bold">{r.domain}</p>
                      <p className="text-xs text-muted-foreground">{r.available ? (fr ? "Disponible (simulé)" : "Available (simulated)") : (fr ? "Indisponible (simulé)" : "Unavailable (simulated)")}
                        {r.tld.privacy && " · WHOIS privacy"}{r.tld.restricted && <> · <Badge tone="warning">{fr ? "Conditions" : "Requirements"}</Badge></>}</p>
                      {r.tld.restricted && <p className="mt-1 text-xs text-warning-foreground">{r.tld.restricted}</p>}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {r.tld.promo && <span className="mr-2 text-muted-foreground line-through">{money(r.tld.register)}</span>}
                    <strong className="font-display text-lg">{money(domainPeriodPrice(r.tld, years))}</strong>
                    <p className="text-xs text-muted-foreground">{fr ? "Renouvellement" : "Renews at"} {money(r.tld.renew)}/{fr ? "an" : "yr"}</p>
                  </div>
                  <Button variant={r.available ? "brand" : "outline"} disabled={!r.available} onClick={() => {
                    addDomainToCart(r.domain, r.tld, years, autoRenew);
                    toast.success(`${r.domain} — ${fr ? "ajouté" : "added"}`, { action: { label: fr ? "Panier" : "Cart", onClick: () => void navigate({ to: "/cart" }) } });
                  }}>{r.available ? (fr ? "Ajouter" : "Add") : (fr ? "Pris" : "Taken")}</Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>
    </>
  );
}

export function DomainPricingPage() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const data = useDb();
  const money = useMoney();
  const [filter, setFilter] = useState("");
  useSeo({ title: fr ? "Tarifs des noms de domaine" : "Domain pricing", description: fr ? "Prix d'enregistrement, de renouvellement et de transfert pour toutes nos extensions." : "Registration, renewal and transfer prices for every extension we offer.", path: "/domains/pricing" });
  const rows = data.tlds.filter((t) => t.tld.includes(filter.trim().toLowerCase()));
  return (
    <Section>
      <SectionHeading as="h1" eyebrow={fr ? "Tarifs" : "Pricing"} title={fr ? "Tarifs des extensions" : "Domain extension pricing"} body={fr ? "Prix indicatifs HT, par an." : "Indicative prices per year, excluding tax."} />
      <div className="mb-4 max-w-xs"><label htmlFor="tld-f" className="sr-only">Filter</label><Input id="tld-f" placeholder={fr ? "Filtrer, ex. .ma" : "Filter, e.g. .ma"} value={filter} onChange={(e) => setFilter(e.target.value)} /></div>
      <Table>
        <thead><tr><Th>{fr ? "Extension" : "Extension"}</Th><Th>{fr ? "Enregistrement" : "Register"}</Th><Th>{fr ? "Renouvellement" : "Renew"}</Th><Th>Transfer</Th><Th>WHOIS privacy</Th><Th>{fr ? "Conditions" : "Requirements"}</Th></tr></thead>
        <tbody>{rows.map((t) => (
          <tr key={t.tld}>
            <Td className="font-display font-extrabold">{t.tld}</Td>
            <Td>{t.promo ? <><span className="mr-1 text-muted-foreground line-through">{money(t.register)}</span><strong>{money(t.promo)}</strong> <Badge tone="brand">Promo</Badge></> : money(t.register)}</Td>
            <Td>{money(t.renew)}</Td><Td>{money(t.transfer)}</Td><Td>{t.privacy ? "Yes" : "—"}</Td><Td className="max-w-xs text-xs text-muted-foreground">{t.restricted ?? "—"}</Td>
          </tr>))}</tbody>
      </Table>
      <div className="mt-10"><Faq items={[
        { q: fr ? "Le prix promotionnel s'applique-t-il au renouvellement ?" : "Does the promo price apply to renewals?", a: fr ? "Non, uniquement la première année. Le renouvellement est affiché séparément." : "No, only to the first year. The renewal price is always shown separately." },
        { q: fr ? "Qu'est-ce que la confidentialité WHOIS ?" : "What is WHOIS privacy?", a: fr ? "Elle masque vos coordonnées dans l'annuaire public quand l'extension le permet." : "It hides your contact details in the public directory when the registry allows it." } ]} /></div>
    </Section>
  );
}
