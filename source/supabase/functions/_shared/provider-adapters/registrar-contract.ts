import type { ProviderConnection, AdapterTestResult } from "./types.ts";

export type DomainCheckInput = { domain: string; periodYears?: number };
export type DomainAvailability = { domain: string; available: boolean; premium?: boolean; price?: { amount: string; currency: string } };
export type DomainMutationResult = { providerReference: string; status: "submitted" | "active" | "pending"; rawStatus?: string };

export interface RegistrarAdapter {
  readonly providerKey: string;
  test(connection: ProviderConnection, secret: string): Promise<AdapterTestResult>;
  checkAvailability(connection: ProviderConnection, secret: string, input: DomainCheckInput): Promise<DomainAvailability[]>;
  registerDomain(connection: ProviderConnection, secret: string, input: DomainCheckInput & { registrantContactId: string; idempotencyKey: string }): Promise<DomainMutationResult>;
  renewDomain(connection: ProviderConnection, secret: string, input: { domain: string; periodYears: number; idempotencyKey: string }): Promise<DomainMutationResult>;
  transferDomain(connection: ProviderConnection, secret: string, input: { domain: string; authCode: string; idempotencyKey: string }): Promise<DomainMutationResult>;
}

export type ProvisioningAction =
  | { type: "domain_register"; connectionId: string; idempotencyKey: string; input: DomainCheckInput & { registrantContactId: string } }
  | { type: "domain_renew"; connectionId: string; idempotencyKey: string; input: { domain: string; periodYears: number } }
  | { type: "domain_transfer"; connectionId: string; idempotencyKey: string; input: { domain: string; authCode: string } };

export interface ProvisioningAdapter {
  execute(action: ProvisioningAction, connection: ProviderConnection, secret: string): Promise<DomainMutationResult>;
}
