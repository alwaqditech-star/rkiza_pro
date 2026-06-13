import { apiFetch, getApiBaseUrl } from '@/lib/api-client';

export async function downloadExportFile(pathOrUrl: string, filename: string) {
  const path = pathOrUrl.startsWith('http')
    ? pathOrUrl.replace(getApiBaseUrl(), '')
    : pathOrUrl;

  const res = await apiFetch(path);
  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const json = await res.json().catch(() => null);
      throw new Error(
        (json as { message?: string; error?: string } | null)?.message ||
          (json as { message?: string; error?: string } | null)?.error ||
          'فشل التصدير',
      );
    }

    const text = await res.text().catch(() => '');
    throw new Error(text.trim() || `فشل التصدير (${res.status})`);
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
