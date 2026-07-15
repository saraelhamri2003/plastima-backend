export type VisitStatus = "Planifiée" | "Terminée" | "Annulée" | "Reportée";

export type VisitType =
  | "Prospection"
  | "Suivi"
  | "Visite Technique"
  | "Négociation"
  | "Livraison"
  | "Autre";

export type ExpenseCategory = "Transport" | "Hôtel" | "Repas" | "Divers";

export interface Visit {
  id: number;
  dealId: string;
  title: string;
  company: string;
  contact: string;
  salesperson: string;
  visitType: VisitType;
  status: VisitStatus;
  plannedDate: string;
  plannedTime: string;
  location: string;
  objectives: string;
  notesBefore: string;
  outcome: string;
  report: string;
  customerFeedback: string;
  nextActions: string;
  gpsLat: number | null;
  gpsLng: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitExpense {
  id: number;
  visitId: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface VisitAttachment {
  id: number;
  visitId: number;
  fileName: string;
  originalName: string;
  fileType: string;
  uploadedAt: string;
  fileUrl: string;
}

export interface VisitDetail extends Visit {
  expenses: VisitExpense[];
  attachments: VisitAttachment[];
}

export interface VisitFormData {
  title: string;
  company: string;
  contact: string;
  salesperson: string;
  visitType: VisitType;
  status: VisitStatus;
  plannedDate: string;
  plannedTime: string;
  location: string;
  objectives: string;
  notesBefore: string;
}

export interface VisitReportData {
  outcome: string;
  report: string;
  customerFeedback: string;
  nextActions: string;
  gpsLat: string;
  gpsLng: string;
}

export interface ExpenseFormData {
  category: ExpenseCategory;
  description: string;
  amount: string;
  currency: string;
}

export const VISIT_STATUSES: VisitStatus[] = [
  "Planifiée",
  "Terminée",
  "Annulée",
  "Reportée",
];

export const VISIT_TYPES: VisitType[] = [
  "Prospection",
  "Suivi",
  "Visite Technique",
  "Négociation",
  "Livraison",
  "Autre",
] as const;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Transport",
  "Hôtel",
  "Repas",
  "Divers",
];

export const STATUS_ICONS: Record<VisitStatus, string> = {
  Planifiée: "●",
  Terminée: "✓",
  Annulée: "×",
  Reportée: "↻",
};

export const VISIT_TYPE_ICONS: Record<VisitType, string> = {
  Prospection: "⌕",
  Suivi: "↻",
  "Visite Technique": "⚙",
  Négociation: "◇",
  Livraison: "□",
  Autre: "•",
};
