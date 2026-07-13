import fally from "../galery photo/fally.jpeg";
import koffi from "../galery photo/koffi Olomide.jpeg";
import franco from "../galery photo/franco luambo.jpg";
import kabila from "../galery photo/Joseph kabila.webp";
import flag from "../galery photo/FlagCongo.webp";
import kinshasa from "../galery photo/congp-730x410.jpg";
import boulevard from "../galery photo/Boulevard-du-30-Juin-street-Kinshasa-Democratic.webp";
import eastCongo from "../galery photo/DR Congo hero.avif";

// Maps a gallery document's `localImageKey` to a bundled local image.
// These keys are seeded alongside the original 8 items; anything added
// later can use `imageUrl` instead without needing an entry here.
const localImages = {
  "fally-ipupa": fally,
  "koffi-olomide": koffi,
  "franco-luambo": franco,
  "joseph-kabila": kabila,
  "flag-of-the-drc": flag,
  kinshasa: kinshasa,
  "boulevard-du-30-juin": boulevard,
  "eastern-congo": eastCongo,
};

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%231b1b1b'/%3E%3Ctext x='50%25' y='50%25' fill='%23d9a441' font-family='sans-serif' font-size='16' text-anchor='middle' dominant-baseline='middle'%3EImage coming soon%3C/text%3E%3C/svg%3E";

// Resolution order: an admin-provided imageUrl wins (Phase 4 uploads or
// licensed external images), then a bundled local photo, then a neutral
// placeholder — never a broken image icon.
export function resolveGalleryImage(item) {
  if (item.imageUrl) return item.imageUrl;
  if (item.localImageKey && localImages[item.localImageKey]) {
    return localImages[item.localImageKey];
  }
  return PLACEHOLDER_IMAGE;
}

export default localImages;
