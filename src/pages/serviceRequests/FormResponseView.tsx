import { useTranslation } from "react-i18next";
import type { ServiceRequestFormField } from "@/pages/serviceRequests/types";
import { formatResponseValue } from "@/pages/serviceRequests/types";

interface FormResponseViewProps {
  /** The RequestType's form-field definitions (label/type/order). */
  formFields: ServiceRequestFormField[] | undefined;
  /** Parsed `formResponsesJson` map of fieldKey -> value. */
  responses: Record<string, unknown>;
}

/**
 * Renders form responses read-only by pairing the RequestType's `formFields`
 * definitions (for labels and ordering) with the submitted `formResponsesJson`
 * values. Falls back to rendering raw response keys for any value that has no
 * matching field definition (e.g. fields removed from the type since submission).
 */
export function FormResponseView({ formFields, responses }: FormResponseViewProps) {
  const { t } = useTranslation();

  const definedKeys = new Set((formFields ?? []).map((f) => f.key));
  // Keys present in the responses but no longer defined on the request type.
  const orphanKeys = Object.keys(responses).filter((k) => !definedKeys.has(k));

  const hasFields = (formFields?.length ?? 0) > 0;
  const hasOrphans = orphanKeys.length > 0;

  if (!hasFields && !hasOrphans) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("serviceRequests.form.noResponses")}
      </p>
    );
  }

  return (
    <dl className="divide-y divide-border rounded-lg border border-border">
      {(formFields ?? []).map((field) => (
        <div
          key={field.key}
          className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4"
        >
          <dt className="text-sm font-medium text-muted-foreground">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </dt>
          <dd className="text-sm text-foreground sm:col-span-2 break-words">
            {field.type === "FILE_UPLOAD"
              ? t("serviceRequests.form.seeDocuments")
              : formatResponseValue(responses[field.key])}
          </dd>
        </div>
      ))}

      {orphanKeys.map((key) => (
        <div
          key={key}
          className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4"
        >
          <dt className="text-sm font-medium text-muted-foreground">{key}</dt>
          <dd className="text-sm text-foreground sm:col-span-2 break-words">
            {formatResponseValue(responses[key])}
          </dd>
        </div>
      ))}
    </dl>
  );
}
