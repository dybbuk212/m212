import type { Customer, Invoice, Settings } from "@/types/models";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Builds a standalone, printable DEMO invoice document. */
export function invoiceHtml(inv: Invoice, customer: Customer | undefined, settings: Settings) {
  const mad = (n: number) => `${n.toFixed(2)} MAD`;
  const subtotal = inv.lines.reduce((s, l) => s + l.amount, 0);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(inv.number)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;color:#1b2a44}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #dde3ee;text-align:left}.r{text-align:right}.demo{border:2px dashed #c8262f;color:#c8262f;padding:8px;font-weight:700;text-align:center}</style></head><body>
<p class="demo">DEMONSTRATION INVOICE — NOT A TAX DOCUMENT — NO PAYMENT REQUIRED</p>
<h1>${esc(settings.company.name)}</h1><p>${esc(settings.company.legalName)}<br>${esc(settings.company.address)}<br>${esc(settings.company.ice)}</p>
<h2>Invoice ${esc(inv.number)}</h2><p>Issued: ${inv.issuedAt.slice(0, 10)} · Due: ${inv.dueAt.slice(0, 10)} · Status: ${esc(inv.status.toUpperCase())}</p>
<p><strong>Bill to:</strong> ${esc(customer?.name ?? inv.customerId)}${customer?.company ? `<br>${esc(customer.company)}` : ""}<br>${esc(customer?.email ?? "")}</p>
<table><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody>
${inv.lines.map((l) => `<tr><td>${esc(l.description)}</td><td class="r">${mad(l.amount)}</td></tr>`).join("")}
<tr><td class="r">Subtotal</td><td class="r">${mad(subtotal)}</td></tr><tr><td class="r">${esc(settings.taxLabel)}</td><td class="r">${mad(inv.tax)}</td></tr><tr><th class="r">Total</th><th class="r">${mad(inv.total)}</th></tr>
</tbody></table><p>${esc(settings.payment.bankDetails)} — reference: ${esc(inv.number)}</p></body></html>`;
}
