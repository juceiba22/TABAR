// src/modules/media/VideoEmbed.jsx
import { useEffect, useState } from "react";
import { toEmbedUrl } from "./videoEmbedUtils";
import "./videoEmbed.css";

/**
 * Tarjeta de video reusable: si `videoUrl` está cargada muestra un botón de
 * play que abre un modal con el embed (YouTube/Vimeo). Si no, muestra un
 * placeholder "Video próximamente" sin romper el layout.
 */
export default function VideoEmbed({ videoUrl, title, icon = "🎬", accentColor = "#E3B64F" }) {
  const [open, setOpen] = useState(false);
  const embedUrl = toEmbedUrl(videoUrl);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`ve-trigger${embedUrl ? "" : " ve-trigger--empty"}`}
        style={{ "--ve-accent": accentColor }}
        onClick={() => embedUrl && setOpen(true)}
        disabled={!embedUrl}
        aria-label={embedUrl ? `Reproducir video: ${title}` : `Video de ${title} próximamente`}
      >
        {embedUrl ? (
          <span className="ve-play">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 2.5L15 9L4 15.5V2.5Z" fill="currentColor" />
            </svg>
          </span>
        ) : (
          <span className="ve-icon" aria-hidden="true">{icon}</span>
        )}
        <span className="ve-trigger-text">
          {embedUrl ? "Ver video" : "Video próximamente"}
        </span>
      </button>

      {open && embedUrl && (
        <div className="ve-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="ve-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ve-modal-close" onClick={() => setOpen(false)} aria-label="Cerrar video">
              ✕
            </button>
            <div className="ve-modal-frame">
              <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                frameBorder="0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
