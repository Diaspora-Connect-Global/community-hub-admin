/**
 * Maps the Opportunities form's text fields onto the gateway's current input fields.
 * The form keeps its familiar "Requirements" / "Responsibilities" boxes; on the wire they are
 *   requirements     -> eligibilityCriteria
 *   responsibilities -> scope
 * (the old `requirements` / `responsibilities` input fields no longer exist and the gateway
 * rejects the whole document if they are sent).
 */
export interface OpportunityTextFields {
  requirements?: string;
  responsibilities?: string;
}

export interface OpportunityTextInput {
  eligibilityCriteria?: string;
  scope?: string;
}

export function mapOpportunityTextFields(form: OpportunityTextFields): OpportunityTextInput {
  const out: OpportunityTextInput = {};
  const requirements = form.requirements?.trim();
  const responsibilities = form.responsibilities?.trim();
  if (requirements) out.eligibilityCriteria = requirements;
  if (responsibilities) out.scope = responsibilities;
  return out;
}
