import {
  Button,
  Dropdown,
  Flex,
  Inline,
  Text,
  Tile,
  Tag,
  useExtensionActions,
} from "@hubspot/ui-extensions";

import { deleteVisit, updateVisitStatus } from "../services/visitsApi";
import { STATUS_ICONS, VISIT_TYPE_ICONS, Visit } from "../types/visit";
import VisitEditModal from "./VisitEditModal";
import VisitExpensesModal from "./VisitExpensesModal";
import VisitPreviewModal from "./VisitPreviewModal";
import VisitReportModal from "./VisitReportModal";

interface Props {
  visit: Visit;
  onRefresh: () => void;
}

interface ExtensionActions {
  addAlert: (alert: { type: "success" | "danger"; message: string }) => void;
}

export default function VisitTile({ visit, onRefresh }: Props) {
  const { addAlert } = useExtensionActions() as ExtensionActions;

  const handleDelete = async () => {
    try {
      await deleteVisit(visit.id);
      addAlert({ type: "success", message: "Visite supprimée." });
      onRefresh();
    } catch {
      addAlert({ type: "danger", message: "Impossible de supprimer la visite." });
    }
  };

  const handleCancel = async () => {
    try {
      await updateVisitStatus(visit.id, "Annulée");
      addAlert({ type: "success", message: "Visite annulée." });
      onRefresh();
    } catch {
      addAlert({ type: "danger", message: "Impossible d'annuler la visite." });
    }
  };

  const handleComplete = async () => {
    try {
      await updateVisitStatus(visit.id, "Terminée");
      addAlert({ type: "success", message: "Visite marquée comme terminée." });
      onRefresh();
    } catch {
      addAlert({ type: "danger", message: "Impossible de terminer la visite." });
    }
  };

  return (
    <Tile>
      <Flex direction="column" gap="sm">
        <Inline justify="between" align="center">
          <Inline gap="sm" align="center">
            <Text>{VISIT_TYPE_ICONS[visit.visitType] || "•"}</Text>
            <Text format={{ fontWeight: "bold" }}>{visit.title}</Text>
          </Inline>

          <Inline gap="xs" align="center">
            <Button
              variant="transparent"
              size="xs"
              overlay={<VisitPreviewModal visit={visit} />}
            >
              👁
            </Button>

            <Dropdown buttonText="•••" variant="transparent" buttonSize="xs">
              <Dropdown.ButtonItem overlay={<VisitEditModal visit={visit} onSaved={onRefresh} />}>
                Modifier
              </Dropdown.ButtonItem>
              <Dropdown.ButtonItem overlay={<VisitReportModal visit={visit} onSaved={onRefresh} />}>
                Compte rendu
              </Dropdown.ButtonItem>
              <Dropdown.ButtonItem overlay={<VisitExpensesModal visit={visit} onSaved={onRefresh} />}>
                Dépenses
              </Dropdown.ButtonItem>
              <Dropdown.ButtonItem onClick={() => void handleComplete()}>
                Marquer comme terminée
              </Dropdown.ButtonItem>
              <Dropdown.ButtonItem onClick={() => void handleCancel()}>
                Annuler
              </Dropdown.ButtonItem>
              <Dropdown.ButtonItem onClick={() => void handleDelete()}>
                Supprimer
              </Dropdown.ButtonItem>
            </Dropdown>
          </Inline>
        </Inline>

        <Inline gap="sm" align="center">
          <Tag variant={visit.status === "Terminée" ? "success" : visit.status === "Annulée" ? "error" : "default"}>
            {visit.status}
          </Tag>
          <Text variant="microcopy">
            • {visit.visitType}
          </Text>
        </Inline>

        <Text variant="microcopy">
          📅 {[visit.plannedDate, visit.plannedTime].filter(Boolean).join(" à ") || "Date non définie"} {visit.location && `• 📍 ${visit.location}`}
        </Text>

        {visit.company && (
          <Text variant="microcopy">
            🏢 {visit.company} {visit.contact && `• 👤 ${visit.contact}`}
          </Text>
        )}
      </Flex>
    </Tile>
  );
}
