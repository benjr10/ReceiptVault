import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const STORAGE_BUCKET = 'receipts';
export const TOTAL_STORAGE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB

export async function getStorageUsage(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(userId, {
        limit: 100,
      });

    if (error) {
      console.error('Storage list error:', error);
      return 0;
    }

    let totalBytes = 0;
    if (data && data.length > 0) {
      for (const file of data) {
        if (file.metadata?.size) {
          totalBytes += file.metadata.size;
        }
      }
    }
    return totalBytes;
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}