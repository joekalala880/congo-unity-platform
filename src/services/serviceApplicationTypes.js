// Shared between the citizen application form/portal and the admin review
// queue — keep in sync with the allowlists in firestore.rules.
export const SERVICE_TYPES = {
  birth_certificate: {
    label: "Birth Certificate Request",
    route: "birth-certificate",
  },
};

export const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  more_information_required: "More Information Required",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

// Returns just the color-key suffix (e.g. "approved") — each page prefixes
// its own scoped badge class (govapp-badge-, govdet-badge-, admapp-badge-)
// so this one mapping stays the single source of truth for which status
// gets which color without forcing every page to share one CSS namespace.
export function statusBadgeSuffix(status) {
  if (status === "approved") return "approved";
  if (status === "under_review") return "review";
  if (status === "rejected") return "rejected";
  if (status === "more_information_required") return "info";
  if (status === "withdrawn") return "withdrawn";
  if (status === "submitted") return "submitted";
  return "draft";
}

// Birth-certificate-specific supporting document types. Only
// APPLICANT_ID is strictly required before submission — the rest are
// optional per the spec ("if available" / "optional").
export const BIRTH_CERT_DOCUMENT_TYPES = [
  { value: "applicant_id", label: "Applicant Identification", required: true },
  { value: "proof_of_birth", label: "Proof of Birth", required: false },
  { value: "parent_id", label: "Parent Identification", required: false },
  { value: "affidavit", label: "Supporting Affidavit", required: false },
];

export const DELIVERY_PREFERENCES = [
  { value: "digital", label: "Digital copy only" },
  { value: "pickup", label: "In-person pickup" },
];
