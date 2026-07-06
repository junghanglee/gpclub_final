import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type AdminLang, tx } from "@/components/admin/admin-i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

type BrandRow = {
  id: string;
  key: string;
  slug: string;
  name: string;
  description: string | null;
  published: boolean;
  sort_order: number;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyBrand(): BrandRow {
  return {
    id: "",
    key: "",
    slug: "",
    name: "",
    description: "",
    published: true,
    sort_order: 0,
  };
}

export default function BrandsTab({ lang }: { lang: AdminLang }) {
  const t = (key: Parameters<typeof tx>[1]) => tx(lang, key);
  const [rows, setRows] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BrandRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brands")
      .select("id,key,slug,name,description,published,sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data || []) as BrandRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const startNew = () => {
    setEditing(emptyBrand());
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) {
      toast.error("Brand name is required");
      return;
    }
    const slug = editing.slug.trim() || slugify(name);
    const key = editing.key.trim() || slug.replace(/-/g, "");
    const payload = {
      key,
      slug,
      name,
      description: editing.description?.trim() || null,
      published: editing.published,
      sort_order: Number(editing.sort_order) || 0,
    };
    const result = editing.id
      ? await supabase.from("brands").update(payload).eq("id", editing.id)
      : await supabase.from("brands").insert(payload);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    await load();
  };

  const remove = async (row: BrandRow) => {
    if (!confirm(`Delete brand ${row.name}? Products using this brand will block deletion.`))
      return;
    const { error } = await supabase.from("brands").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success(t("delete"));
      await load();
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black">Brands</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the canonical brand list used by products, catalogs, and public filters.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
          </Button>
          <Button onClick={startNew}>
            <Plus className="mr-1 h-4 w-4" /> New brand
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No brands yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Published</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead className="text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.published ? "Published" : "Hidden"}</TableCell>
                  <TableCell className="font-semibold">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.key}</TableCell>
                  <TableCell>{row.sort_order}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(row);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(row)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit brand" : "New brand"}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Sort order</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        sort_order: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Key</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.key}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        key: slugify(e.target.value).replace(/-/g, ""),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  className="mt-1.5"
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                <Label>Published</Label>
                <Switch
                  checked={editing.published}
                  onCheckedChange={(published) => setEditing({ ...editing, published })}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={save}>{t("save")}</Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
