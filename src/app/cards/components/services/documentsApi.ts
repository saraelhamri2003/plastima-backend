import { logger } from "@hubspot/ui-extensions";
import { Document } from "../types/document";
import { BACKEND_API_PATH, getDocumentFileUrl, hubspotFetchBackend } from "./backendConfig";

interface DbDocument {
  id: number;
  deal_id: string;
  file_name: string;
  original_name?: string;
  document_type: string;
  version?: string;
  upload_date: string;
  uploaded_by?: string;
}

export async function fetchDocuments(dealId: string | number): Promise<Document[]> {
  try {
    const { response } = await hubspotFetchBackend(`${BACKEND_API_PATH}/${dealId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`);
    }
    const data = (await response.json()) as DbDocument[];
    
    return data.map((doc: DbDocument) => ({
      id: doc.id,
      name: doc.original_name || doc.file_name,
      fileName: doc.file_name,
      type: doc.document_type,
      version: doc.version || "V1",
      uploadDate: formatDate(doc.upload_date),
      uploadedBy: doc.uploaded_by || "Inconnu",
      fileUrl: getDocumentFileUrl(doc.file_name)
    }));
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    } else {
      try {
        message = JSON.stringify(error);
      } catch {
        message = String(error);
      }
    }

    logger.error(`Error fetching documents: ${message}`);
    throw error;
  }
}

export async function deleteDocument(id: number): Promise<void> {
  try {
    const { response } = await hubspotFetchBackend(`${BACKEND_API_PATH}/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`);
    }
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    } else {
      try {
        message = JSON.stringify(error);
      } catch {
        message = String(error);
      }
    }

    logger.error(`Error deleting document: ${message}`);
    throw error;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
