// Shared between the citizen application form/portal and the admin review
// queue — keep in sync with the allowlists in firestore.rules.
export const SERVICE_TYPES = {
  birth_certificate: {
    label: "Birth Certificate Request",
    route: "birth-certificate",
  },
  passport: {
    label: "Passport Application / Renewal",
    route: "passport",
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

// Passport-specific supporting document types. A verified Digital Identity
// and a profile photo are preconditions checked against the citizen's
// profile, not uploads collected here. EXISTING_PASSPORT is only required
// when applicationMode is 'renewal' — enforced in the form, not statically
// here, same pattern as APPLICANT_ID's conditional requirement elsewhere.
export const PASSPORT_DOCUMENT_TYPES = [
  { value: "national_id_or_birth_cert", label: "National ID or Birth Certificate", required: true },
  { value: "existing_passport", label: "Existing Passport (for renewal)", required: false },
  { value: "supporting_document", label: "Supporting Document", required: false },
];

export const PASSPORT_TYPES = [
  { value: "ordinary", label: "Ordinary Passport" },
  { value: "diplomatic", label: "Diplomatic Passport" },
  { value: "service", label: "Service Passport" },
];

export const APPLICATION_MODES = [
  { value: "new", label: "New Application" },
  { value: "renewal", label: "Renewal" },
];

// Which document-type list applies to a given serviceType — lets the
// generic list/detail pages (citizen and admin) render document labels
// without hardcoding a single service's document set.
export const DOCUMENT_TYPES_BY_SERVICE = {
  birth_certificate: BIRTH_CERT_DOCUMENT_TYPES,
  passport: PASSPORT_DOCUMENT_TYPES,
};
