import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { createNotification } from "../services/notificationService";
import { EVENT_STATUS_LABELS, eventStatusBadgeSuffix } from "../services/eventTypes";
import "./AdminEvents.css";

// Event dates are a plain "YYYY-MM-DD" string; appending a local midnight
// time avoids new Date() parsing it as UTC and rolling back a day in
// timezones behind UTC.
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatTimestamp(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function AdminEvents() {
  const [admin, setAdmin] = useState(null);
  const [events, setEvents] = useState([]);
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
      const [eventsSnap, reportsSnap] = await Promise.all([
        getDocs(collection(db, "events")),
        getDocs(collection(db, "eventReports")),
      ]);

      setEvents(
        eventsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) => e.status !== "draft")
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
      setReports(
        reportsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
    } catch (err) {
      console.error("Failed to load admin events data:", err);
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

  const pendingEvents = events.filter((e) => e.status === "pending_approval");
  const pendingReports = reports.filter((r) => r.status === "pending");
  const filteredEvents = events.filter((e) => {
    if (!search.trim()) return true;
    const haystack = `${e.title} ${e.organizerName} ${e.createdByEmail} ${e.city} ${e.country}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const notifyOrganizer = async (event, message, type) => {
    try {
      await createNotification({
        to: event.createdByEmail,
        from: "Congo Unity Admin",
        type,
        message,
        relatedRoute: "/my-events",
      });
    } catch (err) {
      console.error("Failed to notify organizer:", err);
    }
  };

  const approveEvent = async (event) => {
    if (event.createdBy === admin.uid) {
      setError("You can't approve your own event — ask another admin to review it.");
      return;
    }

    setBusyId(event.id);
    try {
      await updateDoc(doc(db, "events", event.id), { status: "published", rejectionReason: "", updatedAt: serverTimestamp() });
      await notifyOrganizer(event, `Your event "${event.title}" was approved and is now live.`, "Event Approved");
      await loadAll();
    } catch (err) {
      console.error("Failed to approve event:", err);
      setError("Couldn't approve this event. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const rejectEvent = async (event) => {
    if (event.createdBy === admin.uid) {
      setError("You can't reject your own event — ask another admin to review it.");
      return;
    }

    const reason = window.prompt("Reason for rejecting this event? (required)");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    setBusyId(event.id);
    try {
      await updateDoc(doc(db, "events", event.id), { status: "rejected", rejectionReason: reason.trim(), updatedAt: serverTimestamp() });
      await notifyOrganizer(event, `Your event "${event.title}" was rejected: ${reason.trim()}`, "Event Rejected");
      await loadAll();
    } catch (err) {
      console.error("Failed to reject event:", err);
      setError("Couldn't reject this event. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (event) => {
    setBusyId(event.id);
    try {
      await updateDoc(doc(db, "events", event.id), { featured: !event.featured, updatedAt: serverTimestamp() });
      await loadAll();
    } catch (err) {
      console.error("Failed to update featured status:", err);
      setError("Couldn't update this event. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const forceCancel = async (event) => {
    if (!window.confirm(`Cancel "${event.title}"? This is for unsafe or fraudulent events.`)) return;

    setBusyId(event.id);
    try {
      await updateDoc(doc(db, "events", event.id), { status: "cancelled", updatedAt: serverTimestamp() });
      await notifyOrganizer(event, `Your event "${event.title}" was cancelled by an admin.`, "Event Cancelled");
      await loadAll();
    } catch (err) {
      console.error("Failed to cancel event:", err);
      setError("Couldn't cancel this event. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const resolveReport = async (report, status) => {
    setBusyId(report.id);
    try {
      await updateDoc(doc(db, "eventReports", report.id), { status, reviewedBy: admin.email, reviewedAt: serverTimestamp() });
      await loadAll();
    } catch (err) {
      console.error("Failed to update report:", err);
      setError("Couldn't update this report. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="admevents-page"><p>Loading…</p></div>;
  }

  return (
    <div className="admevents-page">
      <div className="admevents-header">
        <h1>Events Administration</h1>
        <p>Review event submissions, reports, and feature events.</p>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      <div className="admevents-stats">
        <div className="admevents-stat"><span>{events.length}</span><p>Total Events</p></div>
        <div className="admevents-stat"><span>{events.filter((e) => e.status === "published").length}</span><p>Published</p></div>
        <div className="admevents-stat"><span>{pendingEvents.length}</span><p>Pending Approval</p></div>
        <div className="admevents-stat"><span>{pendingReports.length}</span><p>Pending Reports</p></div>
      </div>

      <section className="admevents-section">
        <h2>Pending Events ({pendingEvents.length})</h2>
        {pendingEvents.length === 0 ? (
          <p className="admevents-empty">Nothing pending review.</p>
        ) : (
          <div className="admevents-list">
            {pendingEvents.map((event) => (
              <div className="admevents-row" key={event.id}>
                <div className="admevents-row-title">
                  <strong>{event.title}</strong>
                  <span>{event.organizerName} · {event.createdByEmail}</span>
                </div>
                <p>{event.description?.slice(0, 200)}</p>
                <p className="admevents-meta">{formatDate(event.date)} · Submitted {formatTimestamp(event.createdAt)}</p>
                <div className="admevents-row-actions">
                  <button type="button" onClick={() => approveEvent(event)} disabled={busyId === event.id}>Approve</button>
                  <button type="button" className="admevents-reject" onClick={() => rejectEvent(event)} disabled={busyId === event.id}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admevents-section">
        <h2>Event Reports ({pendingReports.length} pending)</h2>
        {reports.length === 0 ? (
          <p className="admevents-empty">No reports filed.</p>
        ) : (
          <div className="admevents-list">
            {reports.map((report) => {
              const event = events.find((e) => e.id === report.eventId);
              return (
                <div className="admevents-row" key={report.id}>
                  <div className="admevents-row-title">
                    <strong>{event?.title || report.eventId}</strong>
                    <span className={`admevents-report-status admevents-report-${report.status}`}>{report.status}</span>
                  </div>
                  <p><strong>Reason:</strong> {report.reason} · <strong>Reported by:</strong> {report.reporterEmail}</p>
                  {report.message && <p>{report.message}</p>}
                  {report.status === "pending" && (
                    <div className="admevents-row-actions">
                      {event && event.status !== "cancelled" && (
                        <button type="button" className="admevents-reject" onClick={() => forceCancel(event)} disabled={busyId === report.id}>
                          Cancel Event
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

      <section className="admevents-section">
        <h2>All Events</h2>
        <input
          type="text"
          placeholder="Search by title, organizer, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admevents-search"
        />
        <div className="admevents-list">
          {filteredEvents.map((event) => (
            <div className="admevents-row admevents-row-inline" key={event.id}>
              <span>
                <strong>{event.title}</strong> — {event.organizerName}{" "}
                <span className={`admevents-badge admevents-badge-${eventStatusBadgeSuffix(event.status)}`}>
                  {EVENT_STATUS_LABELS[event.status] || event.status}
                </span>
                {event.featured && <span className="admevents-featured"> ★ Featured</span>}
              </span>
              <div className="admevents-row-actions">
                <button type="button" onClick={() => toggleFeatured(event)} disabled={busyId === event.id}>
                  {event.featured ? "Unfeature" : "Feature"}
                </button>
                {event.status !== "cancelled" && (
                  <button type="button" className="admevents-reject" onClick={() => forceCancel(event)} disabled={busyId === event.id}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminEvents;
