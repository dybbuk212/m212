import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Eye, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, Badge, Button, ButtonLink, Card, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Select, StatusBadge, Table, Td, Textarea, Th } from "@/components/ui";
import { formatDate } from "@/lib/i18n";
import { mediaDb, validateMediaFile } from "@/lib/media-db";
import { useSeo } from "@/lib/seo";
import { db, uid, useDb } from "@/lib/store";
import { slugify } from "@/lib/utils";
import type { BlogPost, CmsBlock, CmsBlockType, CmsPage, Menu } from "@/types/models";
import { adminSeo, audit } from "@/features/admin/AdminCommerce";
import { BlockRenderer, MediaImage } from "./BlockRenderer";

export const RESERVED_SLUGS = ["admin", "client", "reseller", "blog", "cart", "checkout", "login", "register"];
export function validateSlug(slug: string, taken: string[]): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "Slug: lower-case letters, digits and single hyphens.";
  if (RESERVED_SLUGS.includes(slug)) return "This slug is reserved.";
  if (taken.includes(slug)) return "Slug already used.";
  return null;
}

export function newBlock(type: CmsBlockType): CmsBlock {
  const id = uid("blk");
  switch (type) {
    case "hero": return { id, type, title: "New hero", subtitle: "", ctaLabel: "Get started", ctaHref: "/pricing" };
    case "heading": return { id, type, text: "Heading" };
    case "text": return { id, type, text: "Write your content…" };
    case "image": return { id, type, src: "", alt: "" };
    case "image-text": return { id, type, src: "", alt: "", text: "" };
    case "features": return { id, type, items: ["Feature one", "Feature two", "Feature three"] };
    case "pricing": return { id, type, productIds: ["shared-starter", "shared-business"] };
    case "faq": return { id, type, items: [{ q: "Question?", a: "Answer." }] };
    case "cta": return { id, type, title: "Ready to start?", ctaLabel: "Contact us", ctaHref: "/contact" };
    case "testimonials": return { id, type, items: [{ quote: "Demo quote", author: "Sample persona" }] };
    case "contact": return { id, type, email: "contact@m212.ma", phone: "+212 …" };
  }
}
const BLOCK_TYPES: { type: CmsBlockType; label: string }[] = [
  { type: "hero", label: "Hero" }, { type: "heading", label: "Heading" }, { type: "text", label: "Text" }, { type: "image", label: "Image" }, { type: "image-text", label: "Image with text" },
  { type: "features", label: "Feature grid" }, { type: "pricing", label: "Pricing section" }, { type: "faq", label: "FAQ" }, { type: "cta", label: "CTA" }, { type: "testimonials", label: "Testimonials" }, { type: "contact", label: "Contact section" },
];

export function moveItem<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir; if (j < 0 || j >= list.length) return list;
  const copy = [...list]; [copy[i], copy[j]] = [copy[j]!, copy[i]!]; return copy;
}

function MediaPicker({ value, onChange, label }: { value?: string; onChange: (v: string) => void; label: string }) {
  const media = useDb().media;
  return (
    <Field label={label} hint="Choose from the media library or paste an image URL.">{(id) => (
      <div className="flex gap-2"><Select id={id} className="w-48" value={value?.startsWith("media:") ? value : ""} onChange={(e) => onChange(e.target.value)}><option value="">— URL / none —</option>{media.map((m) => <option key={m.id} value={`media:${m.id}`}>{m.name}</option>)}</Select>
        <Input aria-label={`${label} URL`} placeholder="https://…" value={value && !value.startsWith("media:") ? value : ""} onChange={(e) => onChange(e.target.value)} /></div>)}</Field>
  );
}

function BlockEditor({ block, onChange }: { block: CmsBlock; onChange: (b: CmsBlock) => void }) {
  const products = useDb().products;
  const txt = (label: string, key: string, area = false) => <Field label={label}>{(id) => area ? <Textarea id={id} value={String((block as Record<string, unknown>)[key] ?? "")} onChange={(e) => onChange({ ...block, [key]: e.target.value } as CmsBlock)} /> : <Input id={id} value={String((block as Record<string, unknown>)[key] ?? "")} onChange={(e) => onChange({ ...block, [key]: e.target.value } as CmsBlock)} />}</Field>;
  switch (block.type) {
    case "hero": return <div className="grid gap-3 sm:grid-cols-2">{txt("Title", "title")}{txt("Subtitle", "subtitle")}{txt("Button label", "ctaLabel")}{txt("Button link", "ctaHref")}</div>;
    case "heading": return txt("Text", "text");
    case "text": return txt("Text (blank line = new paragraph)", "text", true);
    case "image": return <div className="grid gap-3"><MediaPicker label="Image" value={block.src} onChange={(src) => onChange({ ...block, src })} />{txt("Alt text", "alt")}</div>;
    case "image-text": return <div className="grid gap-3"><MediaPicker label="Image" value={block.src} onChange={(src) => onChange({ ...block, src })} />{txt("Alt text", "alt")}{txt("Text", "text", true)}</div>;
    case "features": return <Field label="Features (one per line)">{(id) => <Textarea id={id} value={block.items.join("\n")} onChange={(e) => onChange({ ...block, items: e.target.value.split("\n") })} />}</Field>;
    case "pricing": return <fieldset><legend className="mb-2 text-sm font-semibold">Products</legend><div className="grid gap-1 sm:grid-cols-3">{products.map((p) => <label key={p.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-green" checked={block.productIds.includes(p.id)} onChange={() => onChange({ ...block, productIds: block.productIds.includes(p.id) ? block.productIds.filter((x) => x !== p.id) : [...block.productIds, p.id] })} />{p.name}</label>)}</div></fieldset>;
    case "faq": return <div className="space-y-2">{block.items.map((it, i) => <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><Input aria-label={`Question ${i + 1}`} value={it.q} onChange={(e) => onChange({ ...block, items: block.items.map((x, j) => j === i ? { ...x, q: e.target.value } : x) })} /><Input aria-label={`Answer ${i + 1}`} value={it.a} onChange={(e) => onChange({ ...block, items: block.items.map((x, j) => j === i ? { ...x, a: e.target.value } : x) })} /><Button size="icon" variant="ghost" aria-label="Remove question" onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button></div>)}<Button size="sm" variant="outline" onClick={() => onChange({ ...block, items: [...block.items, { q: "", a: "" }] })}>Add question</Button></div>;
    case "cta": return <div className="grid gap-3 sm:grid-cols-3">{txt("Title", "title")}{txt("Button label", "ctaLabel")}{txt("Button link", "ctaHref")}</div>;
    case "testimonials": return <div className="space-y-2"><p className="text-xs text-muted-foreground">Testimonials render with a “Demo content” label. Do not publish invented reviews as real.</p>{block.items.map((it, i) => <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]"><Input aria-label={`Quote ${i + 1}`} value={it.quote} onChange={(e) => onChange({ ...block, items: block.items.map((x, j) => j === i ? { ...x, quote: e.target.value } : x) })} /><Input aria-label={`Author ${i + 1}`} value={it.author} onChange={(e) => onChange({ ...block, items: block.items.map((x, j) => j === i ? { ...x, author: e.target.value } : x) })} /><Button size="icon" variant="ghost" aria-label="Remove testimonial" onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button></div>)}<Button size="sm" variant="outline" onClick={() => onChange({ ...block, items: [...block.items, { quote: "", author: "" }] })}>Add testimonial</Button></div>;
    case "contact": return <div className="grid gap-3 sm:grid-cols-2">{txt("Email", "email")}{txt("Phone", "phone")}</div>;
  }
}

export function CmsPagesList() {
  useSeo(adminSeo("CMS pages", "/admin/cms/pages"));
  const d = useDb(); const navigate = useNavigate();
  const [del, setDel] = useState<CmsPage | null>(null);
  return (<><PageHeader title="Pages" description="Published pages are served at /p/your-slug." actions={<Button variant="brand" onClick={() => {
      const base = "new-page"; let slug = base; let n = 1; while (d.pages.some((p) => p.slug === slug)) slug = `${base}-${++n}`;
      const now = new Date().toISOString(); const page: CmsPage = { id: uid("pg"), title: "New page", slug, seoTitle: "", seoDescription: "", status: "draft", publishAt: now, updatedAt: now, blocks: [newBlock("hero")] };
      db.insert("pages", page); audit("cms.page.create", slug); void navigate({ to: "/admin/cms/pages/$id", params: { id: page.id } });
    }}><Plus className="h-4 w-4" />New page</Button>} />
    {d.pages.length === 0 ? <EmptyState title="No pages yet" /> : <Table><thead><tr><Th>Title</Th><Th>Slug</Th><Th>Status</Th><Th>Blocks</Th><Th>Updated</Th><Th className="text-right">Actions</Th></tr></thead><tbody>
      {d.pages.map((p) => <tr key={p.id}><Td className="font-semibold">{p.title}</Td><Td className="font-mono text-xs">/p/{p.slug}</Td><Td><StatusBadge status={p.status} /></Td><Td>{p.blocks.length}</Td><Td>{formatDate(p.updatedAt)}</Td>
        <Td className="whitespace-nowrap text-right"><ButtonLink to="/admin/cms/pages/$id" params={{ id: p.id }} size="sm" variant="outline">Edit</ButtonLink>{p.status === "published" && <ButtonLink to="/p/$slug" params={{ slug: p.slug }} size="sm" variant="ghost">View</ButtonLink>}<Button size="icon" variant="ghost" aria-label={`Delete ${p.title}`} onClick={() => setDel(p)}><Trash2 className="h-4 w-4" /></Button></Td></tr>)}</tbody></Table>}
    <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Delete page?" body={`"${del?.title}" will be permanently removed from the demo CMS.`} onConfirm={() => { if (del) { db.remove("pages", del.id); audit("cms.page.delete", del.slug); toast.success("Page deleted"); } }} /></>);
}

export function CmsPageEditor({ id }: { id: string }) {
  const d = useDb();
  const stored = d.pages.find((p) => p.id === id);
  useSeo(adminSeo(stored ? `Edit ${stored.title}` : "Page", `/admin/cms/pages/${id}`));
  const [page, setPage] = useState<CmsPage | undefined>(stored ? structuredClone(stored) : undefined);
  const [preview, setPreview] = useState(false);
  const [addType, setAddType] = useState<CmsBlockType>("text");
  const [err, setErr] = useState("");
  if (!page || !stored) return <EmptyState title="Page not found" action={<ButtonLink to="/admin/cms/pages">Back to pages</ButtonLink>} />;
  const dirty = JSON.stringify(page) !== JSON.stringify(stored);
  const persist = (status: CmsPage["status"], msg: string) => {
    if (!page.title.trim()) { setErr("Title is required."); return; }
    const slugErr = validateSlug(page.slug, d.pages.filter((p) => p.id !== page.id).map((p) => p.slug)); if (slugErr) { setErr(slugErr); return; }
    setErr("");
    const next = { ...page, status, updatedAt: new Date().toISOString(), blocks: page.blocks.map((b) => b.type === "features" ? { ...b, items: b.items.map((s) => s.trim()).filter(Boolean) } : b) };
    db.patch("pages", page.id, next); setPage(next); audit(`cms.page.${status === stored.status ? "save" : status === "published" ? "publish" : "unpublish"}`, page.slug); toast.success(msg);
  };
  const setBlock = (i: number, b: CmsBlock) => setPage({ ...page, blocks: page.blocks.map((x, j) => (j === i ? b : x)) });
  return (
    <>
      <PageHeader eyebrow="CMS · Page" title={page.title || "Untitled"} description={dirty ? "Unsaved changes" : `Saved · ${stored.status}`} actions={<>
        <StatusBadge status={stored.status} />
        <Button variant="outline" onClick={() => setPreview(true)}><Eye className="h-4 w-4" />Preview</Button>
        <Button variant="outline" onClick={() => persist(page.status, "Changes saved")}>Save changes</Button>
        {stored.status === "published" ? <Button variant="ghost" onClick={() => persist("draft", "Page unpublished")}>Unpublish</Button> : <Button variant="success" onClick={() => persist("published", "Page published")}>Publish</Button>}</>} />
      {err && <Alert tone="danger" className="mb-4">{err}</Alert>}
      {stored.status === "published" && new Date(stored.publishAt) > new Date() && <Alert tone="warning" className="mb-4">Scheduled: goes live on {formatDate(stored.publishAt)}.</Alert>}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {page.blocks.map((b, i) => (
            <Card key={b.id} className="p-4">
              <div className="mb-3 flex items-center justify-between"><Badge tone="info">{BLOCK_TYPES.find((t) => t.type === b.type)?.label}</Badge>
                <div className="flex"><Button size="icon" variant="ghost" aria-label="Move block up" disabled={i === 0} onClick={() => setPage({ ...page, blocks: moveItem(page.blocks, i, -1) })}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Move block down" disabled={i === page.blocks.length - 1} onClick={() => setPage({ ...page, blocks: moveItem(page.blocks, i, 1) })}><ArrowDown className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Delete block" onClick={() => setPage({ ...page, blocks: page.blocks.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button></div></div>
              <BlockEditor block={b} onChange={(nb) => setBlock(i, nb)} />
            </Card>
          ))}
          <Card className="flex flex-wrap items-end gap-2 p-4"><Field label="Add block" className="w-56">{(fid) => <Select id={fid} value={addType} onChange={(e) => setAddType(e.target.value as CmsBlockType)}>{BLOCK_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}</Select>}</Field><Button onClick={() => setPage({ ...page, blocks: [...page.blocks, newBlock(addType)] })}><Plus className="h-4 w-4" />Add</Button></Card>
        </div>
        <Card className="h-fit space-y-3 p-4 lg:sticky lg:top-20">
          <Field label="Title">{(fid) => <Input id={fid} value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} />}</Field>
          <Field label="Slug" hint={`/p/${page.slug}`}>{(fid) => <div className="flex gap-1"><Input id={fid} value={page.slug} onChange={(e) => setPage({ ...page, slug: e.target.value.toLowerCase() })} /><Button size="sm" variant="ghost" onClick={() => setPage({ ...page, slug: slugify(page.title) })}>Auto</Button></div>}</Field>
          <Field label={`SEO title (${page.seoTitle.length}/70)`}>{(fid) => <Input id={fid} value={page.seoTitle} onChange={(e) => setPage({ ...page, seoTitle: e.target.value })} />}</Field>
          <Field label={`SEO description (${page.seoDescription.length}/160)`}>{(fid) => <Textarea id={fid} value={page.seoDescription} onChange={(e) => setPage({ ...page, seoDescription: e.target.value })} />}</Field>
          <MediaPicker label="Featured image" value={page.featuredImage} onChange={(v) => setPage({ ...page, featuredImage: v || undefined })} />
          <Field label="Publish date">{(fid) => <Input id={fid} type="datetime-local" value={page.publishAt.slice(0, 16)} onChange={(e) => e.target.value && setPage({ ...page, publishAt: new Date(e.target.value).toISOString() })} />}</Field>
          {stored.status === "published" && <Link to="/p/$slug" params={{ slug: stored.slug }} className="block text-sm font-semibold text-brand-green">Open public page →</Link>}
        </Card>
      </div>
      <Dialog open={preview} onClose={() => setPreview(false)} title={`Preview — ${page.title}`} wide>
        <Alert tone="warning" className="mb-4">Preview of the current (possibly unsaved) content.</Alert>
        <div className="space-y-8">{page.featuredImage && <MediaImage src={page.featuredImage} alt={page.title} className="max-h-60 w-full rounded-xl object-cover" />}{page.blocks.map((b) => <BlockRenderer key={b.id} block={b} />)}</div>
      </Dialog>
    </>
  );
}

export function CmsBlogList() {
  useSeo(adminSeo("Blog", "/admin/cms/blog"));
  const d = useDb(); const navigate = useNavigate();
  const [del, setDel] = useState<BlogPost | null>(null);
  const [cat, setCat] = useState("all");
  const cats = Array.from(new Set(d.posts.map((p) => p.category)));
  const list = d.posts.filter((p) => cat === "all" || p.category === cat).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return (<><PageHeader title="Blog" actions={<Button variant="brand" onClick={() => {
      let slug = "new-article"; let n = 1; while (d.posts.some((p) => p.slug === slug)) slug = `new-article-${++n}`;
      const post: BlogPost = { id: uid("post"), title: "New article", slug, category: cats[0] ?? "News", tags: [], excerpt: "", content: "", seoTitle: "", seoDescription: "", status: "draft", publishedAt: new Date().toISOString(), author: "M212 Team" };
      db.insert("posts", post); audit("cms.post.create", slug); void navigate({ to: "/admin/cms/blog/$id", params: { id: post.id } });
    }}><Plus className="h-4 w-4" />New article</Button>} />
    <div className="mb-4 w-48"><Select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}</Select></div>
    {list.length === 0 ? <EmptyState title="No articles" /> : <Table><thead><tr><Th>Title</Th><Th>Category</Th><Th>Tags</Th><Th>Status</Th><Th>Date</Th><Th className="text-right">Actions</Th></tr></thead><tbody>
      {list.map((p) => <tr key={p.id}><Td className="font-semibold">{p.title}</Td><Td>{p.category}</Td><Td className="text-xs">{p.tags.join(", ")}</Td><Td><StatusBadge status={p.status} /></Td><Td>{formatDate(p.publishedAt)}</Td>
        <Td className="whitespace-nowrap text-right"><ButtonLink to="/admin/cms/blog/$id" params={{ id: p.id }} size="sm" variant="outline">Edit</ButtonLink><Button size="icon" variant="ghost" aria-label={`Delete ${p.title}`} onClick={() => setDel(p)}><Trash2 className="h-4 w-4" /></Button></Td></tr>)}</tbody></Table>}
    <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Delete article?" body={`"${del?.title}" will be removed.`} onConfirm={() => { if (del) { db.remove("posts", del.id); audit("cms.post.delete", del.slug); toast.success("Article deleted"); } }} /></>);
}

export function CmsBlogEditor({ id }: { id: string }) {
  const d = useDb();
  const stored = d.posts.find((p) => p.id === id);
  useSeo(adminSeo(stored ? `Edit ${stored.title}` : "Article", `/admin/cms/blog/${id}`));
  const [post, setPost] = useState<BlogPost | undefined>(stored ? structuredClone(stored) : undefined);
  const [tags, setTags] = useState(stored?.tags.join(", ") ?? "");
  const [preview, setPreview] = useState(false);
  const [err, setErr] = useState("");
  if (!post || !stored) return <EmptyState title="Article not found" action={<ButtonLink to="/admin/cms/blog">Back</ButtonLink>} />;
  const persist = (status: BlogPost["status"], msg: string) => {
    if (!post.title.trim()) { setErr("Title is required."); return; }
    const slugErr = validateSlug(post.slug, d.posts.filter((p) => p.id !== post.id).map((p) => p.slug)); if (slugErr) { setErr(slugErr); return; }
    if (status === "published" && post.content.trim().length < 20) { setErr("Content must be at least 20 characters before publishing."); return; }
    setErr(""); const next = { ...post, status, tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) };
    db.patch("posts", post.id, next); setPost(next); audit(`cms.post.${status}`, post.slug); toast.success(msg);
  };
  const f = (label: string, key: "title" | "category" | "author" | "seoTitle", hint?: string) => <Field label={label} hint={hint}>{(fid) => <Input id={fid} value={post[key]} onChange={(e) => setPost({ ...post, [key]: e.target.value })} />}</Field>;
  return (
    <>
      <PageHeader eyebrow="CMS · Blog" title={post.title || "Untitled"} actions={<><StatusBadge status={stored.status} /><Button variant="outline" onClick={() => setPreview(true)}><Eye className="h-4 w-4" />Preview</Button><Button variant="outline" onClick={() => persist(post.status, "Changes saved")}>Save changes</Button>
        {stored.status === "published" ? <Button variant="ghost" onClick={() => persist("draft", "Article unpublished")}>Unpublish</Button> : <Button variant="success" onClick={() => persist("published", "Article published")}>Publish</Button>}</>} />
      {err && <Alert tone="danger" className="mb-4">{err}</Alert>}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="space-y-3 p-5">{f("Title", "title")}
          <Field label="Excerpt">{(fid) => <Textarea id={fid} value={post.excerpt} onChange={(e) => setPost({ ...post, excerpt: e.target.value })} />}</Field>
          <Field label="Content" hint="Blank line = new paragraph">{(fid) => <Textarea id={fid} rows={14} value={post.content} onChange={(e) => setPost({ ...post, content: e.target.value })} />}</Field></Card>
        <Card className="h-fit space-y-3 p-4">
          <Field label="Slug" hint={`/blog/${post.slug}`}>{(fid) => <div className="flex gap-1"><Input id={fid} value={post.slug} onChange={(e) => setPost({ ...post, slug: e.target.value.toLowerCase() })} /><Button size="sm" variant="ghost" onClick={() => setPost({ ...post, slug: slugify(post.title) })}>Auto</Button></div>}</Field>
          {f("Category", "category")}<Field label="Tags" hint="Comma separated">{(fid) => <Input id={fid} value={tags} onChange={(e) => setTags(e.target.value)} />}</Field>{f("Author", "author")}
          <MediaPicker label="Featured image" value={post.featuredImage} onChange={(v) => setPost({ ...post, featuredImage: v || undefined })} />
          {f("SEO title", "seoTitle")}<Field label="SEO description">{(fid) => <Textarea id={fid} value={post.seoDescription} onChange={(e) => setPost({ ...post, seoDescription: e.target.value })} />}</Field>
          <Field label="Publication date">{(fid) => <Input id={fid} type="datetime-local" value={post.publishedAt.slice(0, 16)} onChange={(e) => e.target.value && setPost({ ...post, publishedAt: new Date(e.target.value).toISOString() })} />}</Field>
          {stored.status === "published" && <Link to="/blog/$slug" params={{ slug: stored.slug }} className="block text-sm font-semibold text-brand-green">Open public article →</Link>}
        </Card>
      </div>
      <Dialog open={preview} onClose={() => setPreview(false)} title="Article preview" wide>
        <h1 className="text-3xl font-extrabold">{post.title}</h1><p className="text-sm text-muted-foreground">{post.author} · {post.category}</p>
        {post.featuredImage && <MediaImage src={post.featuredImage} alt={post.title} className="mt-4 w-full rounded-xl" />}
        <div className="mt-4 space-y-3">{post.content.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
      </Dialog>
    </>
  );
}

export function CmsMenus() {
  useSeo(adminSeo("Menus", "/admin/cms/menus"));
  const d = useDb();
  const [sel, setSel] = useState(d.menus[0]?.id ?? "");
  const [link, setLink] = useState({ label: "", href: "" });
  const menu = d.menus.find((m) => m.id === sel);
  const save = (m: Menu, msg?: string) => { db.patch("menus", m.id, m); audit("cms.menu.save", m.name); if (msg) toast.success(msg); };
  return (<><PageHeader title="Menus" description="Footer menus render in the site footer; header menus are listed for future navigation slots." actions={<Button variant="brand" onClick={() => { const m: Menu = { id: uid("menu"), name: "New menu", location: "none", items: [] }; db.insert("menus", m); setSel(m.id); audit("cms.menu.create", m.id); }}><Plus className="h-4 w-4" />New menu</Button>} />
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <ul className="space-y-1">{d.menus.map((m) => <li key={m.id}><button type="button" onClick={() => setSel(m.id)} className={`w-full rounded-md px-3 py-2 text-left text-sm ${sel === m.id ? "bg-brand-navy-deep text-on-dark" : "hover:bg-muted"}`}>{m.name}<span className="block text-xs opacity-70">{m.location} · {m.items.length} links</span></button></li>)}</ul>
      {menu ? <Card className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]"><Field label="Menu name">{(id) => <Input id={id} value={menu.name} onChange={(e) => save({ ...menu, name: e.target.value })} />}</Field>
          <Field label="Location">{(id) => <Select id={id} value={menu.location} onChange={(e) => save({ ...menu, location: e.target.value as Menu["location"] }, "Location updated")}><option value="header">Header</option><option value="footer">Footer</option><option value="none">Not displayed</option></Select>}</Field>
          <Button variant="ghost" className="self-end" onClick={() => { db.remove("menus", menu.id); setSel(d.menus.find((m) => m.id !== menu.id)?.id ?? ""); toast.success("Menu deleted"); }}>Delete menu</Button></div>
        <ul className="divide-y rounded-lg border">{menu.items.length === 0 && <li className="p-3 text-sm text-muted-foreground">No links yet.</li>}{menu.items.map((it, i) => <li key={it.id} className="flex items-center gap-2 p-2">
          <Input aria-label="Link label" value={it.label} onChange={(e) => save({ ...menu, items: menu.items.map((x) => x.id === it.id ? { ...x, label: e.target.value } : x) })} />
          <Input aria-label="Link URL" value={it.href} onChange={(e) => save({ ...menu, items: menu.items.map((x) => x.id === it.id ? { ...x, href: e.target.value } : x) })} />
          <Button size="icon" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => save({ ...menu, items: moveItem(menu.items, i, -1) })}><ArrowUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Move down" disabled={i === menu.items.length - 1} onClick={() => save({ ...menu, items: moveItem(menu.items, i, 1) })}><ArrowDown className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Remove link" onClick={() => save({ ...menu, items: menu.items.filter((x) => x.id !== it.id) }, "Link removed")}><Trash2 className="h-4 w-4" /></Button></li>)}</ul>
        <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (!link.label.trim() || !(link.href.startsWith("/") || /^https?:\/\//.test(link.href))) { toast.error("Label required; URL must start with / or https://"); return; } save({ ...menu, items: [...menu.items, { id: uid("mi"), ...link }] }, "Link added"); setLink({ label: "", href: "" }); }}>
          <Field label="Label">{(id) => <Input id={id} value={link.label} onChange={(e) => setLink({ ...link, label: e.target.value })} />}</Field>
          <Field label="URL">{(id) => <Input id={id} placeholder="/pricing" value={link.href} onChange={(e) => setLink({ ...link, href: e.target.value })} />}</Field>
          <Button type="submit">Add link</Button></form>
      </Card> : <EmptyState title="No menu selected" />}
    </div></>);
}

export function CmsMedia() {
  useSeo(adminSeo("Media library", "/admin/cms/media"));
  const d = useDb();
  const input = useRef<HTMLInputElement>(null);
  const [rename, setRename] = useState<{ id: string; name: string } | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const upload = async (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) {
      const err = validateMediaFile(file); if (err) { toast.error(`${file.name}: ${err}`); continue; }
      const id = uid("media");
      try { await mediaDb.put(id, file); db.insert("media", { id, name: file.name, type: file.type, size: file.size, createdAt: new Date().toISOString() }); audit("cms.media.upload", file.name); toast.success(`${file.name} uploaded`); }
      catch { toast.error("Could not store the file in this browser"); }
    }
  };
  return (<><PageHeader title="Media library" description="Images are stored locally in IndexedDB (PNG, JPEG, WebP, GIF, SVG — max 2 MB)." actions={<><Button variant="brand" onClick={() => input.current?.click()}><Upload className="h-4 w-4" />Upload images</Button><input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" multiple className="hidden" aria-label="Upload images" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} /></>} />
    {d.media.length === 0 ? <EmptyState title="No media yet" body="Upload images to use them in pages and articles." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{d.media.map((m) => (
      <Card key={m.id} className="overflow-hidden"><MediaImage src={`media:${m.id}`} alt={m.name} className="aspect-video w-full object-cover" />
        <div className="p-3"><p className="truncate text-sm font-semibold" title={m.name}>{m.name}</p><p className="text-xs text-muted-foreground">{(m.size / 1024).toFixed(0)} KB · {m.type.split("/")[1]}</p>
          <div className="mt-2 flex gap-1"><Button size="sm" variant="outline" onClick={() => setRename({ id: m.id, name: m.name })}>Rename</Button><Button size="sm" variant="ghost" onClick={() => setDel(m.id)}>Delete</Button></div></div></Card>))}</div>}
    {rename && <Dialog open title="Rename media" onClose={() => setRename(null)} footer={<><Button variant="outline" onClick={() => setRename(null)}>Cancel</Button><Button onClick={() => { if (!rename.name.trim()) return; db.patch("media", rename.id, { name: rename.name.trim() }); toast.success("Renamed"); setRename(null); }}>Save</Button></>}><Field label="File name">{(id) => <Input id={id} value={rename.name} onChange={(e) => setRename({ ...rename, name: e.target.value })} />}</Field></Dialog>}
    <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Delete image?" body="Pages using this image will show a placeholder." onConfirm={() => { if (del) { void mediaDb.delete(del).catch(() => undefined); db.remove("media", del); audit("cms.media.delete", del); toast.success("Image deleted"); } }} /></>);
}

export function CmsPageEditorRoute() { const { id } = useParams({ strict: false }) as { id: string }; return <CmsPageEditor key={id} id={id} />; }
export function CmsBlogEditorRoute() { const { id } = useParams({ strict: false }) as { id: string }; return <CmsBlogEditor key={id} id={id} />; }
