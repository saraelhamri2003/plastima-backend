import {
  Button,
  Flex,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  TextArea,
  Inline,
  hubspot,
  useExtensionActions,
} from "@hubspot/ui-extensions";
import { useState } from "react";

import { updateVisit } from "../services/visitsApi";
import { Visit } from "../types/visit";
import { formFromVisit, reportFromVisit } from "./visitFormHelpers";

interface Props {
  visit: Visit;
  onSaved: () => void;
}

interface ExtensionActions {
  addAlert: (alert: { type: "success" | "danger"; message: string }) => void;
  closeOverlay?: (id: string) => void;
}

export default function VisitReportModal({ visit, onSaved }: Props) {
  const modalId = `visit-report-modal-${visit.id}`;
  const { addAlert, closeOverlay } = useExtensionActions() as ExtensionActions;
  const [report, setReport] = useState(reportFromVisit(visit));
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetectGps = async () => {
    setIsDetecting(true);
    try {
      const response = await hubspot.fetch("https://plastima-backend.onrender.com/api/geolocation");
      if (response.ok) {
        const data = await response.json();
        setReport({
          ...report,
          gpsLat: data.latitude ? String(data.latitude) : "",
          gpsLng: data.longitude ? String(data.longitude) : "",
        });
        addAlert({ type: "success", message: "Position détectée avec succès." });
      } else {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "API error");
      }
    } catch {
      addAlert({
        type: "danger",
        message: "Impossible d'obtenir la position GPS. Assurez-vous d'avoir autorisé l'accès à la localisation.",
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSave = async () => {
    if (!report.report.trim()) {
      addAlert({ type: "danger", message: "Le compte rendu est obligatoire." });
      return;
    }

    setIsSaving(true);
    try {
      await updateVisit(
        { ...visit, status: "Terminée" },
        { ...formFromVisit(visit), status: "Terminée" },
        report
      );
      addAlert({ type: "success", message: "Compte rendu enregistré." });
      onSaved();
      closeOverlay?.(modalId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer le compte rendu.";
      addAlert({ type: "danger", message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal id={modalId} title="Compte rendu de visite" width="md">
      <ModalBody>
        <Form>
          <Flex direction="column" gap="md">
            <TextArea
              label="Résultat"
              name="outcome"
              value={report.outcome}
              rows={3}
              onChange={(value) => setReport({ ...report, outcome: value })}
            />
            <TextArea
              label="Compte rendu"
              name="report"
              required
              value={report.report}
              rows={5}
              onChange={(value) => setReport({ ...report, report: value })}
            />
            <TextArea
              label="Retour client"
              name="customerFeedback"
              value={report.customerFeedback}
              rows={3}
              onChange={(value) => setReport({ ...report, customerFeedback: value })}
            />
            <TextArea
              label="Prochaines actions"
              name="nextActions"
              value={report.nextActions}
              rows={3}
              onChange={(value) => setReport({ ...report, nextActions: value })}
            />
            <Inline align="end" gap="sm">
              <Input
                label="Latitude"
                name="gpsLat"
                value={report.gpsLat}
                onChange={(value) => setReport({ ...report, gpsLat: value })}
              />
              <Input
                label="Longitude"
                name="gpsLng"
                value={report.gpsLng}
                onChange={(value) => setReport({ ...report, gpsLng: value })}
              />
              <Button
                variant="secondary"
                disabled={isDetecting}
                onClick={() => void handleDetectGps()}
              >
                {isDetecting ? "..." : "📍 Détecter"}
              </Button>
            </Inline>
          </Flex>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Flex direction="row" gap="sm" justify="end">
          <Button variant="secondary" onClick={() => closeOverlay?.(modalId)}>
            Annuler
          </Button>
          <Button variant="primary" disabled={isSaving} onClick={() => void handleSave()}>
            Enregistrer
          </Button>
        </Flex>
      </ModalFooter>
    </Modal>
  );
}
