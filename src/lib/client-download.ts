import { apiFetch, getApiBaseUrl } from '@/lib/api-client';

export async function downloadExportFile(pathOrUrl: string, filename: string) {
  const path = pathOrUrl.startsWith('http')
    ? pathOrUrl.replace(getApiBaseUrl(), '')
    : pathOrUrl;

  const res = await apiFetch(path);
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(
      (json as { message?: string; error?: string } | null)?.message ||
        (json as { message?: string; error?: string } | null)?.error ||
        'فشل التصدير',
    );
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

/** لبناء روابط التصدير في الأزرار */
export { apiUrl } from '@/lib/api-client';
