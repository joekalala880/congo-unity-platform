// Inline SVG fallback shown wherever a user hasn't uploaded a profile photo
// (profileImageUrl is ""). A data URI avoids needing a bundled image asset.
export const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%230D0D0D'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23FFD700'/%3E%3Cpath d='M50 60c-22 0-34 12-34 28v12h68V88c0-16-12-28-34-28Z' fill='%23FFD700'/%3E%3C/svg%3E";
