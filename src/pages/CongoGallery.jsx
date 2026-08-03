import { useEffect, useMemo, useState } from "react";
import "./CongoGallery.css";

import useDebouncedValue from "../hooks/useDebouncedValue";
import useIsAdmin from "../hooks/useIsAdmin";
import GalleryCard from "../components/gallery/GalleryCard";
import GalleryDetail from "../components/gallery/GalleryDetail";
import {
  fetchGalleryPage,
  fetchAllForSearch,
  matchesSearchTerm,
  seedInitialGalleryItems,
} from "../services/galleryService";
import SEED_ITEMS from "./gallerySeedData";
import { CATEGORIES as GALLERY_CATEGORIES } from "./galleryCategories";

const CATEGORIES = ["All", ...GALLERY_CATEGORIES];

function CongoGallery() {
  const { isAdmin } = useIsAdmin();

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const isSearching = debouncedSearch.trim().length > 0;

  const [browseItems, setBrowseItems] = useState([]);
  const [browseCursor, setBrowseCursor] = useState(null);
  const [browseHasMore, setBrowseHasMore] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [seeding, setSeeding] = useState(false);

  // Browse mode: fetch a fresh page whenever the category changes or the
  // search box is empty.
  useEffect(() => {
    if (isSearching) return;

    let cancelled = false;

    const loadFirstPage = async () => {
      setLoading(true);
      setError(null);

      try {
        const { items, nextCursor } = await fetchGalleryPage({
          category: activeCategory,
        });

        if (cancelled) return;
        setBrowseItems(items);
        setBrowseCursor(nextCursor);
        setBrowseHasMore(Boolean(nextCursor));
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError("We couldn't load the gallery right now. Please try again shortly.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFirstPage();

    return () => {
      cancelled = true;
    };
  }, [activeCategory, isSearching]);

  // Search mode: one broader fetch, then filter in memory so results
  // aren't limited to whatever page happened to be loaded already.
  useEffect(() => {
    if (!isSearching) return;

    let cancelled = false;

    const loadForSearch = async () => {
      setLoading(true);
      setError(null);

      try {
        const items = await fetchAllForSearch();
        if (cancelled) return;
        setSearchResults(items);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError("We couldn't search the gallery right now. Please try again shortly.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadForSearch();

    return () => {
      cancelled = true;
    };
  }, [isSearching]);

  const visibleItems = useMemo(() => {
    if (!isSearching) return browseItems;

    const term = debouncedSearch.trim().toLowerCase();

    return searchResults.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      return matchesCategory && matchesSearchTerm(item, term);
    });
  }, [isSearching, browseItems, searchResults, activeCategory, debouncedSearch]);

  const loadMore = async () => {
    if (!browseCursor) return;

    setLoadingMore(true);

    try {
      const { items, nextCursor } = await fetchGalleryPage({
        category: activeCategory,
        cursor: browseCursor,
      });

      setBrowseItems((prev) => [...prev, ...items]);
      setBrowseCursor(nextCursor);
      setBrowseHasMore(Boolean(nextCursor));
    } catch (err) {
      console.error(err);
      setError("We couldn't load more items right now. Please try again shortly.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);

    try {
      await seedInitialGalleryItems(SEED_ITEMS);

      const { items, nextCursor } = await fetchGalleryPage({
        category: activeCategory,
      });

      setBrowseItems(items);
      setBrowseCursor(nextCursor);
      setBrowseHasMore(Boolean(nextCursor));
    } catch (err) {
      console.error(err);
      setError("Seeding failed. Please try again.");
    } finally {
      setSeeding(false);
    }
  };

  const showSeedButton =
    isAdmin &&
    !loading &&
    !isSearching &&
    activeCategory === "All" &&
    browseItems.length === 0 &&
    !error;

  return (
    <div className="gallery-page">
      <section className="gallery-hero">
        <div className="gallery-overlay">
          <h1>Congo Memory & Influence Gallery</h1>
          <h3>Our people. Our culture. Our memory. Our future.</h3>

          <p>
            A visual space to honor Congolese music, politics, history, cities,
            nature, sports, and the memory of Eastern Congo.
          </p>
        </div>
      </section>

      <section className="cg-section">
        <h2>Explore Congo’s Memory</h2>

        <div className="cg-filters">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={`cg-pill${activeCategory === category ? " active" : ""}`}
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="cg-search">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, alias, city, province..."
            aria-label="Search the gallery"
          />
        </div>

        {loading && <p className="cg-status">Loading gallery...</p>}

        {!loading && error && (
          <p className="cg-status cg-status-error">{error}</p>
        )}

        {!loading && !error && visibleItems.length === 0 && (
          <div className="cg-empty">
            <p>No items yet in this category. Check back soon.</p>

            {showSeedButton && (
              <button
                type="button"
                className="cg-seed-button"
                onClick={handleSeed}
                disabled={seeding}
              >
                {seeding ? "Seeding..." : "Seed initial gallery items (admin, one-time)"}
              </button>
            )}
          </div>
        )}

        {!loading && !error && visibleItems.length > 0 && (
          <>
            <div className="cg-grid">
              {visibleItems.map((item) => (
                <GalleryCard key={item.id} item={item} onOpen={setSelectedItem} />
              ))}
            </div>

            {!isSearching && browseHasMore && (
              <button
                type="button"
                className="cg-load-more"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </section>

      {selectedItem && (
        <GalleryDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

export default CongoGallery;
