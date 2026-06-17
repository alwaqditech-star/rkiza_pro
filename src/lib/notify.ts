export interface ApiResult {
  success: boolean;
  message?: string;
}

export function successText(json: ApiResult, fallback: string): string {
  return json.message?.trim() || fallback;
}

export function errorText(json: ApiResult, fallback = "فشلت العملية"): string {
  return json.message?.trim() || fallback;
}

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

export function notifyApiResult(
  toast: ToastApi,
  json: ApiResult,
  labels: { success: string; error?: string },
): boolean {
  if (json.success) {
    toast.success(successText(json, labels.success));
    return true;
  }
  toast.error(errorText(json, labels.error));
  return false;
}
