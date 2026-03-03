/**
 * Supabase Storage utilities for menu photos
 *
 * Provides image validation, optimization, upload, and management functions.
 */

import { createClient } from "./client";

const BUCKET = "menu-photos";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB raw input limit (server processes to 2MB)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TARGET_WIDTH = 800; // Resize to max 800px width
const QUALITY = 0.85;

export interface UploadResult {
  path: string;
  publicUrl: string;
  width: number;
  height: number;
  size: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  assignedCount: number;
  unassignedCount: number;
}

export interface DriveVerifyResult {
  valid: boolean;
  previewUrl: string | null;
  fileId: string | null;
  error?: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPEG, PNG, and WebP files are accepted" };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `File exceeds ${MAX_SIZE / (1024 * 1024)}MB limit` };
  }
  return { valid: true };
}

/**
 * Get image dimensions from blob
 */
async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for dimensions"));
    };
    img.src = url;
  });
}

/**
 * Resize and optimize image using Canvas API
 * Converts to JPEG with 85% quality, max 800px width
 */
export async function optimizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > TARGET_WIDTH) {
        height = (height * TARGET_WIDTH) / width;
        width = TARGET_WIDTH;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Upload photo via server-side processing (recommended).
 * Server handles WebP conversion, 4:3 crop, dimension/size validation.
 */
export async function uploadMenuPhotoViaServer(
  file: File,
  menuItemId?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (menuItemId) {
    formData.append("menuItemId", menuItemId);
  }

  const response = await fetch("/api/admin/photos/process", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Photo processing failed");
  }

  const result = await response.json();
  return {
    path: result.path,
    publicUrl: result.publicUrl,
    width: result.width,
    height: result.height,
    size: result.size,
  };
}

/**
 * @deprecated Use `uploadMenuPhotoViaServer` for server-side WebP processing.
 * Upload photo to storage with progress callback
 * Automatically optimizes the image before upload
 */
export async function uploadMenuPhoto(
  file: File,
  menuItemId?: string,
  _onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const supabase = createClient();

  // Validate first
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Optimize image
  const optimized = await optimizeImage(file);

  // Generate path: menu-photos/{menuItemId}/{timestamp}.jpg or menu-photos/unassigned/{timestamp}.jpg
  const folder = menuItemId || "unassigned";
  const filename = `${Date.now()}.jpg`;
  const path = `${folder}/${filename}`;

  // Upload
  // Note: Supabase JS SDK doesn't support onUploadProgress directly
  // For progress, would need XHR/fetch with onprogress
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, optimized, {
    contentType: "image/jpeg",
    upsert: false,
  });

  if (error) throw error;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Get dimensions from optimized image
  const dimensions = await getImageDimensions(optimized);

  return {
    path: data.path,
    publicUrl,
    width: dimensions.width,
    height: dimensions.height,
    size: optimized.size,
  };
}

/**
 * Delete photo from storage
 */
export async function deleteMenuPhoto(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

/**
 * Move photo from one path to another (used for assignment)
 */
export async function moveMenuPhoto(
  oldPath: string,
  newMenuItemId: string
): Promise<{ newPath: string; publicUrl: string }> {
  const supabase = createClient();

  // Download old file
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(oldPath);

  if (downloadError) throw downloadError;

  // Generate new path
  const filename = oldPath.split("/").pop() || `${Date.now()}.jpg`;
  const newPath = `${newMenuItemId}/${filename}`;

  // Upload to new location
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(newPath, fileData, {
    contentType: "image/jpeg",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  // Delete old file
  await supabase.storage.from(BUCKET).remove([oldPath]);

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(newPath);

  return { newPath, publicUrl };
}

/**
 * Get storage usage statistics
 * Note: Requires listing all files which may be slow for large buckets
 */
export async function getStorageStats(): Promise<StorageStats> {
  const supabase = createClient();

  // List root folders
  const { data: folders, error: foldersError } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1000 });

  if (foldersError) throw foldersError;

  let totalFiles = 0;
  let totalSize = 0;
  let unassignedCount = 0;
  let assignedCount = 0;

  // For each folder, list files
  for (const folder of folders || []) {
    if (folder.id) {
      // It's a folder (has id)
      const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(folder.name, { limit: 1000 });

      const fileCount = files?.filter((f) => !f.id).length || 0;
      totalFiles += fileCount;

      if (folder.name === "unassigned") {
        unassignedCount = fileCount;
      } else {
        assignedCount += fileCount;
      }

      // Sum sizes (metadata.size may not always be available)
      for (const file of files || []) {
        if (file.metadata?.size) {
          totalSize += file.metadata.size;
        }
      }
    }
  }

  return {
    totalFiles,
    totalSize,
    assignedCount,
    unassignedCount,
  };
}

/**
 * Verify Google Drive URL accessibility and extract direct link
 * Client-side parsing only - actual HTTP verification done server-side
 */
export function verifyDriveUrl(url: string): DriveVerifyResult {
  try {
    // Extract file ID from various Google Drive URL formats
    // Format 1: drive.google.com/file/d/XXX/view
    // Format 2: drive.google.com/open?id=XXX
    // Format 3: drive.google.com/uc?id=XXX
    // Format 4: docs.google.com/uc?id=XXX
    let fileId: string | null = null;

    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (fileMatch) {
      fileId = fileMatch[1];
    } else if (openMatch) {
      fileId = openMatch[1];
    }

    if (!fileId) {
      return {
        valid: false,
        previewUrl: null,
        fileId: null,
        error: "Invalid Drive URL format",
      };
    }

    // Construct direct image URL
    const previewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    // Note: Actual verification (HEAD request) done server-side via verify-drive API
    return { valid: true, previewUrl, fileId };
  } catch {
    return {
      valid: false,
      previewUrl: null,
      fileId: null,
      error: "Failed to parse Drive URL",
    };
  }
}

/**
 * Get public URL for a storage path
 */
export function getPublicUrl(path: string): string {
  const supabase = createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}
