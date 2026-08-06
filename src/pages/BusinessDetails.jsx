import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import VerificationBadge from "../components/identity/VerificationBadge";
import { getBusiness } from "../services/businessesService";
import {
  averageRating,
  deleteReview,
  editReview,
  getMyReview,
  listReviewsForBusiness,
  respondToReview,
  submitReview,
} from "../services/businessReviewsService";
import { BUSINESS_REPORT_REASONS } from "../services/businessTypes";
import "./BusinessDetails.css";

function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Stars({ rating }) {
  return <span className="bizdet-stars">{"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}</span>;
}

function BusinessDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedItemId, setSavedItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBusiness(id);
      setBusiness(data);

      if (data) {
        const reviewList = await listReviewsForBusiness(id);
        setReviews(reviewList);

        const ownerSnap = await getDocs(
          query(collection(db, "congoleseProfiles"), where("userId", "==", data.ownerUserId))
        );
        if (!ownerSnap.empty) setOwnerProfile(ownerSnap.docs[0].data());

        if (auth.currentUser) {
          const existingReview = await getMyReview(id, auth.currentUser.uid);
          setMyReview(existingReview);
          if (existingReview) {
            setReviewRating(existingReview.rating);
            setReviewComment(existingReview.comment);
          }

          const savedSnap = await getDocs(
            query(
              collection(db, "savedItems"),
              where("userEmail", "==", auth.currentUser.email),
              where("type", "==", "business"),
              where("businessId", "==", id)
            )
          );
          const activeSaved = savedSnap.docs.find((d) => d.data().removed !== true);
          if (activeSaved) {
            setIsSaved(true);
            setSavedItemId(activeSaved.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load business:", err);
      setError("We couldn't load this business right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      await loadAll();
    })();
  }, [loadAll, user]);

  const toggleSave = async () => {
    if (!user) {
      alert("Please log in to save businesses.");
      return;
    }

    try {
      if (isSaved && savedItemId) {
        await updateDoc(doc(db, "savedItems", savedItemId), { removed: true });
        setIsSaved(false);
        setSavedItemId(null);
      } else {
        const ref = await addDoc(collection(db, "savedItems"), {
          userEmail: user.email,
          type: "business",
          businessId: id,
          title: business.businessName,
          description: `${business.category} · ${business.city || ""}`,
          link: `/businesses/${id}`,
          removed: false,
          createdAt: serverTimestamp(),
        });
        setIsSaved(true);
        setSavedItemId(ref.id);
      }
    } catch (err) {
      console.error("Failed to save/unsave business:", err);
    }
  };

  const handleReport = async () => {
    if (!user) {
      alert("Please log in to report a business.");
      return;
    }

    const reasonInput = window.prompt(
      `Why are you reporting this business? Enter one of: ${BUSINESS_REPORT_REASONS.map((r) => r.value).join(", ")}`
    );
    if (reasonInput === null) return;

    const reason = BUSINESS_REPORT_REASONS.find((r) => r.value === reasonInput.trim().toLowerCase())?.value || "other";
    const message = window.prompt("Any additional details? (optional)") || "";

    try {
      await addDoc(collection(db, "businessReports"), {
        targetType: "business",
        businessId: id,
        reviewId: null,
        reporterId: user.uid,
        reporterEmail: user.email,
        reason,
        message,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Thanks — this business has been reported to our admin team.");
    } catch (err) {
      console.error("Failed to report business:", err);
      alert("Couldn't submit your report. Please try again.");
    }
  };

  const handleReportReview = async (review) => {
    if (!user) {
      alert("Please log in to report a review.");
      return;
    }

    if (!window.confirm("Report this review as abusive?")) return;

    try {
      await addDoc(collection(db, "businessReports"), {
        targetType: "review",
        businessId: id,
        reviewId: review.id,
        reporterId: user.uid,
        reporterEmail: user.email,
        reason: "harassment",
        message: `Reported review by ${review.userEmail}: "${review.comment}"`,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Thanks — this review has been reported to our admin team.");
    } catch (err) {
      console.error("Failed to report review:", err);
      alert("Couldn't submit your report. Please try again.");
    }
  };

  const handleSubmitReview = async () => {
    setReviewBusy(true);
    setError("");
    try {
      if (myReview) {
        await editReview(business, myReview.id, reviewRating, reviewComment);
      } else {
        await submitReview(user, business, { rating: reviewRating, comment: reviewComment });
      }
      await loadAll();
    } catch (err) {
      console.error("Failed to submit review:", err);
      setError(err.message || "Couldn't submit your review. Please try again.");
    } finally {
      setReviewBusy(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm("Delete your review?")) return;

    setReviewBusy(true);
    try {
      await deleteReview(business, myReview.id);
      setMyReview(null);
      setReviewRating(5);
      setReviewComment("");
      await loadAll();
    } catch (err) {
      console.error("Failed to delete review:", err);
      setError("Couldn't delete your review. Please try again.");
    } finally {
      setReviewBusy(false);
    }
  };

  const handleRespondToReview = async (review) => {
    const response = window.prompt("Your response to this review:", review.ownerResponse || "");
    if (response === null) return;

    try {
      await respondToReview(review.id, response.trim());
      await loadAll();
    } catch (err) {
      console.error("Failed to respond to review:", err);
      setError("Couldn't save your response. Please try again.");
    }
  };

  if (loading) {
    return <section className="register-section"><p className="bizdet-loading">Loading business…</p></section>;
  }

  if (error || !business) {
    return (
      <section className="register-section">
        <div className="card">
          <h3>Business not found</h3>
          <p>{error || "This business doesn't exist or is no longer available."}</p>
          <Link to="/businesses"><button>Back to Businesses</button></Link>
        </div>
      </section>
    );
  }

  const isOwner = user && business.ownerUserId === user.uid;
  const isOwnerVerified = ownerProfile?.status === "verified";
  const rating = averageRating(business);

  return (
    <div className="register-section">
      <div className="card bizdet-card">
        {business.coverImageUrl && <img src={business.coverImageUrl} alt="" className="bizdet-cover" />}

        <div className="bizdet-header">
          {business.logoUrl && <img src={business.logoUrl} alt={business.businessName} className="bizdet-logo" />}
          <div>
            <h1>{business.businessName}</h1>
            {business.featured && <span className="businesses-featured-badge">Featured</span>}
            {isOwnerVerified && <span className="businesses-verified-badge">✓ Verified</span>}
          </div>
        </div>

        <p><strong>Category:</strong> {business.category}</p>
        <p><strong>Owner:</strong> {business.ownerName} {ownerProfile && <VerificationBadge status={ownerProfile.status} />}</p>
        {business.reviewCount > 0 && (
          <p><Stars rating={rating} /> {rating.toFixed(1)} ({business.reviewCount} review{business.reviewCount === 1 ? "" : "s"})</p>
        )}

        <p><strong>Address:</strong> {business.address || "—"}, {business.city} {business.provinceOrState} {business.country} {business.postalCode}</p>
        {business.mapLink && <a href={business.mapLink} target="_blank" rel="noreferrer">View on map</a>}

        {business.phone && <p><strong>Phone:</strong> <a href={`tel:${business.phone}`}>{business.phone}</a></p>}
        {business.email && <p><strong>Email:</strong> <a href={`mailto:${business.email}`}>{business.email}</a></p>}
        {business.website && <p><strong>Website:</strong> <a href={business.website} target="_blank" rel="noreferrer">{business.website}</a></p>}

        {business.openingHours && <p><strong>Hours:</strong> {business.openingHours}</p>}
        {business.priceRange && <p><strong>Price Range:</strong> {business.priceRange}</p>}
        {business.languages && <p><strong>Languages:</strong> {business.languages}</p>}
        {business.services && <p><strong>Services:</strong> {business.services}</p>}
        {business.socialLinks && <p><strong>Social:</strong> {business.socialLinks}</p>}
        {business.accessibilityInfo && <p><strong>Accessibility:</strong> {business.accessibilityInfo}</p>}

        <h3>About</h3>
        <p className="bizdet-description">{business.fullDescription || business.shortDescription}</p>

        <div className="bizdet-actions">
          <button type="button" onClick={toggleSave}>{isSaved ? "★ Saved" : "☆ Save"}</button>
          <button
            type="button"
            onClick={() => navigator.share ? navigator.share({ title: business.businessName, url: window.location.href }) : navigator.clipboard.writeText(window.location.href)}
          >
            Share
          </button>
          {user && !isOwner && <button type="button" onClick={handleReport}>Report Business</button>}
          {isOwner && <Link to={`/businesses/${id}/edit`}><button type="button">Edit Business</button></Link>}
          <Link to="/businesses"><button type="button">Back to Businesses</button></Link>
        </div>

        <h3>Reviews</h3>
        {error && <p className="register-form__error" role="alert">{error}</p>}

        {user && !isOwner && (
          <div className="bizdet-review-form">
            <label>
              <span>Your Rating</span>
              <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>)}
              </select>
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience…"
            />
            <div className="bizdet-review-form-actions">
              <button type="button" onClick={handleSubmitReview} disabled={reviewBusy}>
                {reviewBusy ? "Saving…" : myReview ? "Update Review" : "Submit Review"}
              </button>
              {myReview && (
                <button type="button" onClick={handleDeleteReview} disabled={reviewBusy}>Delete Review</button>
              )}
            </div>
          </div>
        )}

        {isOwner && <p className="bizdet-owner-note">You can't review your own business.</p>}

        {reviews.length === 0 ? (
          <p className="bizdet-empty">No reviews yet.</p>
        ) : (
          <div className="bizdet-reviews-list">
            {reviews.map((review) => (
              <div className="bizdet-review" key={review.id}>
                <div className="bizdet-review-top">
                  <strong>{review.userName}</strong>
                  <Stars rating={review.rating} />
                  <span className="bizdet-review-date">{formatDate(review.createdAt)}</span>
                </div>
                {review.comment && <p>{review.comment}</p>}
                {review.ownerResponse && (
                  <p className="bizdet-owner-response"><strong>Owner response:</strong> {review.ownerResponse}</p>
                )}
                <div className="bizdet-review-actions">
                  {isOwner && (
                    <button type="button" onClick={() => handleRespondToReview(review)}>
                      {review.ownerResponse ? "Edit Response" : "Respond"}
                    </button>
                  )}
                  {user && review.userId !== user.uid && (
                    <button type="button" onClick={() => handleReportReview(review)}>Report</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BusinessDetails;
