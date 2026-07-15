import {
  Button,
  DateInput,
  Flex,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  Select,
  TextArea,
  TimeInput,
  useExtensionActions,
} from "@hubspot/ui-extensions";
import { useState } from "react";

import { updateVisit } from "../services/visitsApi";
import { VISIT_STATUSES, VISIT_TYPES, Visit, VisitStatus, VisitType } from "../types/visit";
import {
  formFromVisit,
  formatDateInput,
  formatTimeInput,
  parseDateInput,
  parseTimeInput,
  reportFromVisit,
} from "./visitFormHelpers";

interface Props {
  visit: Visit;
  onSaved: () => void;
}

interface ExtensionActions {
  addAlert: (alert: { type: "success" | "danger"; message: string }) => void;
  closeOverlay?: (id: string) => void;
}

export default function VisitEditModal({ visit, onSaved }: Props) {
  const modalId = `visit-edit-modal-${visit.id}`;
  const { addAlert, closeOverlay } = useExtensionActions() as ExtensionActions;
  const [form, setForm] = useState(formFromVisit(visit));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) {
      addAlert({ type: "danger", message: "Le titre de la visite est obligatoire." });
      return;
    }

    setIsSaving(true);
    try {
      await updateVisit(visit, form, reportFromVisit(visit));
      addAlert({ type: "success", message: "Visite mise à jour." });
      onSaved();
      closeOverlay?.(modalId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Impossible de mettre à jour la visite.";
      addAlert({ type: "danger", message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal id={modalId} title="Modifier la visite" width="md">
      <ModalBody>
        <Form>
          <Flex direction="column" gap="md">
            <Input
              label="Titre"
              name="title"
              required
              value={form.title}
              onChange={(value) => setForm({ ...form, title: value })}
            />
            <Input
              label="Société"
              name="company"
              value={form.company}
              onChange={(value) => setForm({ ...form, company: value })}
            />
            <Input
              label="Contact"
              name="contact"
              value={form.contact}
              onChange={(value) => setForm({ ...form, contact: value })}
            />
            <Input
              label="Commercial"
              name="salesperson"
              value={form.salesperson}
              onChange={(value) => setForm({ ...form, salesperson: value })}
            />
            <Select
              label="Type"
              name="visitType"
              value={form.visitType}
              options={VISIT_TYPES.map((type) => ({ label: type, value: type }))}
              onChange={(value) => setForm({ ...form, visitType: String(value) as VisitType })}
            />
            <Select
              label="Statut"
              name="status"
              value={form.status}
              options={VISIT_STATUSES.map((status) => ({ label: status, value: status }))}
              onChange={(value) => setForm({ ...form, status: String(value) as VisitStatus })}
            />
            <DateInput
              label="Date prévue"
              name="plannedDate"
              format="YYYY-MM-DD"
              value={parseDateInput(form.plannedDate)}
              onChange={(value) => setForm({ ...form, plannedDate: formatDateInput(value) })}
            />
            <TimeInput
              label="Heure prévue"
              name="plannedTime"
              value={parseTimeInput(form.plannedTime)}
              onChange={(value) => setForm({ ...form, plannedTime: formatTimeInput(value) })}
            />
            <Input
              label="Lieu"
              name="location"
              value={form.location}
              onChange={(value) => setForm({ ...form, location: value })}
            />
            <TextArea
              label="Objectifs"
              name="objectives"
              value={form.objectives}
              rows={3}
              onChange={(value) => setForm({ ...form, objectives: value })}
            />
            <TextArea
              label="Notes avant visite"
              name="notesBefore"
              value={form.notesBefore}
              rows={3}
              onChange={(value) => setForm({ ...form, notesBefore: value })}
            />
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
