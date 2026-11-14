/** Future server-side authentication contract. The demo session in lib/auth.ts is NOT a security boundary. */
export interface AuthService {
  signIn(email: string, password: string): Promise<{ userId: string; mfaRequired: boolean }>;
  signUp(input: { name: string; email: string; password: string }): Promise<{ userId: string; verificationSent: boolean }>;
  signOut(): Promise<void>;
  verifyMfa(code: string): Promise<boolean>;
  getRoles(): Promise<string[]>;
}
export interface ProvisioningService {
  provisionHosting(orderId: string): Promise<never>;
  provisionVps(orderId: string): Promise<never>;
  issueSsl(orderId: string): Promise<never>;
}
