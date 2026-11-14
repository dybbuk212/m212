/**
 * Provider-neutral contracts. Implementations must call external APIs server-side only.
 * No concrete provider is enabled until sandbox credentials and contract tests are supplied.
 */
export type ProviderKind = "registrar" | "control-panel" | "dns" | "payments";

export interface ProviderHealth {
  providerId: string;
  kind: ProviderKind;
  configured: boolean;
  sandbox: boolean;
}

export interface DomainAvailabilityRequest { fqdn: string }
export interface DomainAvailabilityResult {
  fqdn: string;
  available: boolean;
  currency: "MAD" | "EUR" | "USD";
  registrationPriceMinor?: number;
  renewalPriceMinor?: number;
  providerReference?: string;
}

export interface DomainRegistrationRequest {
  fqdn: string;
  registrantReference: string;
  idempotencyKey: string;
}

export interface DomainRegistrationResult {
  providerReference: string;
  status: "submitted" | "pending" | "registered" | "rejected";
}

export interface RegistrarAdapter {
  readonly id: string;
  readonly sandbox: boolean;
  health(): Promise<ProviderHealth>;
  checkAvailability(input: DomainAvailabilityRequest): Promise<DomainAvailabilityResult>;
  registerDomain(input: DomainRegistrationRequest): Promise<DomainRegistrationResult>;
}

export interface HostingProvisionRequest {
  customerReference: string;
  fqdn: string;
  planReference: string;
  idempotencyKey: string;
}

export interface HostingProvisionResult {
  providerReference: string;
  status: "queued" | "provisioning" | "active" | "failed";
}

export interface ControlPanelAdapter {
  readonly id: string;
  readonly sandbox: boolean;
  health(): Promise<ProviderHealth>;
  provisionHosting(input: HostingProvisionRequest): Promise<HostingProvisionResult>;
  suspendService(providerReference: string, idempotencyKey: string): Promise<void>;
}

export interface ProviderRegistry {
  registrar(id: string): RegistrarAdapter;
  controlPanel(id: string): ControlPanelAdapter;
}
