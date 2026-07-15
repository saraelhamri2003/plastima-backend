import {
  ExpenseFormData,
  Visit,
  VisitFormData,
  VisitReportData,
} from "../types/visit";

export interface HubSpotDateValue {
  year: number;
  month: number;
  date: number;
}

export interface HubSpotTimeValue {
  hours: number;
  minutes: number;
}

export const emptyVisitForm: VisitFormData = {
  title: "",
  company: "",
  contact: "",
  salesperson: "",
  visitType: "Prospection",
  status: "Planifiée",
  plannedDate: "",
  plannedTime: "",
  location: "",
  objectives: "",
  notesBefore: "",
};

export const emptyReportForm: VisitReportData = {
  outcome: "",
  report: "",
  customerFeedback: "",
  nextActions: "",
  gpsLat: "",
  gpsLng: "",
};

export const emptyExpenseForm: ExpenseFormData = {
  category: "Transport",
  description: "",
  amount: "",
  currency: "MAD",
};

export function formFromVisit(visit: Visit): VisitFormData {
  return {
    title: visit.title,
    company: visit.company,
    contact: visit.contact,
    salesperson: visit.salesperson,
    visitType: visit.visitType,
    status: visit.status,
    plannedDate: visit.plannedDate,
    plannedTime: visit.plannedTime,
    location: visit.location,
    objectives: visit.objectives,
    notesBefore: visit.notesBefore,
  };
}

export function reportFromVisit(visit: Visit): VisitReportData {
  return {
    outcome: visit.outcome,
    report: visit.report,
    customerFeedback: visit.customerFeedback,
    nextActions: visit.nextActions,
    gpsLat: visit.gpsLat === null ? "" : String(visit.gpsLat),
    gpsLng: visit.gpsLng === null ? "" : String(visit.gpsLng),
  };
}

export function parseDateInput(value: string): HubSpotDateValue | undefined {
  if (!value) return undefined;

  const [year, month, date] = value.split("-").map(Number);
  if (!year || !month || !date) return undefined;

  return { year, month: month - 1, date };
}

export function formatDateInput(value: HubSpotDateValue): string {
  const month = String(value.month + 1).padStart(2, "0");
  const date = String(value.date).padStart(2, "0");
  return `${value.year}-${month}-${date}`;
}

export function parseTimeInput(value: string): HubSpotTimeValue | undefined {
  if (!value) return undefined;

  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return undefined;

  return { hours, minutes };
}

export function formatTimeInput(value: HubSpotTimeValue): string {
  const hours = String(value.hours).padStart(2, "0");
  const minutes = String(value.minutes).padStart(2, "0");
  return `${hours}:${minutes}`;
}
