// Shared vocabulary between job seeker, employer, and admin pages — keep in
// sync with the allowlists in firestore.rules.
export const JOB_CATEGORIES = [
  "Technology",
  "Healthcare",
  "Education",
  "Business & Finance",
  "Government & Public Sector",
  "Trades & Labor",
  "Nonprofit & Community",
  "Hospitality",
  "Other",
];

export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Volunteer"];

export const LOCATION_TYPES = [
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

export const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "executive", label: "Executive" },
];

export const JOB_STATUS_LABELS = {
  pending_approval: "Pending Approval",
  published: "Published",
  closed: "Closed",
  rejected: "Rejected",
  removed: "Removed",
};

export function jobStatusBadgeSuffix(status) {
  if (status === "published") return "published";
  if (status === "closed") return "closed";
  if (status === "rejected") return "rejected";
  if (status === "removed") return "removed";
  return "pending";
}

export const APPLICATION_STATUS_LABELS = {
  applied: "Applied",
  under_review: "Under Review",
  interview: "Interview",
  offered: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function applicationStatusBadgeSuffix(status) {
  if (status === "under_review") return "review";
  if (status === "interview") return "interview";
  if (status === "offered") return "offered";
  if (status === "rejected") return "rejected";
  if (status === "withdrawn") return "withdrawn";
  return "applied";
}

export const JOB_REPORT_REASONS = [
  { value: "fraud", label: "Fraud" },
  { value: "expired", label: "Expired posting" },
  { value: "misleading", label: "Misleading information" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];
