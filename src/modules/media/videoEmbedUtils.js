// src/modules/media/videoEmbedUtils.js

/**
 * Normaliza una URL de YouTube o Vimeo a su forma embebible.
 * Acepta watch?v=, youtu.be/, /embed/ ya listo, vimeo.com/ID o player.vimeo.com ya listo.
 * Si no reconoce el formato, devuelve la URL tal cual (se asume ya embebible).
 */
export function toEmbedUrl(url) {
  if (!url) return null;

  try {
    const u = new URL(url);

    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      const videoId = u.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      return url;
    }

    if (u.hostname === "youtu.be") {
      const videoId = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (u.hostname.includes("vimeo.com")) {
      if (u.hostname.startsWith("player.")) return url;
      const videoId = u.pathname.split("/").filter(Boolean).pop();
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
      return url;
    }

    return url;
  } catch {
    return url;
  }
}
