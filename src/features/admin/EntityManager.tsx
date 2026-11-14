import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button, ConfirmDialog, Dialog, EmptyState, Field, Input, Pagination, Select, Switch, Table, Td, Textarea, Th, usePagination } from "@/design-system/components/ui";

export type FieldDef<T> = {
  key: keyof T & string; label: string;
  kind: "text" | "email" | "number" | "textarea" | "select" | "switch" | "list" | "date";
  options?: { value: string; label: string }[]; required?: boolean; hint?: string; full?: boolean;
  validate?: (value: unknown, item: Partial<T>) => string | null;
};
export type ColumnDef<T> = { label: string; render: (item: T) => ReactNode; className?: string };

type Props<T extends { id: string }> = {
  items: T[]; columns: ColumnDef<T>[]; fields: FieldDef<T>[]; entityName: string;
  searchKeys: (keyof T & string)[]; filter?: { key: keyof T & string; label: string; options: string[] };
  create: () => T; onSave: (item: T, isNew: boolean) => void; onDelete: (item: T) => void;
  rowActions?: (item: T) => ReactNode; toolbar?: ReactNode; canCreate?: boolean; pageSize?: number;
};

/** Configurable CRUD surface used by admin modules that share the list/edit/delete pattern. */
export function EntityManager<T extends { id: string }>({ items, columns, fields, entityName, searchKeys, filter, create, onSave, onDelete, rowActions, toolbar, canCreate = true, pageSize = 10 }: Props<T>) {
  const [q, setQ] = useState("");
  const [fv, setFv] = useState("all");
  const [editing, setEditing] = useState<{ item: T; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const list = useMemo(() => items.filter((it) => {
    const rec = it as Record<string, unknown>;
    const matchQ = !q || searchKeys.some((k) => String(rec[k] ?? "").toLowerCase().includes(q.toLowerCase()));
    const matchF = !filter || fv === "all" || String(rec[filter.key]) === fv;
    return matchQ && matchF;
  }), [items, q, fv, searchKeys, filter]);
  const page = usePagination(list, pageSize);

  const set = (key: string, value: unknown) => setEditing((e) => (e ? { ...e, item: { ...e.item, [key]: value } } : e));
  const save = () => {
    if (!editing) return;
    const rec = editing.item as Record<string, unknown>;
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const v = rec[f.key];
      if (f.required && (v === undefined || v === null || String(v).trim() === "" || (Array.isArray(v) && v.length === 0))) errs[f.key] = `${f.label} is required`;
      else if (f.kind === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v))) errs[f.key] = "Enter a valid email";
      else if (f.kind === "number" && v !== undefined && Number.isNaN(Number(v))) errs[f.key] = "Must be a number";
      else { const custom = f.validate?.(v, editing.item); if (custom) errs[f.key] = custom; }
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave(editing.item, editing.isNew);
    toast.success(`${entityName} ${editing.isNew ? "created" : "updated"}`);
    setEditing(null);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-64"><span className="sr-only">Search {entityName}</span><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden /><Input className="pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        {filter && <Select aria-label={filter.label} className="w-44" value={fv} onChange={(e) => setFv(e.target.value)}><option value="all">All {filter.label.toLowerCase()}</option>{filter.options.map((o) => <option key={o} value={o}>{o}</option>)}</Select>}
        <span className="text-sm text-muted-foreground">{list.length} result(s)</span>
        <div className="ml-auto flex gap-2">{toolbar}{canCreate && <Button variant="brand" onClick={() => { setErrors({}); setEditing({ item: create(), isNew: true }); }}><Plus className="h-4 w-4" />New {entityName.toLowerCase()}</Button>}</div>
      </div>
      {list.length === 0 ? <EmptyState title={`No ${entityName.toLowerCase()} found`} body={q ? "Try another search." : undefined} /> : <>
        <Table><thead><tr>{columns.map((c) => <Th key={c.label} className={c.className}>{c.label}</Th>)}<Th className="text-right">Actions</Th></tr></thead>
          <tbody>{page.slice.map((it) => <tr key={it.id} className="hover:bg-muted/40">{columns.map((c) => <Td key={c.label} className={c.className}>{c.render(it)}</Td>)}
            <Td className="whitespace-nowrap text-right">{rowActions?.(it)}<Button size="icon" variant="ghost" aria-label={`Edit ${entityName}`} onClick={() => { setErrors({}); setEditing({ item: structuredClone(it), isNew: false }); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={`Delete ${entityName}`} onClick={() => setDeleting(it)}><Trash2 className="h-4 w-4" /></Button></Td></tr>)}</tbody>
        </Table><Pagination {...page} /></>}
      {editing && (
        <Dialog open wide title={`${editing.isNew ? "New" : "Edit"} ${entityName.toLowerCase()}`} onClose={() => setEditing(null)} footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const v = (editing.item as Record<string, unknown>)[f.key];
              return (
                <Field key={f.key} label={f.label + (f.required ? " *" : "")} hint={f.hint} error={errors[f.key]} className={f.full || f.kind === "textarea" || f.kind === "list" ? "sm:col-span-2" : undefined}>
                  {(id) => f.kind === "textarea" ? <Textarea id={id} value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} />
                    : f.kind === "select" ? <Select id={id} value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)}>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
                    : f.kind === "switch" ? <div id={id}><Switch checked={Boolean(v)} onChange={(c) => set(f.key, c)} label={f.label} /></div>
                    : f.kind === "list" ? <Textarea id={id} value={Array.isArray(v) ? v.join("\n") : ""} onChange={(e) => set(f.key, e.target.value.split("\n"))} onBlur={(e) => set(f.key, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} />
                    : f.kind === "number" ? <Input id={id} type="number" step="any" value={v === undefined ? "" : String(v)} onChange={(e) => set(f.key, e.target.value === "" ? undefined : Number(e.target.value))} />
                    : f.kind === "date" ? <Input id={id} type="date" value={String(v ?? "").slice(0, 10)} onChange={(e) => set(f.key, e.target.value ? new Date(e.target.value).toISOString() : "")} />
                    : <Input id={id} type={f.kind === "email" ? "email" : "text"} value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} />}
                </Field>
              );
            })}
          </div>
        </Dialog>
      )}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title={`Delete ${entityName.toLowerCase()}?`} body="This removes the record from the local demo data. You can restore everything with Reset demo data." onConfirm={() => { if (deleting) { onDelete(deleting); toast.success(`${entityName} deleted`); } }} />
    </div>
  );
}
