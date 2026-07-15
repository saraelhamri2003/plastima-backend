import { hubspot } from "@hubspot/ui-extensions";

export const BACKEND_HOSTS = [
  "https://plastima-backend.onrender.com"
];

export const BACKEND_API_PATH = "/api/documents";
export const VISITS_API_PATH = "/api/visits";
export const BACKEND_UPLOAD_PATH = "/uploads/upload.html";
export const BACKEND_VISIT_FORM_PATH = "/uploads/visit-form.html";
export const BACKEND_UPLOADS_FOLDER = "/uploads";

export function getBackendUploadUrl(query: string): string {
  return `${BACKEND_HOSTS[0]}${BACKEND_UPLOAD_PATH}${query}`;
}

export function getBackendVisitFormUrl(query: string): string {
  return `${BACKEND_HOSTS[0]}${BACKEND_VISIT_FORM_PATH}${query}`;
}

export function getBackendApiUrl(path: string) {
  return `${BACKEND_HOSTS[0]}${path}`;
}

export function fetchUploadFormBlobUrl(query: string): string {
  return getBackendUploadUrl(query);
}

export function fetchVisitFormBlobUrl(query: string): string {
  return getBackendVisitFormUrl(query);
}

export async function hubspotFetchBackend(
  path: string,
  init?: Record<string, unknown>
): Promise<{ response: Response; host: string }> {
  const host = BACKEND_HOSTS[0];
  const url = `${host}${path}`;

  const fetchInit: Record<string, unknown> = { ...init };

  // hubspot.fetch expects body as a plain object (not a JSON string).
  // Custom Content-Type headers are not supported.
  if (fetchInit.body && typeof fetchInit.body === "string") {
    try {
      fetchInit.body = JSON.parse(fetchInit.body);
    } catch {
      // Keep string body if parsing fails
    }
  }
  delete fetchInit.headers;

  const response = await hubspot.fetch(url, fetchInit);
  return { response, host };
}

export function getBackendHost() {
  return BACKEND_HOSTS[0];
}

export function getDocumentFileUrl(fileName: string) {
  return `${getBackendHost()}${BACKEND_UPLOADS_FOLDER}/${fileName}`;
}

export function getUploadFileUrl(fileName: string) {
  return `${getBackendHost()}${BACKEND_UPLOADS_FOLDER}/${fileName}`;
}
