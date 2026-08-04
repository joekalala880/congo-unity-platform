import { useEffect, useState } from "react";
import { generateCitizenIdentity } from "../services/identityService";

// Lazily backfills citizenId/memberNumber/registrationDate the first time
// a loaded profile is missing them (see identityService.js for why this
// is a lazy, per-user backfill rather than a bulk migration). Returns the
// identity fields once available, plus a `generating` flag so callers can
// show a brief "Setting up your Digital ID..." state instead of a blank
// gap on someone's first profile load after this feature ships.
export function useIdentity(profileDocId, profile) {
  const [identity, setIdentity] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profileDocId || !profile) return;

    let cancelled = false;

    (async () => {
      if (profile.citizenId) {
        if (!cancelled) {
          setIdentity({
            citizenId: profile.citizenId,
            memberNumber: profile.memberNumber,
            registrationDate: profile.registrationDate,
          });
        }
        return;
      }

      setGenerating(true);
      setError("");

      try {
        const result = await generateCitizenIdentity(profileDocId, profile);
        if (!cancelled) setIdentity(result);
      } catch (err) {
        console.error("Failed to generate citizen identity:", err);
        if (!cancelled) {
          const code = err.code ? ` (${err.code})` : "";
          setError(`Couldn't set up your Digital ID right now${code}. Please refresh to try again.`);
        }
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileDocId, profile]);

  return { identity, generating, error };
}
