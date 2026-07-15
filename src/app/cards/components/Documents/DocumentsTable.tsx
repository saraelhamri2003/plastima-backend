import DocumentRow from "./DocumentRow";
import { Document } from "../types/document";

interface Props {
  documents: Document[];
}

export default function DocumentsTable({ documents }: Props) {
  return (
    <>
      {documents.map((doc) => (
        <DocumentRow
          key={doc.id}
          doc={doc}
          onRefresh={() => undefined}
        />
      ))}
    </>
  );
}