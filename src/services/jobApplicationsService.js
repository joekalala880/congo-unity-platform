import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { createNotification } from "./notificationService";

const COLLECTION = "jobApplications";

export function applicationIdFor(jobId, applicantUserId) {
  return `${jobId}_${applicantUserId}`;
}

// Doc ID is deterministic (jobId_applicantUserId), so a duplicate apply
// attempt is caught up front here rather than relying solely on the rules
// rejecting a same-ID create as an illegal update — this gives a clean
// "you already applied" message instead of a raw permission error.
export async function applyToJob(user, job, fields) {
  const applicationId = applicationIdFor(job.id, user.uid);
  const existing = await getDoc(doc(db, COLLECTION, applicationId));
  if (existing.exists()) {
    throw new Error("You've already applied to this job.");
  }

  await setDoc(doc(db, COLLECTION, applicationId), {
    jobId: job.id,
    jobTitle: job.title || "",
    companyName: job.companyName || "",
    employerId: job.employerId,
    applicantUserId: user.uid,
    applicantEmail: user.email,
    applicantFullName: fields.applicantFullName || "",
    resumeCloudinaryPublicId: fields.resumeCloudinaryPublicId || "",
    resumeResourceType: fields.resumeResourceType || "",
    resumeFileName: fields.resumeFileName || "",
    coverLetter: fields.coverLetter || "",
    status: "applied",
    interviewInstructions: "",
    reviewedAt: null,
    reviewedBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return applicationId;
}

export async function withdrawApplication(applicationId) {
  await updateDoc(doc(db, COLLECTION, applicationId), {
    status: "withdrawn",
    updatedAt: serverTimestamp(),
  });
}

export async function getApplication(applicationId) {
  const snap = await getDoc(doc(db, COLLECTION, applicationId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getMyApplicationForJob(jobId, uid) {
  return getApplication(applicationIdFor(jobId, uid));
}

export async function listMyApplications(uid) {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("applicantUserId", "==", uid)));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
}

export async function listApplicationsForJob(jobId, employerId) {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), where("jobId", "==", jobId), where("employerId", "==", employerId))
  );
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

export async function countApplicationsForJob(jobId, employerId) {
  const applications = await listApplicationsForJob(jobId, employerId);
  return applications.length;
}

// Employer decision: status change, optionally with interview instructions
// (sent whenever moving into 'interview'). Notifies the applicant either
// way — "Receive notifications when application status changes" is a core
// job-seeker requirement.
export async function updateApplicationStatus(employer, application, status, interviewInstructions = "") {
  await updateDoc(doc(db, COLLECTION, application.id), {
    status,
    interviewInstructions,
    reviewedAt: serverTimestamp(),
    reviewedBy: employer.email,
    updatedAt: serverTimestamp(),
  });

  const STATUS_MESSAGES = {
    under_review: "is now under review",
    interview: "has moved to the interview stage",
    offered: "received an offer",
    rejected: "was not selected to move forward",
  };
  const statusMessage = STATUS_MESSAGES[status] || `changed to ${status}`;
  const interviewNote = status === "interview" && interviewInstructions ? ` Interview details: ${interviewInstructions}` : "";

  await createNotification({
    to: application.applicantEmail,
    from: employer.email,
    fromUserId: employer.uid,
    type: "Job Application Update",
    message: `Your application for "${application.jobTitle || "this role"}" ${statusMessage}.${interviewNote}`,
    relatedRoute: "/my-applications",
  });
}
