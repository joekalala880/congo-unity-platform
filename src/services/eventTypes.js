// Shared vocabulary between citizen, organizer, and admin event pages —
// keep in sync with the allowlists in firestore.rules.
export const EVENT_CATEGORIES = [
  "Community Meetup",
  "Cultural Event",
  "Business Networking",
  "Career Event",
  "Education",
  "Fundraiser",
  "Religious Event",
  "Sports",
  "Government or Civic Event",
  "Online Event",
];

export const ONLINE_OR_IN_PERSON = [
  { value: "in_person", label: "In-Person" },
  { value: "online", label: "Online" },
];

export const FREE_OR_PAID = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

export const EVENT_STATUS_LABELS = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  published: "Published",
  cancelled: "Cancelled",
  completed: "Completed",
  rejected: "Rejected",
};

export function eventStatusBadgeSuffix(status) {
  if (status === "published") return "published";
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  if (status === "rejected") return "rejected";
  return "pending";
}

export const RSVP_STATUS_LABELS = {
  going: "Going",
  interested: "Interested",
  cancelled: "Not Attending",
};

export const EVENT_REPORT_REASONS = [
  { value: "fraud", label: "Fraud" },
  { value: "unsafe_location", label: "Unsafe location" },
  { value: "misleading", label: "Misleading information" },
  { value: "harassment", label: "Hate or harassment" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];
