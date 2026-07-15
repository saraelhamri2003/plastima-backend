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

import DocumentRow from "./DocumentRow";
import { fetchUploadFormBlobUrl } from "../services/backendConfig";
import { fetchDocuments } from "../services/documentsApi";
import { Document } from "../types/document";

interface ExtensionContext {
  crm?: {
    objectId?: string | number;
  };
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

interface ExtensionActions {
  openIframeModal: (
    options: { uri: string; height: number; width: number; title: string },
    onClose?: () => void
  ) => void;
  addAlert: (alert: { type: "success" | "danger"; message: string }) => void;
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

export default function DocumentsCard() {
  const context = useExtensionContext() as ExtensionContext;
  const { openIframeModal, addAlert } = useExtensionActions() as ExtensionActions;

  const dealId = context.crm?.objectId;
  const uploadedBy =
    [context.user?.firstName, context.user?.lastName].filter(Boolean).join(" ") ||
    "Sara El Hamri";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!dealId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const docs = await fetchDocuments(dealId);
      setDocuments(docs);
    } catch (err: unknown) {
      setError("Impossible de charger les documents.");
      logger.error(`Error loading documents: ${getErrorMessage(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (active) {
        void loadDocuments();
      }
    });

    return () => {
      active = false;
    };
  }, [loadDocuments]);

  const handleAddDocument = () => {
    if (!dealId) {
      addAlert({
        type: "danger",
        message: "Deal ID introuvable. Impossible d'ajouter un document.",
      });
      return;
    }

    const blobUrl = fetchUploadFormBlobUrl(
      `?dealId=${dealId}&uploadedBy=${encodeURIComponent(uploadedBy)}`
    );

    try {
      openIframeModal(
        {
          uri: blobUrl,
          height: 600,
          width: 800,
          title: "Ajouter un document",
        },
        () => {
          void loadDocuments();
        }
      );
    } catch (err) {
      logger.error(`Error opening upload overlay: ${getErrorMessage(err)}`);
      addAlert({
        type: "danger",
        message: "Impossible d'ouvrir le formulaire d'importation.",
      });
    }
  };

  return (
    <Flex direction="column" gap="md">
      <Inline justify="end">
        <Button
          variant="transparent"
          size="sm"
          onClick={handleAddDocument}
          disabled={isLoading}
        >
          + Ajouter
        </Button>
      </Inline>

      {error && (
        <Alert variant="danger" title="Erreur">
          <Text>{error}</Text>
        </Alert>
      )}

      {isLoading ? (
        <Flex align="center" justify="center">
          <LoadingSpinner label="Chargement des documents..." />
        </Flex>
      ) : documents.length === 0 ? (
        <Inline justify="center">
          <Text>Aucun document pour cette transaction.</Text>
        </Inline>
      ) : (
        <Flex direction="column" gap="md">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} onRefresh={loadDocuments} />
          ))}
        </Flex>
      )}
    </Flex>
  );
}
