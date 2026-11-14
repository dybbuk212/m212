import { createPersisted } from "./store";
import type { CartLine } from "./pricing";

export const cartStore = createPersisted<{ lines: CartLine[]; coupon: string }>("m212.cart.v2", { lines: [], coupon: "" });

export function addLine(line: CartLine) {
  const s = cartStore.get();
  const existing = s.lines.find((l) => l.key === line.key);
  const lines = existing ? s.lines.map((l) => (l.key === line.key ? { ...l, quantity: l.kind === "domain" ? 1 : l.quantity + 1 } : l)) : [...s.lines, line];
  cartStore.set({ ...s, lines });
}
export function updateLine(key: string, changes: Partial<CartLine>) {
  const s = cartStore.get();
  cartStore.set({ ...s, lines: s.lines.map((l) => (l.key === key ? { ...l, ...changes } : l)) });
}
export function removeLine(key: string) { const s = cartStore.get(); cartStore.set({ ...s, lines: s.lines.filter((l) => l.key !== key) }); }
export function setCoupon(coupon: string) { cartStore.set({ ...cartStore.get(), coupon }); }
export function clearCart() { cartStore.set({ lines: [], coupon: "" }); }
