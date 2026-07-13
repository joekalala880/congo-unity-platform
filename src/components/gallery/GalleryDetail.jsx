import { useEffect } from "react";
import { resolveGalleryImage } from "../../pages/galleryLocalImages";

function GalleryDetail({ item, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const lifespan = item.birthDate
    ? `${item.birthDate}${item.deathDate ? ` – ${item.deathDate}` : ""}`
    : null;

  const location = [item.city, item.province, item.country]
    .filter(Boolean)
    .join(", ");

  const hasMediaLinks =
    item.audioUrl || item.spotifyUrl || item.youtubeUrl || item.websiteUrl;

  return (
    <div className="cg-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cg-modal"
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="cg-modal-close"
          onClick={onClose}
          autoFocus
          aria-label="Close"
        >
          ✕
        </button>

        <img src={resolveGalleryImage(item)} alt={item.name} />

        <div className="cg-modal-body">
          <span className="cg-card-category">
            {item.category}
            {item.subcategory ? ` · ${item.subcategory}` : ""}
          </span>

          <h2>{item.name}</h2>

          {lifespan && (
            <p className="cg-modal-meta">
              <strong>{item.deathDate ? "Lived" : "Born"}:</strong> {lifespan}
              {item.birthplace ? ` — ${item.birthplace}` : ""}
            </p>
          )}

          {location && (
            <p className="cg-modal-meta">
              <strong>Location:</strong> {location}
            </p>
          )}

          <p>{item.fullBiography || item.shortDescription}</p>

          {hasMediaLinks && (
            <div className="cg-modal-links">
              {/* No autoplay — a click always has to happen first. */}
              {item.audioUrl && (
                <audio controls className="cg-modal-audio" src={item.audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              )}

              {item.spotifyUrl && (
                <a
                  className="cg-modal-link"
                  href={item.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Listen on Spotify
                </a>
              )}

              {item.youtubeUrl && (
                <a
                  className="cg-modal-link"
                  href={item.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Watch on YouTube
                </a>
              )}

              {item.websiteUrl && (
                <a
                  className="cg-modal-link"
                  href={item.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Official Website
                </a>
              )}
            </div>
          )}

          {item.publishedDate && (
            <p className="cg-modal-meta">
              <strong>Published:</strong> {item.publishedDate}
            </p>
          )}

          {item.sourceUrl && (
            <a
              className="cg-modal-source"
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {item.sourceName || "View source"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default GalleryDetail;
