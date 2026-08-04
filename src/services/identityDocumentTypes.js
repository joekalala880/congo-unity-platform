// Shared between the citizen portal (IdentityDocuments.jsx) and the admin
// queue (AdminVerificationQueue.jsx) — keep in sync with the documentType
// allowlist in firestore.rules' isValidDocumentTypeSubmit().
export const DOCUMENT_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "driver_license", label: "Driver License" },
  { value: "residence_permit", label: "Residence Permit" },
  { value: "refugee_card", label: "Refugee Card" },
  { value: "student_id", label: "Student ID" },
  { value: "selfie", label: "Selfie" },
  { value: "other", label: "Other Document" },
];

export const DOCUMENT_TYPE_LABELS = Object.fromEntries(DOCUMENT_TYPES.map((t) => [t.value, t.label]));

// A profile is auto-verified once it has one approved photo ID from this
// set plus an approved selfie — see verificationService.js. Flagged as a
// policy decision in the Phase 2 summary since the spec doesn't enumerate
// an exact required-documents list.
export const PRIMARY_ID_TYPES = ["national_id", "passport", "driver_license", "residence_permit", "refugee_card"];

export const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  more_information_required: "More Information Required",
  replaced: "Replaced",
};

export function statusBadgeClass(status) {
  if (status === "approved") return "iddoc-badge-approved";
  if (status === "under_review") return "iddoc-badge-review";
  if (status === "rejected") return "iddoc-badge-rejected";
  if (status === "more_information_required") return "iddoc-badge-info";
  if (status === "replaced") return "iddoc-badge-replaced";
  if (status === "submitted") return "iddoc-badge-submitted";
  return "iddoc-badge-draft";
}
