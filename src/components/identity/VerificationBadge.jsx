import "./VerificationBadge.css";

// Single source of truth for the citizen verification status vocabulary —
// used by Profile, Dashboard, PublicProfile, SearchUsers, CommunityFeed,
// and VerifyCitizenId, so the label/color mapping only ever lives here.
const STATUS_LABELS = {
  pending_verification: "Pending Verification",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

function statusClass(status) {
  if (status === "verified") return "vbadge-verified";
  if (status === "under_review") return "vbadge-review";
  if (status === "rejected") return "vbadge-rejected";
  if (status === "suspended") return "vbadge-suspended";
  return "vbadge-pending";
}

function VerificationBadge({ status, className = "" }) {
  const resolvedStatus = status || "pending_verification";

  return (
    <span className={`vbadge ${statusClass(resolvedStatus)} ${className}`}>
      {STATUS_LABELS[resolvedStatus] || resolvedStatus}
    </span>
  );
}

export default VerificationBadge;
