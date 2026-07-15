import {
  Alert,
  Button,
  Flex,
  Inline,
  LoadingSpinner,
  Text,
  logger,
  useExtensionActions,
  useExtensionContext,
} from "@hubspot/ui-extensions";
import { useCallback, useEffect, useState } from "react";

import { fetchVisits } from "../services/visitsApi";
import { fetchVisitFormBlobUrl } from "../services/backendConfig";
import { Visit } from "../types/visit";
import VisitTile from "./VisitTile";

interface ExtensionContext {
  crm?: {
    objectId?: string | number;
  };
}

interface ExtensionActions {
  addAlert: (alert: { type: "danger" | "success"; message: string }) => void;
  openIframeModal: (
    options: { uri: string; height: number; width: number; title: string },
    onClose?: () => void
  ) => void;
}

export default function VisitsCard() {
  const context = useExtensionContext() as ExtensionContext;
  const { addAlert, openIframeModal } = useExtensionActions() as ExtensionActions;
  const dealId = context.crm?.objectId;

  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVisits = useCallback(async () => {
    if (!dealId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchVisits(dealId);
      setVisits(data);
    } catch {
      setError("Impossible de charger les visites.");
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadVisits();
    });
  }, [loadVisits]);

  const handleMissingDeal = () => {
    addAlert({
      type: "danger",
      message: "Deal ID introuvable. Impossible d'ajouter une visite.",
    });
  };

  const handleAddVisit = () => {
    if (!dealId) {
      handleMissingDeal();
      return;
    }

    const formUrl = fetchVisitFormBlobUrl(`?dealId=${dealId}`);

    try {
      openIframeModal(
        {
          uri: formUrl,
          height: 650,
          width: 800,
          title: "Ajouter une visite",
        },
        () => {
          void loadVisits();
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Error opening visit overlay: ${msg}`);
      addAlert({
        type: "danger",
        message: "Impossible d'ouvrir le formulaire.",
      });
    }
  };

  return (
    <Flex direction="column" gap="md">
      <Inline justify="end">
        {dealId ? (
          <Button
            variant="transparent"
            size="sm"
            disabled={isLoading}
            onClick={handleAddVisit}
          >
            + Ajouter
          </Button>
        ) : (
          <Button variant="transparent" size="sm" onClick={handleMissingDeal}>
            + Ajouter
          </Button>
        )}
      </Inline>

      {error && (
        <Alert variant="danger" title="Erreur">
          <Text>{error}</Text>
        </Alert>
      )}

      {isLoading ? (
        <Flex align="center" justify="center">
          <LoadingSpinner label="Chargement des visites..." />
        </Flex>
      ) : visits.length === 0 ? (
        <Inline justify="center">
          <Text>Aucune visite pour cette transaction.</Text>
        </Inline>
      ) : (
        <Flex direction="column" gap="md">
          {visits.map((visit) => (
            <VisitTile key={visit.id} visit={visit} onRefresh={loadVisits} />
          ))}
        </Flex>
      )}
    </Flex>
  );
}
