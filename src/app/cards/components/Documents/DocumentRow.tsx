import {
  Button,
  Flex,
  Inline,
  Link,
  Text,
  Tile,
  Dropdown,
  useExtensionContext,
  useExtensionActions,
  logger,
} from "@hubspot/ui-extensions";
import { Document } from "../types/document";
import { deleteDocument } from "../services/documentsApi";
import { getBackendUploadUrl } from "../services/backendConfig";

interface Props {
  doc: Document;
  onRefresh: () => void;
}

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

export default function DocumentRow({ doc, onRefresh }: Props) {
  const context = useExtensionContext() as ExtensionContext;
  const { openIframeModal, addAlert } = useExtensionActions() as ExtensionActions;

  const dealId = context.crm?.objectId;
  const uploadedBy =
    [context.user?.firstName, context.user?.lastName]
      .filter(Boolean)
      .join(" ") || "Sara El Hamri";

  const handlePreview = () => {
    openIframeModal({
      uri: doc.fileUrl,
      height: 700,
      width: 900,
      title: `Aperçu - ${doc.name}`,
    });
  };

  const handleUploadNewVersion = async () => {
    if (!dealId) {
      addAlert({
        type: "danger",
        message: "Deal ID introuvable. Impossible de mettre à jour le document.",
      });
      return;
    }

    try {
      const query = `?dealId=${dealId}&documentId=${doc.id}&currentVersion=${doc.version}&documentType=${encodeURIComponent(
        doc.type
      )}&uploadedBy=${encodeURIComponent(uploadedBy)}`;
      const updateUrl = await getBackendUploadUrl(query);

      openIframeModal(
        {
          uri: updateUrl,
          height: 600,
          width: 800,
          title: "Mettre à jour le document",
        },
        () => {
          // Reload documents list when user closes the modal
          onRefresh();
        }
      );
    } catch (error: unknown) {
      addAlert({
        type: "danger",
        message: "Impossible d'ouvrir le formulaire de mise à jour.",
      });

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

      logger.error(`Error opening update form: ${message}`);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDocument(doc.id);
      addAlert({
        type: "success",
        message: `Le document "${doc.name}" a été supprimé.`,
      });
      onRefresh();
    } catch (error: unknown) {
      addAlert({
        type: "danger",
        message: "Impossible de supprimer le document.",
      });

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
    }
  };

  return (
    <Tile>
      <Flex direction="column" gap="sm">
        <Inline justify="between" align="center">
          <Inline gap="sm" align="center">
            <Text>📄</Text>
            <Text format={{ fontWeight: "bold" }}>
              <Link href={{ url: doc.fileUrl, external: true }}>
                {doc.name}
              </Link>
            </Text>
          </Inline>

          <Inline gap="xs" align="center">
            <Button
              variant="transparent"
              size="xs"
              onClick={handlePreview}
            >
              👁
            </Button>

            <Dropdown
              buttonText="•••"
              variant="transparent"
              buttonSize="xs"
            >
              <Dropdown.ButtonItem>
                <Link
                  href={{ url: doc.fileUrl, external: true }}
                  variant="dark"
                  preventDefault={false}
                >
                  Télécharger
                </Link>
              </Dropdown.ButtonItem>
              <Dropdown.ButtonItem onClick={handleUploadNewVersion}>
                Mettre à jour
              </Dropdown.ButtonItem>
              <Dropdown.ButtonItem onClick={handleDelete}>
                Supprimer
              </Dropdown.ButtonItem>
            </Dropdown>
          </Inline>
        </Inline>

        <Text variant="microcopy">
          {doc.type} • {doc.version} • {doc.uploadDate}
        </Text>

        <Text variant="microcopy">
          👤 {doc.uploadedBy}
        </Text>
      </Flex>
    </Tile>
  );
}
