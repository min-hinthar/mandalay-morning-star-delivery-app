/**
 * Drive → Supabase menu-photo migration
 *
 * Re-hosts menu_items.image_url values that point at Google Drive
 * (`drive.google.com/uc?…` or `…/thumbnail?id=…`) — which do NOT render as
 * <img> in email and are unreliable hotlinks — into Supabase Storage as clean,
 * EXIF-stripped baseline JPEGs, then updates image_url to the public URL.
 *
 * Idempotent: only rows whose image_url is still a Drive link are processed, and
 * storage uploads use upsert. Safe to re-run.
 *
 * Usage:
 *   pnpm migrate:drive-photos --dry-run   # fetch + normalize + log, NO writes
 *   pnpm migrate:drive-photos             # upload to Storage + update rows
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import type { Database } from "../src/types/database";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(
  /^https?:\/\/https:\/\//,
  "https://"
);
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "menu-photos";
const THUMB_WIDTH = 1200;

interface DriveItem {
  id: string;
  name_en: string;
  image_url: string;
}

function client(): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/** Extract the Drive file id from `…?id=<ID>` (uc or thumbnail form). */
function driveId(url: string): string | null {
  const m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/** Fetch Drive thumbnail bytes → normalized baseline JPEG (EXIF-stripped, ≤1200w). */
async function fetchNormalizedJpeg(id: string): Promise<Buffer> {
  const res = await fetch(`https://drive.google.com/thumbnail?id=${id}&sz=w${THUMB_WIDTH}`, {
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`drive fetch ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());
  return sharp(raw)
    .rotate() // bake EXIF orientation, then strip metadata
    .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

async function migrate(): Promise<void> {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const supabase = client();

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name_en, image_url")
    .eq("is_active", true)
    .ilike("image_url", "https://drive.google.com/%")
    .order("name_en");
  if (error) throw error;
  const rows = (data ?? []).filter((r): r is DriveItem => !!r.image_url) as DriveItem[];

  console.log(`Drive-linked items: ${rows.length}${dryRun ? "  (DRY RUN — no writes)" : ""}\n`);

  let ok = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const tag = `[${i + 1}/${rows.length}] ${r.name_en}`;
    const id = driveId(r.image_url);
    if (!id) {
      console.error(`${tag} — FAIL: no drive id in ${r.image_url}`);
      failed++;
      continue;
    }
    try {
      const jpg = await fetchNormalizedJpeg(id);
      const meta = await sharp(jpg).metadata();
      if (dryRun) {
        console.log(`${tag} — ok ${meta.width}x${meta.height} ${Math.round(jpg.length / 1024)}KB`);
        ok++;
        continue;
      }
      const path = `${r.id}/photo.jpg`;
      const up = await supabase.storage
        .from(BUCKET)
        .upload(path, jpg, { contentType: "image/jpeg", upsert: true });
      if (up.error) throw up.error;
      const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      const upd = await supabase
        .from("menu_items")
        .update({ image_url: publicUrl })
        .eq("id", r.id)
        .select("id");
      if (upd.error) throw upd.error;
      if (!upd.data || upd.data.length === 0) {
        throw new Error("update matched 0 rows (row gone?) — storage object orphaned");
      }
      console.log(`${tag} — migrated → ${publicUrl}`);
      ok++;
    } catch (e) {
      console.error(`${tag} — FAIL: ${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }
  }

  console.log(`\nDone: ${ok} ok, ${failed} failed of ${rows.length}.`);
  if (failed > 0) process.exitCode = 1;
}

migrate().catch((e: Error) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
