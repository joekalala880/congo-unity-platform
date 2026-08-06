// Shared vocabulary between public, owner, and admin business pages — keep
// in sync with the allowlists in firestore.rules.
export const BUSINESS_CATEGORIES = [
  "Restaurant",
  "Grocery Store",
  "Lawyer",
  "Doctor or Clinic",
  "Mechanic",
  "Transportation",
  "Real Estate",
  "Construction",
  "Technology",
  "Beauty and Barber",
  "Clothing and Fashion",
  "Church",
  "Nonprofit",
  "Community Organization",
  "Education",
  "Financial Services",
  "Other",
];

export const PRICE_RANGES = [
  { value: "", label: "Not specified" },
  { value: "$", label: "$ — Budget" },
  { value: "$$", label: "$$ — Moderate" },
  { value: "$$$", label: "$$$ — Upscale" },
  { value: "$$$$", label: "$$$$ — Premium" },
];

export const BUSINESS_STATUS_LABELS = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
  closed: "Closed",
};

export function businessStatusBadgeSuffix(status) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "suspended") return "suspended";
  if (status === "closed") return "closed";
  return "pending";
}

export const BUSINESS_REPORT_REASONS = [
  { value: "fraud", label: "Fraud" },
  { value: "incorrect_info", label: "Incorrect information" },
  { value: "unsafe_service", label: "Unsafe service" },
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam" },
  { value: "closed_permanently", label: "Closed permanently" },
  { value: "other", label: "Other" },
];

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name A–Z" },
  { value: "rating", label: "Highest Rated" },
];
