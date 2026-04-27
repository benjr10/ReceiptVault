import { supabase } from './supabase';

/**
 * Generates a signed URL for a receipt given its path or full URL.
 * Handles both relative paths (new format) and full public URLs (old format).
 */
export async function getReceiptSignedUrl(pathOrUrl: string | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  
  // Handle base64 (previews)
  if (pathOrUrl.startsWith('data:')) return pathOrUrl;
  
  try {
    let path = pathOrUrl;
    
    // Check if it's an old-style full public URL
    // e.g. https://.../storage/v1/object/public/receipts/userId/file.jpg
    if (pathOrUrl.includes('/storage/v1/object/public/receipts/')) {
      path = pathOrUrl.split('/storage/v1/object/public/receipts/')[1];
    } else if (pathOrUrl.startsWith('http')) {
      // If it's a full URL but not the standard Supabase public one,
      // it might be an authenticated URL or a signed URL already.
      // We'll try to extract the filename part as a last resort if it contains 'receipts/'
      if (pathOrUrl.includes('receipts/')) {
        path = pathOrUrl.split('receipts/')[1];
        // Remove query params if any
        path = path.split('?')[0];
      }
    }
    
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(path, 300); // Valid for 5 minutes

    if (error) {
      console.error('Error creating signed URL for path:', path, error);
      // Fallback: If it's a full URL, it might still be accessible if the bucket is public
      return pathOrUrl.startsWith('http') ? pathOrUrl : null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Failed to resolve signed URL:', error);
    return pathOrUrl.startsWith('http') ? pathOrUrl : null;
  }
}
