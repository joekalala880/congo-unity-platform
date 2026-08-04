// Shared between Dashboard.jsx and IdentityDashboard.jsx so both surfaces
// report the same profile-completion percentage — kept out of either page
// file since a component file exporting a non-component breaks Fast Refresh.
const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "province",
  "territory",
  "village",
  "currentCountry",
  "dateOfBirth",
  "profileImageUrl",
];

export function computeProfileCompletion(profile) {
  if (!profile) return { percent: 0, filled: 0, total: PROFILE_FIELDS.length };

  const filled = PROFILE_FIELDS.filter((field) => {
    const value = profile[field];
    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
  }).length;

  return {
    percent: Math.round((filled / PROFILE_FIELDS.length) * 100),
    filled,
    total: PROFILE_FIELDS.length,
  };
}
