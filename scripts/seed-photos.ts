/**
 * Photo Seed Script
 *
 * Uploads fallback photos from data/menu-photos/ to Supabase Storage,
 * matches them to menu items by slug, and sets image_url on items without photos.
 *
 * Usage:
 *   pnpm seed:photos              # Upload all unmatched photos
 *   pnpm seed:photos --dry-run    # Preview without uploading
 *   pnpm seed:photos --force      # Overwrite existing photos
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname, basename } from "path";
import type { Database } from "../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "menu-photos";
const PHOTOS_DIR = join(process.cwd(), "data", "menu-photos");
const VALID_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

interface LocalPhoto {
  slug: string;
  filePath: string;
  filename: string;
  extension: string;
}

interface MenuItemRecord {
  id: string;
  slug: string;
  image_url: string | null;
}

interface SeedItem {
  itemId: string;
  slug: string;
  filePath: string;
  extension: string;
}

function createSupabaseClient(): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY);
}

function getContentType(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

function readLocalPhotos(): LocalPhoto[] {
  const files = readdirSync(PHOTOS_DIR);
  const photos: LocalPhoto[] = [];

  for (const filename of files) {
    const ext = extname(filename).toLowerCase();
    if (!VALID_EXTENSIONS.has(ext)) continue;

    const filePath = join(PHOTOS_DIR, filename);
    const stat = statSync(filePath);
    if (!stat.isFile()) continue;

    const slug = basename(filename, ext);
    photos.push({ slug, filePath, filename, extension: ext });
  }

  return photos;
}

async function fetchMenuItems(
  supabase: SupabaseClient<Database>
): Promise<Map<string, MenuItemRecord>> {
  const { data, error } = await supabase.from("menu_items").select("id, slug, image_url");

  if (error) throw error;

  const map = new Map<string, MenuItemRecord>();
  for (const item of data || []) {
    map.set(item.slug, item);
  }
  return map;
}

async function seedPhotos(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");

  console.log("Starting photo seed...\n");
  if (dryRun) console.log("  DRY RUN — no uploads will be performed\n");
  if (force) console.log("  FORCE — existing photos will be overwritten\n");

  // Step 1: Read local photos
  const localPhotos = readLocalPhotos();
  console.log(`Found ${localPhotos.length} photos in data/menu-photos/`);

  // Step 2: Fetch menu items
  const supabase = createSupabaseClient();
  const menuItems = await fetchMenuItems(supabase);
  console.log(`Found ${menuItems.size} menu items in database\n`);

  // Step 3: Match and filter
  const toSeed: SeedItem[] = [];
  const unmatched: string[] = [];
  let skippedExisting = 0;

  for (const photo of localPhotos) {
    const item = menuItems.get(photo.slug);

    if (!item) {
      unmatched.push(photo.filename);
      continue;
    }

    if (!force && item.image_url && !item.image_url.includes("fallback")) {
      skippedExisting++;
      continue;
    }

    toSeed.push({
      itemId: item.id,
      slug: photo.slug,
      filePath: photo.filePath,
      extension: photo.extension,
    });
  }

  console.log(`${toSeed.length} items need fallback photos`);
  console.log(`${skippedExisting} already have photos (skipped)`);
  if (unmatched.length > 0) {
    console.log(`${unmatched.length} photos have no matching menu item:`);
    for (const name of unmatched) {
      console.log(`  - ${name}`);
    }
  }
  console.log();

  if (dryRun) {
    console.log("Dry run complete. Items that would be seeded:");
    for (const item of toSeed) {
      console.log(`  ${item.slug} → ${item.itemId}`);
    }
    return;
  }

  // Step 4: Upload photos
  let success = 0;
  let failed = 0;

  for (let i = 0; i < toSeed.length; i++) {
    const item = toSeed[i];
    try {
      const fileBuffer = readFileSync(item.filePath);
      const contentType = getContentType(item.extension);
      const storagePath = `${item.itemId}/fallback${item.extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error(
          `  [${i + 1}/${toSeed.length}] FAILED: ${item.slug} — ${uploadError.message}`
        );
        failed++;
        continue;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

      // Update menu item image_url (only if null or fallback)
      const { error: updateError } = await supabase
        .from("menu_items")
        .update({ image_url: publicUrl })
        .eq("id", item.itemId)
        .or("image_url.is.null,image_url.like.%fallback%");

      if (updateError) {
        console.error(
          `  [${i + 1}/${toSeed.length}] DB UPDATE FAILED: ${item.slug} — ${updateError.message}`
        );
        failed++;
        continue;
      }

      success++;
      console.log(`  [${i + 1}/${toSeed.length}] Seeded: ${item.slug}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [${i + 1}/${toSeed.length}] ERROR: ${item.slug} — ${message}`);
      failed++;
    }
  }

  // Step 5: Summary
  console.log(
    `\nPhoto seeding complete: ${success}/${toSeed.length} uploaded, ${skippedExisting} skipped, ${failed} failed`
  );
}

seedPhotos().catch((error: Error) => {
  console.error("Photo seed failed:", error);
  process.exit(1);
});
