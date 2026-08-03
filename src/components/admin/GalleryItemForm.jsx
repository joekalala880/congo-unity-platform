import { useRef, useState } from "react";
import { CATEGORIES } from "../../pages/galleryCategories";
import { resolveGalleryImage } from "../../pages/galleryLocalImages";
import { createGalleryItem, updateGalleryItem } from "../../services/galleryService";
import { useGalleryImageUpload } from "../../hooks/useGalleryImageUpload";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCsv(value) {
  return Array.isArray(value) ? value.join(", ") : value || "";
}

function fromCsv(value) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function emptyForm() {
  return {
    name: "",
    slug: "",
    category: "",
    subcategory: "",
    shortDescription: "",
    fullBiography: "",
    aliases: "",
    keywords: "",
    featured: false,
    verified: false,
    active: true,
    birthDate: "",
    deathDate: "",
    birthplace: "",
    languages: "",
    province: "",
    city: "",
    country: "",
    imageUrl: "",
    localImageKey: "",
    audioUrl: "",
    spotifyUrl: "",
    youtubeUrl: "",
    websiteUrl: "",
    sourceUrl: "",
    sourceName: "",
    publishedDate: "",
  };
}

function formFromItem(item) {
  const base = emptyForm();
  return {
    ...base,
    ...item,
    aliases: toCsv(item.aliases),
    keywords: toCsv(item.keywords),
    languages: toCsv(item.languages),
    featured: Boolean(item.featured),
    verified: Boolean(item.verified),
    active: item.active !== false,
  };
}

function GalleryItemForm({ item, onSaved, onCancel }) {
  const isEditing = Boolean(item);
  const [form, setForm] = useState(() => (item ? formFromItem(item) : emptyForm()));
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const slugTouchedRef = useRef(isEditing);
  const image = useGalleryImageUpload();

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugTouchedRef.current ? prev.slug : slugify(name),
    }));
  };

  const handleSlugChange = (e) => {
    slugTouchedRef.current = true;
    setField("slug", slugify(e.target.value));
  };

  const removeImage = () => {
    image.removeFile();
    setField("imageUrl", "");
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.slug.trim()) errors.slug = "Slug is required.";
    if (!form.category) errors.category = "Category is required.";
    if (!CATEGORIES.includes(form.category)) errors.category = "Choose a valid category.";
    if (!form.shortDescription.trim()) errors.shortDescription = "Short description is required.";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate();
    setFieldErrors(errors);
    setSubmitError("");

    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);

    try {
      let imageUrl = form.imageUrl;

      if (image.file) {
        imageUrl = await image.uploadImage();
      }

      const payload = {
        name: form.name.trim(),
        category: form.category,
        subcategory: form.subcategory.trim(),
        shortDescription: form.shortDescription.trim(),
        fullBiography: form.fullBiography.trim(),
        aliases: fromCsv(form.aliases),
        keywords: fromCsv(form.keywords),
        featured: form.featured,
        verified: form.verified,
        active: form.active,
        birthDate: form.birthDate,
        deathDate: form.deathDate,
        birthplace: form.birthplace.trim(),
        languages: fromCsv(form.languages),
        province: form.province.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        imageUrl,
        localImageKey: form.localImageKey.trim(),
        audioUrl: form.audioUrl.trim(),
        spotifyUrl: form.spotifyUrl.trim(),
        youtubeUrl: form.youtubeUrl.trim(),
        websiteUrl: form.websiteUrl.trim(),
        sourceUrl: form.sourceUrl.trim(),
        sourceName: form.sourceName.trim(),
        publishedDate: form.publishedDate,
      };

      if (isEditing) {
        await updateGalleryItem(item.slug, payload);
      } else {
        await createGalleryItem(form.slug, payload);
      }

      onSaved();
    } catch (error) {
      console.error("Failed to save gallery item:", error);
      setSubmitError(error?.message || "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const previewSrc = image.previewUrl || (form.imageUrl ? resolveGalleryImage({ imageUrl: form.imageUrl }) : "");

  return (
    <div className="gm-form-backdrop" role="presentation">
      <div className="gm-form-panel" role="dialog" aria-modal="true" aria-label={isEditing ? "Edit gallery item" : "Add gallery item"}>
        <div className="gm-form-header">
          <h2>{isEditing ? `Edit: ${item.name}` : "Add Gallery Item"}</h2>
          <button type="button" className="gm-form-close" onClick={onCancel} aria-label="Close">✕</button>
        </div>

        <form className="gm-form" onSubmit={handleSubmit}>
          {submitError && (
            <p className="register-form__error" role="alert">{submitError}</p>
          )}

          <fieldset className="gm-fieldset">
            <legend>Basics</legend>

            <label htmlFor="gm-name">Name *</label>
            <input id="gm-name" value={form.name} onChange={handleNameChange} placeholder="Full name / title" />
            {fieldErrors.name && <p className="gm-field-error">{fieldErrors.name}</p>}

            <label htmlFor="gm-slug">Slug *</label>
            <input
              id="gm-slug"
              value={form.slug}
              onChange={handleSlugChange}
              placeholder="auto-generated-from-name"
              disabled={isEditing}
            />
            {isEditing && <p className="gm-field-hint">Slug can't be changed after creation.</p>}
            {fieldErrors.slug && <p className="gm-field-error">{fieldErrors.slug}</p>}

            <label htmlFor="gm-category">Category *</label>
            <select id="gm-category" value={form.category} onChange={(e) => setField("category", e.target.value)}>
              <option value="">Choose a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {fieldErrors.category && <p className="gm-field-error">{fieldErrors.category}</p>}

            <label htmlFor="gm-subcategory">Subcategory</label>
            <input id="gm-subcategory" value={form.subcategory} onChange={(e) => setField("subcategory", e.target.value)} placeholder="e.g. Achievements" />

            <label htmlFor="gm-short">Short Description *</label>
            <textarea id="gm-short" value={form.shortDescription} onChange={(e) => setField("shortDescription", e.target.value)} placeholder="One or two sentences shown on the card" />
            {fieldErrors.shortDescription && <p className="gm-field-error">{fieldErrors.shortDescription}</p>}

            <label htmlFor="gm-full">Full Biography / Description</label>
            <textarea id="gm-full" value={form.fullBiography} onChange={(e) => setField("fullBiography", e.target.value)} placeholder="Shown in the detail view" />

            <label htmlFor="gm-aliases">Aliases (comma-separated)</label>
            <input id="gm-aliases" value={form.aliases} onChange={(e) => setField("aliases", e.target.value)} placeholder="Nickname, Stage name" />

            <label htmlFor="gm-keywords">Keywords (comma-separated)</label>
            <input id="gm-keywords" value={form.keywords} onChange={(e) => setField("keywords", e.target.value)} placeholder="musician, singer, rumba" />

            <div className="gm-checkbox-row">
              <label>
                <input type="checkbox" checked={form.featured} onChange={(e) => setField("featured", e.target.checked)} />
                Featured
              </label>
              <label>
                <input type="checkbox" checked={form.verified} onChange={(e) => setField("verified", e.target.checked)} />
                Verified
              </label>
              <label>
                <input type="checkbox" checked={form.active} onChange={(e) => setField("active", e.target.checked)} />
                Active (visible publicly)
              </label>
            </div>
          </fieldset>

          <fieldset className="gm-fieldset">
            <legend>Person details (optional)</legend>

            <label htmlFor="gm-birthdate">Birth Date</label>
            <input id="gm-birthdate" value={form.birthDate} onChange={(e) => setField("birthDate", e.target.value)} placeholder="YYYY-MM-DD" />

            <label htmlFor="gm-deathdate">Death Date</label>
            <input id="gm-deathdate" value={form.deathDate} onChange={(e) => setField("deathDate", e.target.value)} placeholder="YYYY-MM-DD" />

            <label htmlFor="gm-birthplace">Birthplace</label>
            <input id="gm-birthplace" value={form.birthplace} onChange={(e) => setField("birthplace", e.target.value)} />

            <label htmlFor="gm-languages">Languages (comma-separated)</label>
            <input id="gm-languages" value={form.languages} onChange={(e) => setField("languages", e.target.value)} />
          </fieldset>

          <fieldset className="gm-fieldset">
            <legend>Place details (optional)</legend>

            <label htmlFor="gm-province">Province</label>
            <input id="gm-province" value={form.province} onChange={(e) => setField("province", e.target.value)} />

            <label htmlFor="gm-city">City</label>
            <input id="gm-city" value={form.city} onChange={(e) => setField("city", e.target.value)} />

            <label htmlFor="gm-country">Country</label>
            <input id="gm-country" value={form.country} onChange={(e) => setField("country", e.target.value)} />
          </fieldset>

          <fieldset className="gm-fieldset">
            <legend>Media</legend>

            <div className="gm-image-field">
              {previewSrc && (
                <img src={previewSrc} alt="" className="gm-image-preview" />
              )}

              <div className="gm-image-controls">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => image.selectFile(e.target.files[0])}
                  disabled={isSaving}
                />

                {(form.imageUrl || image.file) && (
                  <button type="button" onClick={removeImage} disabled={isSaving}>Remove image</button>
                )}

                {image.isUploading && <p className="gm-field-hint">Uploading… {image.uploadProgress}%</p>}
                {image.error && <p className="gm-field-error">{image.error}</p>}
              </div>
            </div>

            <label htmlFor="gm-imageurl">Image URL</label>
            <input id="gm-imageurl" value={form.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} placeholder="https://…  (filled automatically after upload)" />

            <label htmlFor="gm-localimagekey">Local Image Key (advanced)</label>
            <input id="gm-localimagekey" value={form.localImageKey} onChange={(e) => setField("localImageKey", e.target.value)} placeholder="Key into src/pages/galleryLocalImages.js" />

            <label htmlFor="gm-audio">Audio URL</label>
            <input id="gm-audio" value={form.audioUrl} onChange={(e) => setField("audioUrl", e.target.value)} />

            <label htmlFor="gm-spotify">Spotify URL</label>
            <input id="gm-spotify" value={form.spotifyUrl} onChange={(e) => setField("spotifyUrl", e.target.value)} />

            <label htmlFor="gm-youtube">YouTube URL</label>
            <input id="gm-youtube" value={form.youtubeUrl} onChange={(e) => setField("youtubeUrl", e.target.value)} />

            <label htmlFor="gm-website">Website URL</label>
            <input id="gm-website" value={form.websiteUrl} onChange={(e) => setField("websiteUrl", e.target.value)} />
          </fieldset>

          <fieldset className="gm-fieldset">
            <legend>Source (optional)</legend>

            <label htmlFor="gm-sourceurl">Source URL</label>
            <input id="gm-sourceurl" value={form.sourceUrl} onChange={(e) => setField("sourceUrl", e.target.value)} />

            <label htmlFor="gm-sourcename">Source Name</label>
            <input id="gm-sourcename" value={form.sourceName} onChange={(e) => setField("sourceName", e.target.value)} />

            <label htmlFor="gm-publisheddate">Published Date</label>
            <input id="gm-publisheddate" value={form.publishedDate} onChange={(e) => setField("publishedDate", e.target.value)} placeholder="YYYY-MM-DD" />
          </fieldset>

          <div className="gm-form-actions">
            <button type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
            <button type="submit" disabled={isSaving || image.isUploading}>
              {isSaving ? "Saving…" : image.isUploading ? `Uploading… ${image.uploadProgress}%` : isEditing ? "Save Changes" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GalleryItemForm;
