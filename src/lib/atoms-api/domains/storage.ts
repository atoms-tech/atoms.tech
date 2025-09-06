// Lightweight storage helper, avoids SDK calls when possible
// Constructs public URLs for files in public buckets

export function createStorageDomain() {
  const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');

  return {
    getPublicUrl(bucket: string, path: string): string | null {
      if (!baseUrl || !bucket || !path) return null;
      const safePath = path.replace(/^\/+/, '');
      return `${baseUrl}/storage/v1/object/public/${bucket}/${safePath}`;
    },
  };
}

export type StorageDomain = ReturnType<typeof createStorageDomain>;

