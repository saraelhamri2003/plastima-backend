import { logger } from "@hubspot/ui-extensions";
import {
  ExpenseFormData,
  Visit,
  VisitDetail,
  VisitExpense,
  VisitFormData,
  VisitReportData,
  VisitAttachment,
  VisitStatus,
  VisitType,
  ExpenseCategory,
} from "../types/visit";
import { VISITS_API_PATH, getUploadFileUrl, hubspotFetchBackend } from "./backendConfig";

interface DbVisit {
  id: number;
  deal_id: string;
  title: string;
  company?: string;
  contact?: string;
  salesperson?: string;
  visit_type?: VisitType;
  status?: VisitStatus;
  planned_date?: string;
  planned_time?: string;
  location?: string;
  objectives?: string;
  notes_before?: string;
  outcome?: string;
  report?: string;
  customer_feedback?: string;
  next_actions?: string;
  gps_lat?: number | null;
  gps_lng?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface DbVisitExpense {
  id: number;
  visit_id: number;
  category: ExpenseCategory;
  description?: string;
  amount: number;
  currency?: string;
  created_at?: string;
}

interface DbVisitAttachment {
  id: number;
  visit_id: number;
  file_name: string;
  original_name?: string;
  file_type?: string;
  uploaded_at?: string;
}

interface DbVisitDetail extends DbVisit {
  expenses?: DbVisitExpense[];
  attachments?: DbVisitAttachment[];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";

  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function mapVisit(visit: DbVisit): Visit {
  return {
    id: visit.id,
    dealId: visit.deal_id,
    title: visit.title,
    company: visit.company || "",
    contact: visit.contact || "",
    salesperson: visit.salesperson || "",
    visitType: visit.visit_type || "Prospection",
    status: visit.status || "Planifiée",
    plannedDate: visit.planned_date || "",
    plannedTime: visit.planned_time || "",
    location: visit.location || "",
    objectives: visit.objectives || "",
    notesBefore: visit.notes_before || "",
    outcome: visit.outcome || "",
    report: visit.report || "",
    customerFeedback: visit.customer_feedback || "",
    nextActions: visit.next_actions || "",
    gpsLat: visit.gps_lat ?? null,
    gpsLng: visit.gps_lng ?? null,
    createdAt: formatDate(visit.created_at),
    updatedAt: formatDate(visit.updated_at),
  };
}

function mapExpense(expense: DbVisitExpense): VisitExpense {
  return {
    id: expense.id,
    visitId: expense.visit_id,
    category: expense.category,
    description: expense.description || "",
    amount: expense.amount,
    currency: expense.currency || "MAD",
    createdAt: formatDate(expense.created_at),
  };
}

function mapAttachment(attachment: DbVisitAttachment): VisitAttachment {
  return {
    id: attachment.id,
    visitId: attachment.visit_id,
    fileName: attachment.file_name,
    originalName: attachment.original_name || attachment.file_name,
    fileType: attachment.file_type || "document",
    uploadedAt: formatDate(attachment.uploaded_at),
    fileUrl: getUploadFileUrl(attachment.file_name),
  };
}

function toGpsPayload(value: string | number | null | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const errData = (await response.json()) as { message?: string };
    return errData.message || fallback;
  } catch {
    return fallback;
  }
}

function toVisitPayload(data: VisitFormData, dealId?: string | number) {
  return {
    deal_id: dealId,
    title: data.title,
    company: data.company,
    contact: data.contact,
    salesperson: data.salesperson,
    visit_type: data.visitType,
    status: data.status,
    planned_date: data.plannedDate,
    planned_time: data.plannedTime,
    location: data.location,
    objectives: data.objectives,
    notes_before: data.notesBefore,
  };
}

export async function fetchVisits(dealId: string | number): Promise<Visit[]> {
  try {
    const { response } = await hubspotFetchBackend(`${VISITS_API_PATH}/${dealId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch visits: ${response.statusText}`);
    }

    const data = (await response.json()) as DbVisit[];
    return data.map(mapVisit);
  } catch (error: unknown) {
    logger.error(`Error fetching visits: ${getErrorMessage(error)}`);
    throw error;
  }
}

export async function fetchVisitDetail(id: number): Promise<VisitDetail> {
  try {
    const { response } = await hubspotFetchBackend(`${VISITS_API_PATH}/detail/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch visit detail: ${response.statusText}`);
    }

    const data = (await response.json()) as DbVisitDetail;
    return {
      ...mapVisit(data),
      expenses: (data.expenses || []).map(mapExpense),
      attachments: (data.attachments || []).map(mapAttachment),
    };
  } catch (error: unknown) {
    logger.error(`Error fetching visit detail: ${getErrorMessage(error)}`);
    throw error;
  }
}

export async function createVisit(dealId: string | number, data: VisitFormData): Promise<void> {
  try {
    const { response } = await hubspotFetchBackend(VISITS_API_PATH, {
      method: "POST",
      body: toVisitPayload(data, dealId),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, `Failed to create visit: ${response.status}`));
    }
  } catch (error: unknown) {
    logger.error(`Error creating visit: ${getErrorMessage(error)}`);
    throw error;
  }
}

export async function updateVisit(visit: Visit, form: VisitFormData, report?: VisitReportData): Promise<void> {
  try {
    const gpsLat = report?.gpsLat ?? (visit.gpsLat === null ? "" : String(visit.gpsLat));
    const gpsLng = report?.gpsLng ?? (visit.gpsLng === null ? "" : String(visit.gpsLng));

    const { response } = await hubspotFetchBackend(`${VISITS_API_PATH}/${visit.id}`, {
      method: "PUT",
      body: {
        ...toVisitPayload(form),
        outcome: report?.outcome ?? visit.outcome,
        report: report?.report ?? visit.report,
        customer_feedback: report?.customerFeedback ?? visit.customerFeedback,
        next_actions: report?.nextActions ?? visit.nextActions,
        gps_lat: toGpsPayload(gpsLat),
        gps_lng: toGpsPayload(gpsLng),
      },
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, `Failed to update visit: ${response.status}`));
    }
  } catch (error: unknown) {
    logger.error(`Error updating visit: ${getErrorMessage(error)}`);
    throw error;
  }
}

export async function updateVisitStatus(id: number, status: VisitStatus): Promise<void> {
  try {
    const { response } = await hubspotFetchBackend(`${VISITS_API_PATH}/${id}/status`, {
      method: "PATCH",
      body: { status },
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, `Failed to update visit status: ${response.status}`));
    }
  } catch (error: unknown) {
    logger.error(`Error updating visit status: ${getErrorMessage(error)}`);
    throw error;
  }
}

export async function deleteVisit(id: number): Promise<void> {
  try {
    const { response } = await hubspotFetchBackend(`${VISITS_API_PATH}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete visit: ${response.statusText}`);
    }
  } catch (error: unknown) {
    logger.error(`Error deleting visit: ${getErrorMessage(error)}`);
    throw error;
  }
}

export async function addExpense(visitId: number, data: ExpenseFormData): Promise<void> {
  try {
    const { response } = await hubspotFetchBackend(`${VISITS_API_PATH}/${visitId}/expenses`, {
      method: "POST",
      body: {
        category: data.category,
        description: data.description,
        amount: Number(data.amount),
        currency: data.currency,
      },
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, `Failed to add expense: ${response.status}`));
    }
  } catch (error: unknown) {
    logger.error(`Error adding expense: ${getErrorMessage(error)}`);
    throw error;
  }
}

export async function deleteExpense(id: number): Promise<void> {
  try {
    const { response } = await hubspotFetchBackend(`${VISITS_API_PATH}/expenses/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete expense: ${response.statusText}`);
    }
  } catch (error: unknown) {
    logger.error(`Error deleting expense: ${getErrorMessage(error)}`);
    throw error;
  }
}
