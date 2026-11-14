/** Payment adapter contract. Real implementations must run server-side; the browser never sees card data. */
export interface PaymentProvider {
  id: string; label: string; description: string; connected: boolean; kind: "offline" | "redirect";
  createPaymentIntent(orderId: string, amount: number, currency: string): Promise<{ status: "DEMO_PENDING"; reference: string }>;
}
const demo = (id: string, label: string, description: string, kind: PaymentProvider["kind"]): PaymentProvider => ({
  id, label, description, kind, connected: false,
  async createPaymentIntent(orderId) { return { status: "DEMO_PENDING", reference: `${id.toUpperCase()}-${orderId}` }; },
});
export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  demo("bank-transfer", "Bank transfer", "Pay by bank transfer using the reference on your invoice.", "offline"),
  demo("card", "Card payment (placeholder)", "A hosted card page would open here. No card data is collected in this demo.", "redirect"),
  demo("moroccan-provider", "Moroccan payment provider (placeholder)", "Placeholder for a local payment gateway integration.", "redirect"),
  demo("international-provider", "International payment provider (placeholder)", "Placeholder for an international gateway integration.", "redirect"),
];
