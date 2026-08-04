import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAllGalleryItemsForAdmin,
  matchesSearchTerm,
  updateGalleryItem,
  deleteGalleryItem,
  getImportPreview,
  seedInitialGalleryItems,
} from "../services/galleryService";
import { CATEGORIES } from "./galleryCategories";
import { resolveGalleryImage } from "./galleryLocalImages";
import GalleryItemForm from "../components/admin/GalleryItemForm";
import GalleryDetail from "../components/gallery/GalleryDetail";
import SEED_ITEMS from "./gallerySeedData";
import "./AdminGalleryManager.css";

const PAGE_SIZE = 20;

function AdminGalleryManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [formMode, setFormMode] = useState(null); // null | "new" | item object
  const [previewItem, setPreviewItem] = useState(null);
  const [busySlug, setBusySlug] = useState(null);

  const [importPreview, setImportPreview] = useState(null);
  const [checkingImport, setCheckingImport] = useState(false);
  const [importing, setImporting] = useState(false);

  // Callable on demand (after save/delete, or a manual retry) without
  // itself being an effect dependency — see the mount-time effect below,
  // which duplicates this logic inline rather than calling this function,
  // to avoid react-hooks/set-state-in-effect flagging a setState call
  // that's only reachable through a useCallback reference.
  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAllGalleryItemsForAdmin();
      setItems(data);
    } catch (err) {
      console.error("Failed to load gallery items:", err);
      setError("We couldn't load gallery items right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchAllGalleryItemsForAdmin();
        if (!cancelled) setItems(data);
      } catch (err) {
        console.error("Failed to load gallery items:", err);
        if (!cancelled) setError("We couldn't load gallery items right now. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Reset pagination when the filters change — adjusted during render
  // rather than via an effect (same pattern as Avatar.jsx's prevSrc reset).
  const filterKey = `${search}|${categoryFilter}|${statusFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const filtered = items.filter((item) => {
    if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
    if (statusFilter === "active" && item.active === false) return false;
    if (statusFilter === "inactive" && item.active !== false) return false;
    if (search.trim() && !matchesSearchTerm(item, search.trim().toLowerCase())) return false;
    return true;
  });

  const visible = filtered.slice(0, visibleCount);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleSaved = (message) => {
    setFormMode(null);
    loadItems();
    showSuccess(message);
  };

  const toggleField = async (item, field) => {
    setBusySlug(item.slug);
    const nextValue = !(field === "active" ? item.active !== false : item.featured);

    // Optimistic update, rolled back on failure.
    setItems((prev) => prev.map((i) => (i.slug === item.slug ? { ...i, [field]: nextValue } : i)));

    try {
      await updateGalleryItem(item.slug, { [field]: nextValue });
    } catch (err) {
      console.error(`Failed to toggle ${field}:`, err);
      setItems((prev) => prev.map((i) => (i.slug === item.slug ? { ...i, [field]: !nextValue } : i)));
      setError(`Couldn't update "${item.name}". Please try again.`);
    } finally {
      setBusySlug(null);
    }
  };

  const checkImport = async () => {
    setCheckingImport(true);
    setError("");

    try {
      const preview = await getImportPreview(SEED_ITEMS);
      setImportPreview(preview);
    } catch (err) {
      console.error("Failed to check import preview:", err);
      setError("Couldn't check what would be imported. Please try again.");
    } finally {
      setCheckingImport(false);
    }
  };

  const confirmImport = async () => {
    setImporting(true);
    setError("");

    try {
      await seedInitialGalleryItems(SEED_ITEMS);
      setImportPreview(null);
      await loadItems();
      showSuccess(
        `Import complete: ${importPreview.willAdd} item${importPreview.willAdd === 1 ? "" : "s"} added, ${importPreview.willUpdate} updated.`
      );
    } catch (err) {
      console.error("Failed to import gallery data:", err);
      setError("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    setBusySlug(item.slug);

    try {
      await deleteGalleryItem(item.slug);
      setItems((prev) => prev.filter((i) => i.slug !== item.slug));
      showSuccess(`Deleted "${item.name}".`);
    } catch (err) {
      console.error("Failed to delete gallery item:", err);
      setError(`Couldn't delete "${item.name}". Please try again.`);
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <div className="gm-page">
      <div className="gm-header">
        <div>
          <h1>Gallery Manager</h1>
          <p>Add, edit, and manage Congo Memory & Influence Gallery content.</p>
        </div>

        <div className="gm-header-actions">
          <Link to="/admin-cms" className="gm-back-link">← Admin CMS</Link>
          <button type="button" className="gm-import-button" onClick={checkImport} disabled={checkingImport}>
            {checkingImport ? "Checking…" : "Import Existing Gallery Data"}
          </button>
          <button type="button" onClick={() => setFormMode("new")}>Add Item</button>
        </div>
      </div>

      {importPreview && (
        <div className="gm-import-panel">
          <h3>Import Preview</h3>
          <p>This reads every item in <code>gallerySeedData.js</code> and writes it to Firestore, keyed by slug — existing items are updated in place, nothing is duplicated.</p>

          <div className="gm-import-stats">
            <div><strong>{importPreview.total}</strong><span>Total items in gallerySeedData.js</span></div>
            <div><strong>{importPreview.alreadyInFirestore}</strong><span>Already in Firestore</span></div>
            <div><strong>{importPreview.willAdd}</strong><span>Will be added (new)</span></div>
            <div><strong>{importPreview.willUpdate}</strong><span>Will be updated (existing)</span></div>
          </div>

          <div className="gm-import-actions">
            <button type="button" onClick={() => setImportPreview(null)} disabled={importing}>Cancel</button>
            <button type="button" onClick={confirmImport} disabled={importing}>
              {importing ? "Importing…" : "Confirm Import"}
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <p className="register-form__success" role="status">{successMessage}</p>
      )}

      {error && (
        <p className="register-form__error" role="alert">{error}</p>
      )}

      <div className="gm-filters">
        <input
          type="text"
          placeholder="Search by name, alias, keyword…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search gallery items"
        />

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category">
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      {loading ? (
        <p className="cg-status">Loading gallery items...</p>
      ) : filtered.length === 0 ? (
        <div className="gm-empty">
          <p>No gallery items match your filters.</p>
        </div>
      ) : (
        <>
          <p className="gm-count">{filtered.length} item{filtered.length === 1 ? "" : "s"}</p>

          <div className="gm-list">
            {visible.map((item) => (
              <div className="gm-row" key={item.slug}>
                <img src={resolveGalleryImage(item)} alt="" className="gm-row-thumb" />

                <div className="gm-row-body">
                  <div className="gm-row-title">
                    <strong>{item.name}</strong>
                    <span className="gm-row-category">{item.category}{item.subcategory ? ` · ${item.subcategory}` : ""}</span>
                  </div>
                  <p className="gm-row-desc">{item.shortDescription}</p>
                  <div className="gm-row-badges">
                    <span className={`gm-badge ${item.active === false ? "gm-badge-inactive" : "gm-badge-active"}`}>
                      {item.active === false ? "Inactive" : "Active"}
                    </span>
                    {item.featured && <span className="gm-badge gm-badge-featured">Featured</span>}
                    {item.verified && <span className="gm-badge gm-badge-verified">Verified</span>}
                  </div>
                </div>

                <div className="gm-row-actions">
                  <button type="button" onClick={() => setPreviewItem(item)}>Preview</button>
                  <button type="button" onClick={() => setFormMode(item)}>Edit</button>
                  <button
                    type="button"
                    onClick={() => toggleField(item, "active")}
                    disabled={busySlug === item.slug}
                  >
                    {item.active === false ? "Activate" : "Deactivate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleField(item, "featured")}
                    disabled={busySlug === item.slug}
                  >
                    {item.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    type="button"
                    className="gm-delete-button"
                    onClick={() => handleDelete(item)}
                    disabled={busySlug === item.slug}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {visibleCount < filtered.length && (
            <button type="button" className="cg-load-more" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Load more
            </button>
          )}
        </>
      )}

      {formMode && (
        <GalleryItemForm
          item={formMode === "new" ? null : formMode}
          onSaved={() => handleSaved(formMode === "new" ? "Item created." : "Item updated.")}
          onCancel={() => setFormMode(null)}
        />
      )}

      {previewItem && (
        <GalleryDetail item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
}

export default AdminGalleryManager;
