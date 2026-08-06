import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useBusinessImageUpload } from "../hooks/useBusinessImageUpload";
import { closeBusiness, getBusiness, submitForApproval, updateBusinessContent } from "../services/businessesService";
import { BUSINESS_CATEGORIES, BUSINESS_STATUS_LABELS, PRICE_RANGES, businessStatusBadgeSuffix } from "../services/businessTypes";
import "./CreateBusiness.css";

function EditBusiness() {
  const { businessId } = useParams();
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const logo = useBusinessImageUpload("logo");
  const cover = useBusinessImageUpload("cover");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const data = await getBusiness(businessId);
        setBusiness(data);
        if (data) {
          setFields({
            businessName: data.businessName || "",
            ownerName: data.ownerName || "",
            category: data.category || BUSINESS_CATEGORIES[0],
            shortDescription: data.shortDescription || "",
            fullDescription: data.fullDescription || "",
            phone: data.phone || "",
            email: data.email || "",
            website: data.website || "",
            address: data.address || "",
            city: data.city || "",
            provinceOrState: data.provinceOrState || "",
            country: data.country || "",
            postalCode: data.postalCode || "",
            mapLink: data.mapLink || "",
            openingHours: data.openingHours || "",
            languages: data.languages || "",
            services: data.services || "",
            priceRange: data.priceRange || "",
            socialLinks: data.socialLinks || "",
            accessibilityInfo: data.accessibilityInfo || "",
          });
        }
      } catch (err) {
        console.error("Failed to load business:", err);
        setError("We couldn't load this business. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [businessId]);

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!fields.businessName.trim() || !fields.shortDescription.trim()) {
      setError("Business name and short description are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      let logoUrl = business.logoUrl || "";
      let coverImageUrl = business.coverImageUrl || "";
      if (logo.file) logoUrl = await logo.uploadImage(user.uid);
      if (cover.file) coverImageUrl = await cover.uploadImage(user.uid);

      await updateBusinessContent(businessId, { ...fields, logoUrl, coverImageUrl });
      setBusiness((prev) => ({ ...prev, ...fields, logoUrl, coverImageUrl }));
      setSuccessMessage("Business updated.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Failed to update business:", err);
      setError(err.message || "Couldn't update this business. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      await submitForApproval(businessId);
      setBusiness((prev) => ({ ...prev, status: "pending_approval" }));
    } catch (err) {
      console.error("Failed to submit for approval:", err);
      setError("Couldn't submit this business for approval. Please try again.");
    }
  };

  const handleClose = async () => {
    if (!window.confirm("Close this business listing? It will no longer be publicly visible.")) return;

    try {
      await closeBusiness(businessId);
      setBusiness((prev) => ({ ...prev, status: "closed" }));
    } catch (err) {
      console.error("Failed to close business:", err);
      setError("Couldn't close this business. Please try again.");
    }
  };

  if (loading) {
    return <section className="register-section"><p>Loading…</p></section>;
  }

  if (!user || !business || business.ownerUserId !== user.uid) {
    return (
      <section className="register-section">
        <div className="card">
          <h3>Business not found</h3>
          <p>This business doesn't exist or isn't yours to edit.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Edit Business</h1>
        <span className={`bizowner-badge bizowner-badge-${businessStatusBadgeSuffix(business.status)}`}>
          {BUSINESS_STATUS_LABELS[business.status] || business.status}
        </span>
      </div>

      {business.status === "rejected" && business.adminMessage && (
        <p className="register-form__error" role="alert">Rejected: {business.adminMessage}</p>
      )}
      {successMessage && <p className="register-form__success" role="status">{successMessage}</p>}
      {error && <p className="register-form__error" role="alert">{error}</p>}

      <form className="register-form createbiz-form" onSubmit={handleSave}>
        <label><span>Business Name</span><input name="businessName" value={fields.businessName} onChange={handleChange} /></label>
        <label><span>Owner Name</span><input name="ownerName" value={fields.ownerName} onChange={handleChange} /></label>

        <label>
          <span>Category</span>
          <select name="category" value={fields.category} onChange={handleChange}>
            {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label><span>Short Description</span><input name="shortDescription" value={fields.shortDescription} onChange={handleChange} /></label>

        <label className="createbiz-full"><span>Full Description</span><textarea name="fullDescription" value={fields.fullDescription} onChange={handleChange} /></label>

        <label><span>Phone</span><input name="phone" value={fields.phone} onChange={handleChange} /></label>
        <label><span>Email</span><input name="email" value={fields.email} onChange={handleChange} /></label>

        <label><span>Website</span><input name="website" value={fields.website} onChange={handleChange} /></label>
        <label><span>Price Range</span>
          <select name="priceRange" value={fields.priceRange} onChange={handleChange}>
            {PRICE_RANGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>

        <label><span>Address</span><input name="address" value={fields.address} onChange={handleChange} /></label>
        <label><span>City</span><input name="city" value={fields.city} onChange={handleChange} /></label>

        <label><span>Province/State</span><input name="provinceOrState" value={fields.provinceOrState} onChange={handleChange} /></label>
        <label><span>Country</span><input name="country" value={fields.country} onChange={handleChange} /></label>

        <label><span>Postal Code</span><input name="postalCode" value={fields.postalCode} onChange={handleChange} /></label>
        <label><span>Map Link</span><input name="mapLink" value={fields.mapLink} onChange={handleChange} /></label>

        <label><span>Opening Hours</span><input name="openingHours" value={fields.openingHours} onChange={handleChange} /></label>
        <label><span>Languages Spoken</span><input name="languages" value={fields.languages} onChange={handleChange} /></label>

        <label className="createbiz-full"><span>Services Offered</span><input name="services" value={fields.services} onChange={handleChange} /></label>
        <label className="createbiz-full"><span>Social Media Links</span><input name="socialLinks" value={fields.socialLinks} onChange={handleChange} /></label>
        <label className="createbiz-full"><span>Accessibility Information</span><input name="accessibilityInfo" value={fields.accessibilityInfo} onChange={handleChange} /></label>

        <label className="createbiz-full">
          <span>Logo</span>
          {business.logoUrl && !logo.previewUrl && <img src={business.logoUrl} alt="Current logo" className="createbiz-image-preview" />}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => logo.selectFile(e.target.files[0])} />
          {logo.previewUrl && <img src={logo.previewUrl} alt="Logo preview" className="createbiz-image-preview" />}
        </label>
        <label className="createbiz-full">
          <span>Cover Photo</span>
          {business.coverImageUrl && !cover.previewUrl && <img src={business.coverImageUrl} alt="Current cover" className="createbiz-image-preview" />}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => cover.selectFile(e.target.files[0])} />
          {cover.previewUrl && <img src={cover.previewUrl} alt="Cover preview" className="createbiz-image-preview" />}
        </label>

        <div className="createbiz-actions">
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Changes"}</button>
          {business.status === "draft" && (
            <button type="button" onClick={handleSubmitForApproval}>Submit for Approval</button>
          )}
          {business.status !== "closed" && (
            <button type="button" onClick={handleClose}>Close Business</button>
          )}
          <Link to="/my-businesses"><button type="button">Back to My Businesses</button></Link>
        </div>
      </form>
    </section>
  );
}

export default EditBusiness;
