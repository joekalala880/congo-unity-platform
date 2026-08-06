import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { createNotification } from "../services/notificationService";
import { logCrisisAdminAction } from "../services/crisisAuditLogService";
import { publishCrisisAlert, updatePublicAlertStatus } from "../services/crisisReportsService";
import {
  createEmergencyResource,
  deleteEmergencyResource,
  listAllEmergencyResources,
  setEmergencyResourceActive,
  updateEmergencyResource,
} from "../services/emergencyResourcesService";
import {
  CRISIS_REPORT_STATUS_LABELS,
  MISSING_PERSON_STATUS_LABELS,
  RESOURCE_TYPES,
  crisisStatusBadgeSuffix,
  missingPersonStatusBadgeSuffix,
  resourceTypeLabel,
} from "../services/crisisTypes";
import "./CrisisForms.css";
import "./AdminCrisis.css";

const RESOURCE_EMPTY_FIELDS = {
  resourceType: RESOURCE_TYPES[0].value,
  name: "",
  description: "",
  province: "",
  territory: "",
  cityVillage: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  hours: "",
};

async function getReporterProfile(reporterId) {
  try {
    const snap = await getDoc(doc(db, "congoleseProfiles", reporterId));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Failed to load reporter profile:", err);
    return null;
  }
}

function reporterDisplayName(profile) {
  if (!profile) return "";
  return profile.preferredName || [profile.firstName, profile.lastName].filter(Boolean).join(" ");
}

function AdminCrisis() {
  const [admin, setAdmin] = useState(null);
  const [reports, setReports] = useState([]);
  const [missingCases, setMissingCases] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [resourceFields, setResourceFields] = useState(RESOURCE_EMPTY_FIELDS);
  const [editingResourceId, setEditingResourceId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setAdmin(user));
    return () => unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reportsSnap, missingSnap, resourcesData] = await Promise.all([
        getDocs(collection(db, "crisisReports")),
        getDocs(collection(db, "missingPersonReports")),
        listAllEmergencyResources(),
      ]);

      setReports(
        reportsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
      setMissingCases(
        missingSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
      setResources(resourcesData);
    } catch (err) {
      console.error("Failed to load Crisis Center admin data:", err);
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

  const notifyReporter = async (reporterId, message, relatedRoute) => {
    const profile = await getReporterProfile(reporterId);
    if (!profile?.email) return;
    try {
      await createNotification({
        to: profile.email,
        from: "Congo Unity Admin",
        fromUserId: admin.uid,
        type: "Crisis Center Update",
        message,
        relatedRoute,
      });
    } catch (err) {
      console.error("Failed to notify reporter:", err);
    }
  };

  // ---------- Crisis Reports ----------

  const pendingReports = reports.filter((r) => ["submitted", "under_review"].includes(r.status));
  const decidedReports = reports.filter((r) => ["verified", "rejected", "resolved", "archived"].includes(r.status));

  const setReportStatus = async (report, status, { adminMessage = "", details = "" } = {}) => {
    setBusyId(report.id);
    try {
      await updateDoc(doc(db, "crisisReports", report.id), {
        status,
        adminMessage,
        updatedAt: serverTimestamp(),
      });
      await logCrisisAdminAction(admin, {
        action: `report_${status}`,
        targetType: "crisisReport",
        targetId: report.id,
        details,
      });
      await loadAll();
    } catch (err) {
      console.error("Failed to update crisis report:", err);
      setError("Couldn't update this report. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const markUnderReview = async (report) => {
    await setReportStatus(report, "under_review");
    await notifyReporter(report.reporterId, `Your crisis report "${report.title}" is now under review.`, "/crisis/report");
  };

  const verifyReport = async (report) => {
    setBusyId(report.id);
    try {
      const profile = report.showIdentityPublicly ? await getReporterProfile(report.reporterId) : null;
      await publishCrisisAlert(report, reporterDisplayName(profile));
      await updateDoc(doc(db, "crisisReports", report.id), {
        status: "verified",
        adminMessage: "",
        updatedAt: serverTimestamp(),
      });
      await logCrisisAdminAction(admin, {
        action: "report_verified",
        targetType: "crisisReport",
        targetId: report.id,
        details: "Published to publicCrisisAlerts",
      });
      await loadAll();
    } catch (err) {
      console.error("Failed to verify crisis report:", err);
      setError("Couldn't verify this report. Please try again.");
    } finally {
      setBusyId(null);
    }
    await notifyReporter(report.reporterId, `Your crisis report "${report.title}" was verified and is now a public alert.`, "/crisis");
  };

  const rejectReport = async (report) => {
    const reason = window.prompt("Reason for rejecting this report? (required)");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    await setReportStatus(report, "rejected", { adminMessage: reason.trim(), details: reason.trim() });
    await notifyReporter(report.reporterId, `Your crisis report "${report.title}" was rejected: ${reason.trim()}`, "/crisis/report");
  };

  const requestMoreInfoOnReport = async (report) => {
    const message = window.prompt("What additional information is needed? (required)");
    if (message === null) return;
    if (!message.trim()) {
      setError("A message is required to request more information.");
      return;
    }
    await setReportStatus(report, "draft", { adminMessage: message.trim(), details: message.trim() });
    await notifyReporter(report.reporterId, `More information is needed for your crisis report "${report.title}": ${message.trim()}`, "/crisis/report");
  };

  const resolveReport = async (report) => {
    await setReportStatus(report, "resolved");
    await updatePublicAlertStatus(report.id, "resolved");
    await notifyReporter(report.reporterId, `Your crisis report "${report.title}" has been marked resolved.`, "/crisis");
  };

  const archiveReport = async (report) => {
    await setReportStatus(report, "archived");
    await updatePublicAlertStatus(report.id, "archived");
  };

  // ---------- Missing Persons ----------

  const pendingCases = missingCases.filter((c) => ["submitted", "under_review"].includes(c.status));
  const decidedCases = missingCases.filter((c) => ["verified_missing", "located", "closed", "rejected"].includes(c.status));

  const setCaseStatus = async (mpCase, status, { adminMessage = "", details = "" } = {}) => {
    setBusyId(mpCase.id);
    try {
      await updateDoc(doc(db, "missingPersonReports", mpCase.id), {
        status,
        adminMessage,
        updatedAt: serverTimestamp(),
      });
      await logCrisisAdminAction(admin, {
        action: `missing_person_${status}`,
        targetType: "missingPersonReport",
        targetId: mpCase.id,
        details,
      });
      await loadAll();
    } catch (err) {
      console.error("Failed to update missing person case:", err);
      setError("Couldn't update this case. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const markCaseUnderReview = async (mpCase) => {
    await setCaseStatus(mpCase, "under_review");
    await notifyReporter(mpCase.reporterId, `Your missing person case for "${mpCase.name}" is now under review.`, "/crisis/missing-persons/report");
  };

  const verifyCase = async (mpCase) => {
    await setCaseStatus(mpCase, "verified_missing");
    await notifyReporter(mpCase.reporterId, `Your missing person case for "${mpCase.name}" was verified and is now public.`, `/crisis/missing-persons/${mpCase.id}`);
  };

  const rejectCase = async (mpCase) => {
    const reason = window.prompt("Reason for rejecting this case? (required)");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    await setCaseStatus(mpCase, "rejected", { adminMessage: reason.trim(), details: reason.trim() });
    await notifyReporter(mpCase.reporterId, `Your missing person case for "${mpCase.name}" was rejected: ${reason.trim()}`, "/crisis/missing-persons/report");
  };

  const requestMoreInfoOnCase = async (mpCase) => {
    const message = window.prompt("What additional information is needed? (required)");
    if (message === null) return;
    if (!message.trim()) {
      setError("A message is required to request more information.");
      return;
    }
    await setCaseStatus(mpCase, "under_review", { adminMessage: message.trim(), details: message.trim() });
    await notifyReporter(mpCase.reporterId, `More information is needed for "${mpCase.name}": ${message.trim()}`, "/crisis/missing-persons/report");
  };

  const markLocated = async (mpCase) => {
    await setCaseStatus(mpCase, "located");
    await notifyReporter(mpCase.reporterId, `Great news — "${mpCase.name}" has been marked as located.`, `/crisis/missing-persons/${mpCase.id}`);
  };

  const closeCase = async (mpCase) => {
    await setCaseStatus(mpCase, "closed");
  };

  // ---------- Emergency Resources ----------

  const handleResourceChange = (e) => {
    setResourceFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const startEditingResource = (resource) => {
    setEditingResourceId(resource.id);
    setResourceFields({
      resourceType: resource.resourceType,
      name: resource.name || "",
      description: resource.description || "",
      province: resource.province || "",
      territory: resource.territory || "",
      cityVillage: resource.cityVillage || "",
      address: resource.address || "",
      phone: resource.phone || "",
      email: resource.email || "",
      website: resource.website || "",
      hours: resource.hours || "",
    });
  };

  const cancelEditingResource = () => {
    setEditingResourceId(null);
    setResourceFields(RESOURCE_EMPTY_FIELDS);
  };

  const submitResource = async (e) => {
    e.preventDefault();
    if (!resourceFields.name.trim()) {
      setError("Resource name is required.");
      return;
    }
    setError("");
    try {
      if (editingResourceId) {
        await updateEmergencyResource(editingResourceId, resourceFields);
        await logCrisisAdminAction(admin, {
          action: "resource_updated",
          targetType: "emergencyResource",
          targetId: editingResourceId,
        });
      } else {
        const id = await createEmergencyResource(admin, resourceFields);
        await logCrisisAdminAction(admin, {
          action: "resource_created",
          targetType: "emergencyResource",
          targetId: id,
        });
      }
      cancelEditingResource();
      await loadAll();
    } catch (err) {
      console.error("Failed to save emergency resource:", err);
      setError("Couldn't save this resource. Please try again.");
    }
  };

  const toggleResourceActive = async (resource) => {
    setBusyId(resource.id);
    try {
      await setEmergencyResourceActive(resource.id, !resource.isActive);
      await logCrisisAdminAction(admin, {
        action: resource.isActive ? "resource_deactivated" : "resource_activated",
        targetType: "emergencyResource",
        targetId: resource.id,
      });
      await loadAll();
    } catch (err) {
      console.error("Failed to toggle resource:", err);
      setError("Couldn't update this resource. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const removeResource = async (resource) => {
    if (!window.confirm(`Delete "${resource.name}"? This cannot be undone.`)) return;
    setBusyId(resource.id);
    try {
      await deleteEmergencyResource(resource.id);
      await logCrisisAdminAction(admin, {
        action: "resource_deleted",
        targetType: "emergencyResource",
        targetId: resource.id,
      });
      await loadAll();
    } catch (err) {
      console.error("Failed to delete resource:", err);
      setError("Couldn't delete this resource. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (!admin) {
    return <section className="register-section"><p>Checking permissions…</p></section>;
  }

  return (
    <section className="register-section admcrisis-page">
      <div className="register-header">
        <h1>Crisis Center Administration</h1>
        <p>Review crisis reports and missing person cases, and manage emergency resources.</p>
      </div>

      {error && <p className="register-form__error" role="alert">{error}</p>}

      <div className="admcrisis-stats">
        <div className="admcrisis-stat"><span>{pendingReports.length}</span>Pending Reports</div>
        <div className="admcrisis-stat"><span>{pendingCases.length}</span>Pending Missing Person Cases</div>
        <div className="admcrisis-stat"><span>{resources.filter((r) => r.isActive).length}</span>Active Resources</div>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <div className="admcrisis-section">
            <h2>Pending Crisis Reports</h2>
            {pendingReports.length === 0 ? (
              <p className="admcrisis-empty">No pending crisis reports.</p>
            ) : (
              <div className="admcrisis-list">
                {pendingReports.map((report) => (
                  <div className="admcrisis-row" key={report.id}>
                    <div className="admcrisis-row-title">
                      <strong>{report.title}</strong>
                      <span>{report.category} · {[report.cityVillage, report.province].filter(Boolean).join(", ")} · Urgency: {report.urgency}</span>
                    </div>
                    <p>{report.description}</p>
                    <p className="admcrisis-meta">Contact: {report.preferredContactMethod} — {report.contactDetails || "not provided"}</p>
                    <div className="admcrisis-row-actions">
                      {report.status === "submitted" && (
                        <button type="button" disabled={busyId === report.id} onClick={() => markUnderReview(report)}>Mark Under Review</button>
                      )}
                      <button type="button" disabled={busyId === report.id} onClick={() => verifyReport(report)}>Verify &amp; Publish</button>
                      <button type="button" disabled={busyId === report.id} onClick={() => requestMoreInfoOnReport(report)}>Request More Info</button>
                      <button type="button" className="admcrisis-reject" disabled={busyId === report.id} onClick={() => rejectReport(report)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admcrisis-section">
            <h2>Verified / Resolved / Archived Reports</h2>
            {decidedReports.length === 0 ? (
              <p className="admcrisis-empty">No decided reports yet.</p>
            ) : (
              <div className="admcrisis-list">
                {decidedReports.map((report) => (
                  <div className="admcrisis-row" key={report.id}>
                    <div className="admcrisis-row-inline">
                      <div className="admcrisis-row-title">
                        <strong>{report.title}</strong>
                        <span>{report.category} · {[report.cityVillage, report.province].filter(Boolean).join(", ")}</span>
                      </div>
                      <span className={`crisis-status-badge crisis-status-${crisisStatusBadgeSuffix(report.status)}`}>
                        {CRISIS_REPORT_STATUS_LABELS[report.status] || report.status}
                      </span>
                    </div>
                    {report.status === "verified" && (
                      <div className="admcrisis-row-actions">
                        <button type="button" disabled={busyId === report.id} onClick={() => resolveReport(report)}>Mark Resolved</button>
                        <button type="button" disabled={busyId === report.id} onClick={() => archiveReport(report)}>Archive</button>
                      </div>
                    )}
                    {report.status === "resolved" && (
                      <div className="admcrisis-row-actions">
                        <button type="button" disabled={busyId === report.id} onClick={() => archiveReport(report)}>Archive</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admcrisis-section">
            <h2>Pending Missing Person Cases</h2>
            {pendingCases.length === 0 ? (
              <p className="admcrisis-empty">No pending missing person cases.</p>
            ) : (
              <div className="admcrisis-list">
                {pendingCases.map((mpCase) => (
                  <div className="admcrisis-row" key={mpCase.id}>
                    <div className="admcrisis-row-title">
                      <strong>{mpCase.name}</strong>
                      <span>Last seen: {mpCase.lastSeenLocation} {mpCase.lastSeenDate && `on ${mpCase.lastSeenDate}`}</span>
                    </div>
                    {mpCase.clothingDescription && <p><strong>Clothing:</strong> {mpCase.clothingDescription}</p>}
                    {mpCase.distinguishingFeatures && <p><strong>Features:</strong> {mpCase.distinguishingFeatures}</p>}
                    <p className="admcrisis-meta">Safe contact: {mpCase.safeContactMethod}</p>
                    <div className="admcrisis-row-actions">
                      {mpCase.status === "submitted" && (
                        <button type="button" disabled={busyId === mpCase.id} onClick={() => markCaseUnderReview(mpCase)}>Mark Under Review</button>
                      )}
                      <button type="button" disabled={busyId === mpCase.id} onClick={() => verifyCase(mpCase)}>Verify &amp; Publish</button>
                      <button type="button" disabled={busyId === mpCase.id} onClick={() => requestMoreInfoOnCase(mpCase)}>Request More Info</button>
                      <button type="button" className="admcrisis-reject" disabled={busyId === mpCase.id} onClick={() => rejectCase(mpCase)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admcrisis-section">
            <h2>Verified / Located / Closed Cases</h2>
            {decidedCases.length === 0 ? (
              <p className="admcrisis-empty">No decided cases yet.</p>
            ) : (
              <div className="admcrisis-list">
                {decidedCases.map((mpCase) => (
                  <div className="admcrisis-row" key={mpCase.id}>
                    <div className="admcrisis-row-inline">
                      <div className="admcrisis-row-title">
                        <strong>{mpCase.name}</strong>
                        <span>Last seen: {mpCase.lastSeenLocation}</span>
                      </div>
                      <span className={`crisis-status-badge crisis-status-${missingPersonStatusBadgeSuffix(mpCase.status)}`}>
                        {MISSING_PERSON_STATUS_LABELS[mpCase.status] || mpCase.status}
                      </span>
                    </div>
                    {mpCase.status === "verified_missing" && (
                      <div className="admcrisis-row-actions">
                        <button type="button" disabled={busyId === mpCase.id} onClick={() => markLocated(mpCase)}>Mark Located</button>
                        <button type="button" disabled={busyId === mpCase.id} onClick={() => closeCase(mpCase)}>Close Case</button>
                      </div>
                    )}
                    {mpCase.status === "located" && (
                      <div className="admcrisis-row-actions">
                        <button type="button" disabled={busyId === mpCase.id} onClick={() => closeCase(mpCase)}>Close Case</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admcrisis-section">
            <h2>Emergency Resources</h2>

            <form className="register-form crisisform" onSubmit={submitResource}>
              <label><span>Resource Type</span>
                <select name="resourceType" value={resourceFields.resourceType} onChange={handleResourceChange}>
                  {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label><span>Name</span><input name="name" value={resourceFields.name} onChange={handleResourceChange} /></label>

              <label className="crisisform-full"><span>Description</span><textarea name="description" value={resourceFields.description} onChange={handleResourceChange} /></label>

              <label><span>Province</span><input name="province" value={resourceFields.province} onChange={handleResourceChange} /></label>
              <label><span>Territory</span><input name="territory" value={resourceFields.territory} onChange={handleResourceChange} /></label>

              <label><span>City / Village</span><input name="cityVillage" value={resourceFields.cityVillage} onChange={handleResourceChange} /></label>
              <label><span>Address</span><input name="address" value={resourceFields.address} onChange={handleResourceChange} /></label>

              <label><span>Phone</span><input name="phone" value={resourceFields.phone} onChange={handleResourceChange} /></label>
              <label><span>Email</span><input name="email" value={resourceFields.email} onChange={handleResourceChange} /></label>

              <label><span>Website</span><input name="website" value={resourceFields.website} onChange={handleResourceChange} /></label>
              <label><span>Hours</span><input name="hours" value={resourceFields.hours} onChange={handleResourceChange} placeholder="e.g. 24/7" /></label>

              <div className="crisisform-actions">
                <button type="submit">{editingResourceId ? "Save Changes" : "Add Resource"}</button>
                {editingResourceId && <button type="button" onClick={cancelEditingResource}>Cancel</button>}
              </div>
            </form>

            {resources.length === 0 ? (
              <p className="admcrisis-empty">No emergency resources yet.</p>
            ) : (
              <div className="admcrisis-list">
                {resources.map((resource) => (
                  <div className="admcrisis-row" key={resource.id}>
                    <div className="admcrisis-row-inline">
                      <div className="admcrisis-row-title">
                        <strong>{resource.name}</strong>
                        <span>{resourceTypeLabel(resource.resourceType)} · {[resource.cityVillage, resource.province].filter(Boolean).join(", ")}</span>
                      </div>
                      <span className={resource.isActive ? "admcrisis-badge admcrisis-badge-approved" : "admcrisis-badge admcrisis-badge-closed"}>
                        {resource.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="admcrisis-row-actions">
                      <button type="button" onClick={() => startEditingResource(resource)}>Edit</button>
                      <button type="button" disabled={busyId === resource.id} onClick={() => toggleResourceActive(resource)}>
                        {resource.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button type="button" className="admcrisis-reject" disabled={busyId === resource.id} onClick={() => removeResource(resource)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default AdminCrisis;
