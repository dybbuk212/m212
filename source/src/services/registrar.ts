import type { DnsRecord, Domain } from "@/types/models";
import { simulateAvailability } from "@/lib/domain";

/** Contract a real registrar integration must implement. Calls MUST run on a secure backend, never in the browser. */
export interface RegistrarProvider {
  id: string; name: string; connected: boolean;
  searchDomain(label: string, tlds: string[]): Promise<{ domain: string; available: boolean; simulated: boolean }[]>;
  checkAvailability(domain: string): Promise<{ available: boolean; simulated: boolean }>;
  registerDomain(domain: string, years: number): Promise<never>;
  renewDomain(domain: string, years: number): Promise<never>;
  transferDomain(domain: string, authCode: string): Promise<never>;
  getDomainDetails(domain: string): Promise<Domain | null>;
  updateNameservers(domain: string, ns: string[]): Promise<never>;
  updateContacts(domain: string, contact: Domain["contact"]): Promise<never>;
  updateDnsRecords(domain: string, records: DnsRecord[]): Promise<never>;
}

const notConnected = (op: string) => Promise.reject(new Error(`${op}: registrar not connected (frontend demo release).`));

function placeholder(id: string, name: string): RegistrarProvider {
  return {
    id, name, connected: false,
    async searchDomain(label, tlds) { return tlds.map((t) => ({ domain: label + t, available: simulateAvailability(label, t), simulated: true })); },
    async checkAvailability(domain) { const [l, ...rest] = domain.split("."); return { available: simulateAvailability(l ?? "", "." + rest.join(".")), simulated: true }; },
    registerDomain: () => notConnected("registerDomain"), renewDomain: () => notConnected("renewDomain"), transferDomain: () => notConnected("transferDomain"),
    async getDomainDetails() { return null; },
    updateNameservers: () => notConnected("updateNameservers"), updateContacts: () => notConnected("updateContacts"), updateDnsRecords: () => notConnected("updateDnsRecords"),
  };
}

export const REGISTRAR_ADAPTERS: RegistrarProvider[] = [
  placeholder("registrar-a", "Registrar adapter A (placeholder)"),
  placeholder("registrar-b", "Registrar adapter B (placeholder)"),
  placeholder("registrar-ma", ".ma registrar adapter (placeholder)"),
];
export const demoRegistrar = REGISTRAR_ADAPTERS[0]!;
