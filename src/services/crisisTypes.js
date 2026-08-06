// Shared vocabulary for the Crisis & Emergency Center — keep in sync with
// the allowlists in firestore.rules.

export const CRISIS_CATEGORIES = [
  "Violence or Security Threat",
  "Displacement",
  "Health Emergency",
  "Natural Disaster",
  "Humanitarian Need",
  "Infrastructure or Utilities",
  "Child Protection Concern",
  "Gender-Based Violence",
  "Other",
];

export const CRISIS_URGENCY_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const CONTACT_METHODS = [
  "Phone",
  "Email",
  "In-app Notification",
  "No Contact Needed",
];

export const CRISIS_REPORT_STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  resolved: "Resolved",
  archived: "Archived",
};

export function crisisStatusBadgeSuffix(status) {
  if (status === "verified") return "verified";
  if (status === "rejected") return "rejected";
  if (status === "resolved") return "resolved";
  if (status === "archived") return "archived";
  if (status === "under_review") return "review";
  return "pending";
}

export function urgencyLabel(value) {
  return CRISIS_URGENCY_LEVELS.find((u) => u.value === value)?.label || value;
}

// ---------- Missing Persons ----------

export const MISSING_PERSON_GENDERS = ["Male", "Female", "Unknown"];

export const MISSING_PERSON_STATUS_LABELS = {
  submitted: "Submitted",
  under_review: "Under Review",
  verified_missing: "Verified Missing",
  located: "Located",
  closed: "Closed",
  rejected: "Rejected",
};

export function missingPersonStatusBadgeSuffix(status) {
  if (status === "verified_missing") return "review";
  if (status === "located") return "verified";
  if (status === "rejected") return "rejected";
  if (status === "closed") return "archived";
  return "pending";
}

// ---------- Emergency Resources ----------

export const RESOURCE_TYPES = [
  { value: "hospital", label: "Hospitals" },
  { value: "shelter", label: "Shelters" },
  { value: "food_assistance", label: "Food Assistance" },
  { value: "water_assistance", label: "Water Assistance" },
  { value: "legal_aid", label: "Legal Aid" },
  { value: "child_protection", label: "Child Protection" },
  { value: "domestic_violence_support", label: "Domestic Violence Support" },
  { value: "mental_health_support", label: "Mental Health Support" },
  { value: "refugee_displacement_support", label: "Refugee / Displacement Support" },
  { value: "humanitarian_organization", label: "Humanitarian Organizations" },
  { value: "embassy_consulate", label: "Embassies / Consulates" },
  { value: "emergency_hotline", label: "Emergency Hotlines" },
];

export function resourceTypeLabel(value) {
  return RESOURCE_TYPES.find((r) => r.value === value)?.label || value;
}

export const CRISIS_DISCLAIMER =
  "Congo Unity is not an official emergency-dispatch service. If you or someone " +
  "else is in immediate danger, please contact your local police, medical, or " +
  "emergency services right away. Reports and alerts here are community-submitted " +
  "and admin-reviewed, but response times are not guaranteed.";
