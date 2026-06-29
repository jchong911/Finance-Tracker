"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_BUCKETS } from "@/lib/budgetRatios";

type Bucket = { id: string; name: string; percent: number };
type BucketLike = { id?: unknown; name?: unknown; percent?: unknown };
type Category = { id: string; name: string; kind: "income" | "expense"; icon: string };
type CategoryBucketMap = Record<string, string>;

function uid() {
  return Math.random().toString(16).slice(2);
}

const DEFAULT_BUCKETS_LOCAL = DEFAULT_BUCKETS;

export function RatiosForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>(DEFAULT_BUCKETS_LOCAL);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<CategoryBucketMap>({});

  const sum = useMemo(
    () => buckets.reduce((s, b) => s + (Number.isFinite(b.percent) ? b.percent : 0), 0),
    [buckets]
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/budget-ratios");
        const json = await res.json();
        const loaded = json?.ratios?.buckets;
        const loadedMap = json?.ratios?.category_bucket_map;
        if (Array.isArray(loaded) && loaded.length >= 2) {
          setBuckets(
            (loaded as BucketLike[]).map((b) => ({
              id: String(b.id ?? uid()),
              name: String(b.name ?? ""),
              percent: Number(b.percent ?? 0),
            }))
          );
        }
        if (loadedMap && typeof loadedMap === "object") {
          setCategoryMap(loadedMap as CategoryBucketMap);
        }

        const supabase = createClient();
        const { data: cats } = await supabase
          .from("categories")
          .select("id, name, kind, icon")
          .order("kind")
          .order("name");
        setCategories((cats ?? []) as Category[]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/budget-ratios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buckets, category_bucket_map: categoryMap }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Could not save ratios.");
        setSaving(false);
        return;
      }
      setSuccess("Saved.");
    } catch {
      setError("Could not save ratios.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <p className="text-sm text-muted">
          Define your budget buckets and target percentages. Total must be 100%.
        </p>

        <div className="space-y-3">
          {buckets.map((b, idx) => (
            <div key={b.id} className="grid grid-cols-1 gap-2">
              <Input
                label={`Bucket ${idx + 1} name`}
                value={b.name}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setBuckets((prev) =>
                    prev.map((x) => (x.id === b.id ? { ...x, name: v } : x))
                  );
                }}
              />
              <Input
                label="Percent"
                inputMode="numeric"
                value={String(b.percent)}
                onChange={(e) => {
                  const v = Number(String(e.currentTarget.value).replace(/[^\d.]/g, ""));
                  setBuckets((prev) =>
                    prev.map((x) => (x.id === b.id ? { ...x, percent: v } : x))
                  );
                }}
              />
              <Button
                type="button"
                variant="ghost"
                className="justify-start"
                disabled={buckets.length <= 2}
                onClick={() => setBuckets((prev) => prev.filter((x) => x.id !== b.id))}
              >
                Remove bucket
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setBuckets((prev) => [...prev, { id: uid(), name: "New bucket", percent: 0 }])
          }
          disabled={buckets.length >= 6}
        >
          Add bucket
        </Button>

        <p className={`text-sm ${Math.abs(sum - 100) < 0.001 ? "text-muted" : "text-danger"}`}>
          Total: {sum.toFixed(0)}%
        </p>

        {error && <p className="text-sm text-danger">{error}</p>}
        {success && <p className="text-sm text-accent">{success}</p>}

        <Button type="button" className="w-full" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save ratios"}
        </Button>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-muted">Category routing (optional)</h2>
        <p className="text-sm text-muted">
          Expenses are auto-sorted: bills and groceries → Necessary, dining and
          shopping → Wants. Override here only if you want different routing.
        </p>

        <div className="space-y-3">
          {categories
            .filter((c) => c.kind === "expense")
            .map((c) => {
              const selected = categoryMap[c.id] ?? "";
              return (
                <label key={c.id} className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted">
                    {c.icon} {c.name}
                  </span>
                  <select
                    className="rounded-xl border border-card-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
                    value={selected}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      setCategoryMap((prev) => {
                        const next = { ...prev };
                        if (!v) {
                          delete next[c.id];
                          return next;
                        }
                        next[c.id] = v;
                        return next;
                      });
                      setSuccess(null);
                    }}
                  >
                    <option value="">Auto (default)</option>
                    {buckets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => setCategoryMap({})}
        >
          Clear mappings
        </Button>
      </Card>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => {
          setBuckets(DEFAULT_BUCKETS_LOCAL);
          setCategoryMap({});
          setError(null);
          setSuccess(null);
        }}
      >
        Reset to 50/30/20
      </Button>
    </div>
  );
}

