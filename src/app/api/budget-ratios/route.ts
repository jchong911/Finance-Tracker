import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Bucket = { id: string; name: string; percent: number };
type CategoryBucketMap = Record<string, string>;

function validateBuckets(buckets: Bucket[]) {
  if (!Array.isArray(buckets) || buckets.length < 2 || buckets.length > 6) {
    return "Provide 2 to 6 buckets.";
  }
  for (const b of buckets) {
    if (!b?.id || !b?.name) return "Each bucket needs an id and name.";
    if (!Number.isFinite(b.percent) || b.percent < 0) {
      return "Each bucket needs a valid percent >= 0.";
    }
  }
  const sum = buckets.reduce((s, b) => s + b.percent, 0);
  if (Math.abs(sum - 100) > 0.001) {
    return "Percentages must total 100.";
  }
  return null;
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("budget_ratios").select("*").single();
  if (error) return NextResponse.json({ ratios: null });
  return NextResponse.json({ ratios: data });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      buckets: Bucket[];
      category_bucket_map?: CategoryBucketMap;
    };
    const buckets = body?.buckets ?? [];
    const category_bucket_map = body?.category_bucket_map ?? {};
    const validationError = validateBuckets(buckets);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("budget_ratios")
      .upsert(
        { user_id: user.id, buckets, category_bucket_map },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ratios: data });
  } catch {
    return NextResponse.json({ error: "Could not save ratios." }, { status: 400 });
  }
}

