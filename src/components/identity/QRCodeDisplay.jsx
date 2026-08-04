import { useEffect, useRef } from "react";
import QRCode from "qrcode";

// Renders a QR code onto a <canvas> from any URL/string — used for the
// Citizen ID verification link (identityService.js's getVerificationUrl)
// on the Profile page and, in a later phase, the printable ID card.
// Regenerated client-side from `value` rather than stored in Firestore,
// so it can never go stale if the underlying URL format ever changes.
function QRCodeDisplay({ value, size = 160, className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#0D0D0D", light: "#FFFFFF" },
    }).catch((err) => console.error("Failed to render QR code:", err));
  }, [value, size]);

  if (!value) return null;

  return <canvas ref={canvasRef} className={className} width={size} height={size} />;
}

export default QRCodeDisplay;
