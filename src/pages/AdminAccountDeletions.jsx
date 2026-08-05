import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./AdminServiceApplications.css";

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function AdminAccountDeletions() {
  const [admin, setAdmin] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setAdmin(user));
    return () => unsubscribe();
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const snapshot = await getDocs(collection(db, "accountDeletionRequests"));
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRequests(items);
    } catch (err) {
      console.error("Failed to load account deletion requests:", err);
      setError("We couldn't load deletion requests right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadRequests();
    })();
  }, [loadRequests]);

  const resolveRequest = async (requestId, status) => {
    if (!admin) return;
    setBusyId(requestId);
    setError("");
    try {
      await updateDoc(doc(db, "accountDeletionRequests", requestId), {
        status,
        resolvedAt: serverTimestamp(),
        resolvedBy: admin.email || "",
      });
      await loadRequests();
    } catch (err) {
      console.error("Failed to update deletion request:", err);
      setError("Couldn't update this request. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admapp-page">
      <div className="admapp-header">
        <h1>Account Deletion Requests</h1>
        <p>Citizen-submitted requests to delete their Congo Unity account. Review and action manually — nothing here deletes data automatically.</p>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      {loading ? (
        <div className="admapp-list">
          <div className="admapp-row"><div className="admapp-skeleton" style={{ width: "40%", height: 16 }} /></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="admapp-empty"><p>No deletion requests.</p></div>
      ) : (
        <>
          <p className="admapp-count">{requests.length} request{requests.length === 1 ? "" : "s"}</p>
          <div className="admapp-list">
            {requests.map((req) => (
              <div className="admapp-row" key={req.id}>
                <div className="admapp-row-title">
                  <strong>{req.email}</strong>
                  <span className={`admapp-badge admapp-badge-${req.status === "pending" ? "submitted" : req.status === "resolved" ? "approved" : "withdrawn"}`}>
                    {req.status}
                  </span>
                </div>
                {req.reason && <p className="admapp-row-meta">Reason: {req.reason}</p>}
                <p className="admapp-row-meta">Requested {formatDate(req.createdAt)}</p>
                {req.resolvedAt && <p className="admapp-row-meta">Resolved {formatDate(req.resolvedAt)} by {req.resolvedBy}</p>}

                {req.status === "pending" && (
                  <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                    <button type="button" onClick={() => resolveRequest(req.id, "resolved")} disabled={busyId === req.id}>
                      {busyId === req.id ? "Saving…" : "Mark Resolved"}
                    </button>
                    <button type="button" onClick={() => resolveRequest(req.id, "cancelled")} disabled={busyId === req.id}>
                      Cancel Request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminAccountDeletions;
