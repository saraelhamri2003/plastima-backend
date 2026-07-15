import {
  Button,
  Divider,
  Flex,
  Link,
  LoadingSpinner,
  Modal,
  ModalBody,
  ModalFooter,
  Text,
  useExtensionActions,
} from "@hubspot/ui-extensions";
import { useEffect, useState } from "react";

import { fetchVisitDetail } from "../services/visitsApi";
import { STATUS_ICONS, VISIT_TYPE_ICONS, Visit, VisitDetail } from "../types/visit";

interface Props {
  visit: Visit;
}

interface ExtensionActions {
  closeOverlay?: (id: string) => void;
}

function DetailLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <Flex direction="column" gap="xs">
      <Text variant="microcopy">{label}</Text>
      <Text>{value}</Text>
    </Flex>
  );
}

export default function VisitPreviewModal({ visit }: Props) {
  const modalId = `visit-preview-modal-${visit.id}`;
  const { closeOverlay } = useExtensionActions() as ExtensionActions;
  const [detail, setDetail] = useState<VisitDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchVisitDetail(visit.id)
      .then((data) => {
        if (active) setDetail(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [visit.id]);

  const current = detail || visit;

  return (
    <Modal id={modalId} title={`Aperçu - ${visit.title}`} width="md">
      <ModalBody>
        {isLoading ? (
          <Flex align="center" justify="center">
            <LoadingSpinner label="Chargement de la visite..." />
          </Flex>
        ) : (
          <Flex direction="column" gap="md">
            <Flex direction="row" gap="sm" align="center">
              <Text>{VISIT_TYPE_ICONS[current.visitType]}</Text>
              <Text format={{ fontWeight: "bold" }}>{current.title}</Text>
            </Flex>

            <Text variant="microcopy">
              {STATUS_ICONS[current.status]} {current.status} - {current.visitType}
            </Text>

            <DetailLine label="Société" value={current.company} />
            <DetailLine label="Contact" value={current.contact} />
            <DetailLine label="Commercial" value={current.salesperson} />
            <DetailLine
              label="Planification"
              value={[current.plannedDate, current.plannedTime].filter(Boolean).join(" ")}
            />
            <DetailLine label="Lieu" value={current.location} />
            <DetailLine label="Objectifs" value={current.objectives} />
            <DetailLine label="Notes avant visite" value={current.notesBefore} />
            <DetailLine label="Résultat" value={current.outcome} />
            <DetailLine label="Compte rendu" value={current.report} />
            <DetailLine label="Retour client" value={current.customerFeedback} />
            <DetailLine label="Prochaines actions" value={current.nextActions} />

            {detail && detail.expenses.length > 0 && (
              <>
                <Divider />
                <Text format={{ fontWeight: "bold" }}>Dépenses</Text>
                {detail.expenses.map((expense) => (
                  <Text key={expense.id}>
                    {expense.category}: {expense.amount.toFixed(2)} {expense.currency}
                  </Text>
                ))}
              </>
            )}

            {detail && detail.attachments.length > 0 && (
              <>
                <Divider />
                <Text format={{ fontWeight: "bold" }}>Pièces jointes</Text>
                {detail.attachments.map((attachment) => (
                  <Link key={attachment.id} href={{ url: attachment.fileUrl, external: true }}>
                    {attachment.originalName}
                  </Link>
                ))}
              </>
            )}
          </Flex>
        )}
      </ModalBody>
      <ModalFooter>
        <Flex direction="row" justify="end">
          <Button variant="secondary" onClick={() => closeOverlay?.(modalId)}>
            Fermer
          </Button>
        </Flex>
      </ModalFooter>
    </Modal>
  );
}
