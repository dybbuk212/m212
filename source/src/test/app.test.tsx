import { describe, expect, it, beforeEach } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "@/router";
import { db } from "@/lib/store";
import { cartStore, clearCart } from "@/lib/cart";
import { prefs } from "@/lib/i18n";
import { sessionStore, DEMO_ACCOUNTS } from "@/lib/auth";

async function renderAt(path: string) {
  const router = createAppRouter({ history: createMemoryHistory({ initialEntries: [path] }) });
  await act(async () => { await router.load(); });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => { db.reset(); clearCart(); sessionStore.set(null); prefs.set({ locale: "en", currency: "MAD", cookiesAccepted: true }); });

describe("storefront", () => {
  it("home page renders with search and navigation", async () => {
    await renderAt("/");
    expect(await screen.findByRole("heading", { level: 1, name: /Your online presence starts with a domain name/ })).toBeInTheDocument();
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getAllByText(/DEMO MODE/).length).toBeGreaterThan(0);
  });
  it("domain search shows simulated results and adds to cart", async () => {
    const user = userEvent.setup();
    await renderAt("/domains/search?q=atlas-digital.ma");
    expect(await screen.findByText("SIMULATED availability")).toBeInTheDocument();
    const row = (await screen.findByText("atlas-digital.ma")).closest("li")!;
    await user.click(within(row).getByRole("button", { name: /Add/ }));
    expect(cartStore.get().lines[0]).toMatchObject({ kind: "domain", productId: "domain:.ma" });
  });
  it("invalid domain shows a validation error", async () => {
    await renderAt("/domains/search?q=bad_name");
    expect(await screen.findByText("Invalid name")).toBeInTheDocument();
  });
  it("cart applies coupon", async () => {
    const user = userEvent.setup();
    cartStore.set({ lines: [{ key: "k", productId: "shared-business", name: "Business", kind: "product", cycle: "monthly", quantity: 1, unitPrice: 1000 }], coupon: "" });
    await renderAt("/cart");
    await user.type(await screen.findByLabelText("Coupon code"), "STARTUP20");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByText(/Coupon STARTUP20 applied/)).toBeInTheDocument();
    expect(screen.getByText("−MAD 200")).toBeInTheDocument();
  });
  it("switches language to French", async () => {
    const user = userEvent.setup();
    await renderAt("/");
    await user.selectOptions((await screen.findAllByLabelText("Language"))[0]!, "fr");
    expect(await screen.findByRole("heading", { level: 1, name: /Votre présence en ligne commence par un nom de domaine/ })).toBeInTheDocument();
  });
  it("unknown routes render the 404 page", async () => {
    await renderAt("/this-does-not-exist");
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});

describe("portals", () => {
  it("customer area asks for demo role when signed out", async () => {
    await renderAt("/client/dashboard");
    expect(await screen.findByRole("button", { name: "Continue as demo customer" })).toBeInTheDocument();
  });
  it("customer can open a support ticket", async () => {
    const user = userEvent.setup();
    sessionStore.set(DEMO_ACCOUNTS.customer);
    await renderAt("/client/support");
    await user.click(await screen.findByRole("button", { name: "New ticket" }));
    await user.type(screen.getByLabelText("Subject"), "Cannot reach FTP");
    await user.type(screen.getByLabelText("Message"), "Connection times out on port 21.");
    await user.click(screen.getByRole("button", { name: "Create ticket" }));
    await waitFor(() => expect(db.get().tickets.some((t) => t.subject === "Cannot reach FTP" && t.customerId === "cus-1001")).toBe(true));
  });
  it("admin can create a coupon through the CRUD dialog", async () => {
    const user = userEvent.setup();
    sessionStore.set(DEMO_ACCOUNTS.admin);
    await renderAt("/admin/coupons");
    await user.click(await screen.findByRole("button", { name: /New coupon/ }));
    await user.type(screen.getByLabelText("Code *"), "SPRING15");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(db.get().coupons.some((c) => c.code === "SPRING15")).toBe(true));
  });
  it("admin product delete asks for confirmation", async () => {
    const user = userEvent.setup();
    sessionStore.set(DEMO_ACCOUNTS.admin);
    await renderAt("/admin/products");
    await user.click((await screen.findAllByRole("button", { name: "Delete Product" }))[0]!);
    const before = db.get().products.length;
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(db.get().products.length).toBe(before - 1);
  });
  it("CMS publish persists the page status", async () => {
    const user = userEvent.setup();
    sessionStore.set(DEMO_ACCOUNTS.admin);
    await renderAt("/admin/cms/pages/pg-2");
    await user.click(await screen.findByRole("button", { name: "Publish" }));
    expect(db.find("pages", "pg-2")?.status).toBe("published");
    await user.click(await screen.findByRole("button", { name: "Unpublish" }));
    expect(db.find("pages", "pg-2")?.status).toBe("draft");
  });
  it("reseller pricing shows margin against wholesale", async () => {
    sessionStore.set(DEMO_ACCOUNTS.reseller);
    await renderAt("/reseller/pricing");
    expect(await screen.findByRole("heading", { name: "Pricing & margins" })).toBeInTheDocument();
    expect(screen.getAllByText(/%\)/).length).toBeGreaterThan(0);
  });
});
