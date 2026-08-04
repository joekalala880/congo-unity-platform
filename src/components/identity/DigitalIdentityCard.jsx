import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Avatar from "../Avatar";
import VerificationBadge from "./VerificationBadge";
import QRCodeDisplay from "./QRCodeDisplay";
import { getVerificationUrl } from "../../services/identityService";
import "./DigitalIdentityCard.css";

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

async function captureSide(node) {
  return html2canvas(node, { scale: 3, useCORS: true, backgroundColor: "#151515" });
}

// Reusable, presentational — takes a fully-loaded profile object (owner's
// own view via /identity, or an admin's read-only preview) and renders a
// front/back ID card with no private document data, ever: only the fields
// explicitly listed in the Phase 3 spec ever appear here.
function DigitalIdentityCard({ profile, loading = false, onReissue }) {
  const [side, setSide] = useState("front");
  const [exporting, setExporting] = useState("");
  const [exportError, setExportError] = useState("");
  const frontRef = useRef(null);
  const backRef = useRef(null);

  if (loading) {
    return (
      <div className="idcard-wrap">
        <div className="idcard idcard-loading" role="status" aria-label="Loading identity card">
          <div className="idcard-skeleton" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const citizenId = profile.citizenId;
  const verificationUrl = citizenId ? getVerificationUrl(citizenId) : "";
  const issueDate = new Date();

  const handlePrint = () => {
    window.print();
    onReissue?.();
  };

  const exportPdf = async () => {
    if (!citizenId) return;
    setExportError("");
    setExporting("pdf");

    // html2canvas can't capture an element with display:none (zero layout
    // box), and only one face is ever visible at a time (front/back tabs).
    // Force both visible for the capture, then restore whichever the user
    // actually had selected — this bug surfaced during Phase 3 testing when
    // exporting a PDF while "Back" was the active tab produced a corrupt
    // (zero-size) front-page image.
    const frontEl = frontRef.current;
    const backEl = backRef.current;
    const frontPrevDisplay = frontEl?.style.display;
    const backPrevDisplay = backEl?.style.display;

    try {
      if (frontEl) frontEl.style.display = "flex";
      if (backEl) backEl.style.display = "flex";

      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1013, 638] });

      const frontCanvas = await captureSide(frontEl);
      pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 0, 0, 1013, 638);

      if (backEl) {
        pdf.addPage([1013, 638], "landscape");
        const backCanvas = await captureSide(backEl);
        pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 0, 0, 1013, 638);
      }

      pdf.save(`Congo-Unity-ID-${citizenId}.pdf`);
      onReissue?.();
    } catch (err) {
      console.error("Failed to export card as PDF:", err);
      setExportError("Couldn't generate the PDF. Please try again.");
    } finally {
      if (frontEl) frontEl.style.display = frontPrevDisplay;
      if (backEl) backEl.style.display = backPrevDisplay;
      setExporting("");
    }
  };

  const exportPng = async () => {
    if (!citizenId) return;
    setExportError("");
    setExporting("png");

    try {
      const node = side === "front" ? frontRef.current : backRef.current;
      const canvas = await captureSide(node);

      const link = document.createElement("a");
      link.download = `Congo-Unity-ID-${citizenId}-${side}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      onReissue?.();
    } catch (err) {
      console.error("Failed to export card as PNG:", err);
      setExportError("Couldn't generate the PNG. Please try again.");
    } finally {
      setExporting("");
    }
  };

  return (
    <div className="idcard-wrap">
      <div className="idcard-tabs" role="tablist" aria-label="Card side">
        <button
          type="button"
          role="tab"
          aria-selected={side === "front"}
          className={side === "front" ? "idcard-tab idcard-tab-active" : "idcard-tab"}
          onClick={() => setSide("front")}
        >
          Front
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={side === "back"}
          className={side === "back" ? "idcard-tab idcard-tab-active" : "idcard-tab"}
          onClick={() => setSide("back")}
        >
          Back
        </button>
      </div>

      <div className="idcard-stage">
        <div ref={frontRef} className="idcard" style={{ display: side === "front" ? "flex" : "none" }} aria-hidden={side !== "front"}>
          <div className="idcard-header">
            <span className="idcard-logo">🇨🇩 Congo Unity</span>
            <span className="idcard-subtitle">National Digital Identity</span>
          </div>

          <div className="idcard-body">
            <Avatar src={profile.profileImageUrl} alt={`${profile.firstName} ${profile.lastName}`} className="idcard-photo" />

            <div className="idcard-details">
              <h3 className="idcard-name">
                {profile.preferredName || profile.firstName} {profile.lastName}
              </h3>
              <VerificationBadge status={profile.status} />

              <dl className="idcard-fields">
                <div>
                  <dt>Citizen ID</dt>
                  <dd>{citizenId || "—"}</dd>
                </div>
                <div>
                  <dt>Member Number</dt>
                  <dd>{profile.memberNumber || "—"}</dd>
                </div>
                <div>
                  <dt>Nationality</dt>
                  <dd>{profile.nationality || "—"}</dd>
                </div>
                <div>
                  <dt>Member Since</dt>
                  <dd>{formatDate(profile.registrationDate)}</dd>
                </div>
              </dl>
            </div>

            {verificationUrl && (
              <div className="idcard-qr">
                <QRCodeDisplay value={verificationUrl} size={200} />
              </div>
            )}
          </div>

          <div className="idcard-footer">
            <span>Issued {formatDate(issueDate)}</span>
            <span>congounity.org</span>
          </div>
        </div>

        <div ref={backRef} className="idcard idcard-back" style={{ display: side === "back" ? "flex" : "none" }} aria-hidden={side !== "back"}>
          <div className="idcard-header">
            <span className="idcard-logo">🇨🇩 Congo Unity</span>
            <span className="idcard-subtitle">National Digital Identity</span>
          </div>

          <div className="idcard-back-body">
            <dl className="idcard-fields">
              <div>
                <dt>Current Country</dt>
                <dd>{profile.currentCountry || "—"}</dd>
              </div>
              <div>
                <dt>Province of Origin</dt>
                <dd>{profile.province || "—"}</dd>
              </div>
              <div>
                <dt>Emergency Contact</dt>
                <dd>{profile.emergencyContact || "—"}</dd>
              </div>
              <div>
                <dt>Verification Status</dt>
                <dd><VerificationBadge status={profile.status} /></dd>
              </div>
              <div>
                <dt>Verification Date</dt>
                <dd>{profile.status === "verified" ? formatDate(profile.verifiedAt) : "—"}</dd>
              </div>
            </dl>

            <div className="idcard-back-right">
              {verificationUrl && (
                <div className="idcard-qr">
                  <QRCodeDisplay value={verificationUrl} size={180} />
                </div>
              )}
              <p className="idcard-url">{verificationUrl || "Citizen ID not yet issued"}</p>
            </div>
          </div>

          <p className="idcard-privacy">
            This card confirms Congo Unity membership only. It is not a government-issued travel or identity
            document. Verify at {verificationUrl || "congounity.org/verify"}.
          </p>

          <div className="idcard-footer">
            <span>Issued {formatDate(issueDate)}</span>
            <span>congounity.org</span>
          </div>
        </div>
      </div>

      {exportError && <p className="register-form__error idcard-no-print" role="alert">{exportError}</p>}

      <div className="idcard-actions idcard-no-print">
        <button type="button" onClick={handlePrint} disabled={!citizenId}>Print Card</button>
        <button type="button" onClick={exportPdf} disabled={!citizenId || exporting !== ""}>
          {exporting === "pdf" ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button type="button" onClick={exportPng} disabled={!citizenId || exporting !== ""}>
          {exporting === "png" ? "Preparing PNG…" : "Download PNG"}
        </button>
      </div>
    </div>
  );
}

export default DigitalIdentityCard;
