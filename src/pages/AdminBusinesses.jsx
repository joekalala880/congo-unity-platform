import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { createNotification } from "../services/notificationService";
import { BUSINESS_STATUS_LABELS, businessStatusBadgeSuffix } from "../services/businessTypes";
import "./AdminBusinesses.css";

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function AdminBusinesses() {
  const [admin, setAdmin] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setAdmin(user));
    return () => unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [businessesSnap, reportsSnap] = await Promise.all([
        getDocs(collection(db, "businesses")),
        getDocs(collection(db, "businessReports")),
      ]);

      setBusinesses(
        businessesSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((b) => b.status !== "draft")
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
      setReports(
        reportsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
    } catch (err) {
      console.error("Failed to load admin businesses data:", err);
      setError("We couldn't load this page right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadAll();
    })();
  }, [loadAll]);

  const pendingBusinesses = businesses.filter((b) => b.status === "pending_approval");
  const pendingReports = reports.filter((r) => r.status === "pending");
  const filteredBusinesses = businesses.filter((b) => {
    if (!search.trim()) return true;
    const haystack = `${b.businessName} ${b.ownerName} ${b.ownerEmail} ${b.city} ${b.country}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const notifyOwner = async (business, message) => {
    try {
      await createNotification({
        to: business.ownerEmail,
        from: "Congo Unity Admin",
        type: "Business Listing Update",
        message,
        relatedRoute: "/my-businesses",
      });
    } catch (err) {
      console.error("Failed to notify owner:", err);
    }
  };

  const approveBusiness = async (business) => {
    setBusyId(business.id);
    try {
      await updateDoc(doc(db, "businesses", business.id), { status: "approved", adminMessage: "", updatedAt: serverTimestamp() });
      await notifyOwner(business, `Your business "${business.businessName}" was approved and is now live.`);
      await loadAll();
    } catch (err) {
      console.error("Failed to approve business:", err);
      setError("Couldn't approve this business. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const rejectBusiness = async (business) => {
    const reason = window.prompt("Reason for rejecting this business? (required)");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    setBusyId(business.id);
    try {
      await updateDoc(doc(db, "businesses", business.id), { status: "rejected", adminMessage: reason.trim(), updatedAt: serverTimestamp() });
      await notifyOwner(business, `Your business "${business.businessName}" was rejected: ${reason.trim()}`);
      await loadAll();
    } catch (err) {
      console.error("Failed to reject business:", err);
      setError("Couldn't reject this business. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const requestMoreInfo = async (business) => {
    const message = window.prompt("What additional information is needed? (required)");
    if (message === null) return;
    if (!message.trim()) {
      setError("A message is required to request more information.");
      return;
    }

    setBusyId(business.id);
    try {
      // No dedicated "more info" status in this schema — send it back to
      // draft (so the owner can edit and resubmit) with the request
      // recorded in adminMessage.
      await updateDoc(doc(db, "businesses", business.id), { status: "draft", adminMessage: message.trim(), updatedAt: serverTimestamp() });
      await notifyOwner(business, `More information is needed for your business "${business.businessName}": ${message.trim()}`);
      await loadAll();
    } catch (err) {
      console.error("Failed to request more info:", err);
      setError("Couldn't send this request. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (business) => {
    setBusyId(business.id);
    try {
      await updateDoc(doc(db, "businesses", business.id), { featured: !business.featured, updatedAt: serverTimestamp() });
      await loadAll();
    } catch (err) {
      console.error("Failed to update featured status:", err);
      setError("Couldn't update this business. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleSuspended = async (business) => {
    const nextStatus = business.status === "suspended" ? "approved" : "suspended";
    if (nextStatus === "suspended" && !window.confirm(`Suspend "${business.businessName}"? This is for fraudulent or unsafe listings.`)) return;

    setBusyId(business.id);
    try {
      await updateDoc(doc(db, "businesses", business.id), { status: nextStatus, updatedAt: serverTimestamp() });
      await notifyOwner(
        business,
        nextStatus === "suspended"
          ? `Your business "${business.businessName}" was suspended by an admin.`
          : `Your business "${business.businessName}" was reactivated.`
      );
      await loadAll();
    } catch (err) {
      console.error("Failed to update suspension status:", err);
      setError("Couldn't update this business. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const resolveReport = async (report, status) => {
    setBusyId(report.id);
    try {
      await updateDoc(doc(db, "businessReports", report.id), { status, reviewedBy: admin.email, reviewedAt: serverTimestamp() });
      await loadAll();
    } catch (err) {
      console.error("Failed to update report:", err);
      setError("Couldn't update this report. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="admbiz-page"><p>Loading…</p></div>;
  }

  return (
    <div className="admbiz-page">
      <div className="admbiz-header">
        <h1>Business Directory Administration</h1>
        <p>Review business submissions and reports.</p>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      <div className="admbiz-stats">
        <div className="admbiz-stat"><span>{businesses.length}</span><p>Total Listings</p></div>
        <div className="admbiz-stat"><span>{businesses.filter((b) => b.status === "approved").length}</span><p>Approved</p></div>
        <div className="admbiz-stat"><span>{pendingBusinesses.length}</span><p>Pending Approval</p></div>
        <div className="admbiz-stat"><span>{pendingReports.length}</span><p>Pending Reports</p></div>
      </div>

      <section className="admbiz-section">
        <h2>Pending Businesses ({pendingBusinesses.length})</h2>
        {pendingBusinesses.length === 0 ? (
          <p className="admbiz-empty">Nothing pending review.</p>
        ) : (
          <div className="admbiz-list">
            {pendingBusinesses.map((business) => (
              <div className="admbiz-row" key={business.id}>
                <div className="admbiz-row-title">
                  <strong>{business.businessName}</strong>
                  <span>{business.category} · {business.ownerEmail}</span>
                </div>
                <p>{business.shortDescription}</p>
                <p className="admbiz-meta">Submitted {formatDate(business.createdAt)}</p>
                <div className="admbiz-row-actions">
                  <button type="button" onClick={() => approveBusiness(business)} disabled={busyId === business.id}>Approve</button>
                  <button type="button" onClick={() => requestMoreInfo(business)} disabled={busyId === business.id}>Request More Info</button>
                  <button type="button" className="admbiz-reject" onClick={() => rejectBusiness(business)} disabled={busyId === business.id}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admbiz-section">
        <h2>Reports ({pendingReports.length} pending)</h2>
        {reports.length === 0 ? (
          <p className="admbiz-empty">No reports filed.</p>
        ) : (
          <div className="admbiz-list">
            {reports.map((report) => {
              const business = businesses.find((b) => b.id === report.businessId);
              return (
                <div className="admbiz-row" key={report.id}>
                  <div className="admbiz-row-title">
                    <strong>{business?.businessName || report.businessId}</strong>
                    <span className={`admbiz-report-status admbiz-report-${report.status}`}>{report.status}</span>
                  </div>
                  <p><strong>Type:</strong> {report.targetType} · <strong>Reason:</strong> {report.reason} · <strong>Reported by:</strong> {report.reporterEmail}</p>
                  {report.message && <p>{report.message}</p>}
                  {report.status === "pending" && (
                    <div className="admbiz-row-actions">
                      {business && business.status !== "suspended" && (
                        <button type="button" className="admbiz-reject" onClick={() => toggleSuspended(business)} disabled={busyId === report.id}>
                          Suspend Business
                        </button>
                      )}
                      <button type="button" onClick={() => resolveReport(report, "reviewed")} disabled={busyId === report.id}>Mark Reviewed</button>
                      <button type="button" onClick={() => resolveReport(report, "dismissed")} disabled={busyId === report.id}>Dismiss</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="admbiz-section">
        <h2>All Businesses</h2>
        <input
          type="text"
          placeholder="Search by name, owner, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admbiz-search"
        />
        <div className="admbiz-list">
          {filteredBusinesses.map((business) => (
            <div className="admbiz-row admbiz-row-inline" key={business.id}>
              <span>
                <strong>{business.businessName}</strong> — {business.ownerEmail}{" "}
                <span className={`admbiz-badge admbiz-badge-${businessStatusBadgeSuffix(business.status)}`}>
                  {BUSINESS_STATUS_LABELS[business.status] || business.status}
                </span>
                {business.featured && <span className="admbiz-featured"> ★ Featured</span>}
              </span>
              <div className="admbiz-row-actions">
                <button type="button" onClick={() => toggleFeatured(business)} disabled={busyId === business.id}>
                  {business.featured ? "Unfeature" : "Feature"}
                </button>
                {business.status === "approved" || business.status === "suspended" ? (
                  <button type="button" className="admbiz-reject" onClick={() => toggleSuspended(business)} disabled={busyId === business.id}>
                    {business.status === "suspended" ? "Reactivate" : "Suspend"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminBusinesses;
