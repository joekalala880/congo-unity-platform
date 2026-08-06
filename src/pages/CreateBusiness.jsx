import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { useBusinessImageUpload } from "../hooks/useBusinessImageUpload";
import { createBusiness } from "../services/businessesService";
import { BUSINESS_CATEGORIES, PRICE_RANGES } from "../services/businessTypes";
import "./CreateBusiness.css";

const EMPTY_FIELDS = {
  businessName: "",
  ownerName: "",
  category: BUSINESS_CATEGORIES[0],
  shortDescription: "",
  fullDescription: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  provinceOrState: "",
  country: "",
  postalCode: "",
  mapLink: "",
  openingHours: "",
  languages: "",
  services: "",
  priceRange: "",
  socialLinks: "",
  accessibilityInfo: "",
};

function CreateBusiness() {
  const navigate = useNavigate();
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const logo = useBusinessImageUpload("logo");
  const cover = useBusinessImageUpload("cover");

  const user = auth.currentUser;

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!fields.businessName.trim()) return "Business name is required.";
    if (!fields.category) return "Category is required.";
    if (!fields.shortDescription.trim()) return "A short description is required.";
    if (!fields.country.trim()) return "Country is required.";
    return "";
  };

  const submit = async (submitForApproval) => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      alert("Please log in to create a business.");
      return;
    }

    setIsSubmitting(true);
    try {
      let logoUrl = "";
      let coverImageUrl = "";
      if (logo.file) logoUrl = await logo.uploadImage(user.uid);
      if (cover.file) coverImageUrl = await cover.uploadImage(user.uid);

      await createBusiness(user, { ...fields, logoUrl, coverImageUrl }, { submitForApproval });
      alert(
        submitForApproval
          ? "Business submitted for admin approval. You'll be notified once it's reviewed."
          : "Draft saved. You can find it under My Businesses."
      );
      navigate("/my-businesses");
    } catch (err) {
      console.error("Failed to create business:", err);
      setError(err.message || "Couldn't create this business. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <section className="register-section">
        <div className="register-header">
          <h1>Create Business</h1>
          <p>Please log in to create a business listing.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Create Business</h1>
        <p>Add Congolese-owned businesses and organizations. New listings are reviewed by an admin before going live.</p>
      </div>

      <form className="register-form createbiz-form" onSubmit={(e) => e.preventDefault()}>
        {error && <p className="register-form__error" role="alert">{error}</p>}

        <label><span>Business Name</span><input name="businessName" value={fields.businessName} onChange={handleChange} /></label>
        <label><span>Owner Name (optional)</span><input name="ownerName" value={fields.ownerName} onChange={handleChange} /></label>

        <label>
          <span>Category</span>
          <select name="category" value={fields.category} onChange={handleChange}>
            {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label><span>Short Description</span><input name="shortDescription" value={fields.shortDescription} onChange={handleChange} placeholder="One sentence about your business" /></label>
        <label><span>Full Description</span><textarea name="fullDescription" value={fields.fullDescription} onChange={handleChange} /></label>

        <div className="createbiz-grid">
          <label><span>Phone</span><input name="phone" value={fields.phone} onChange={handleChange} /></label>
          <label><span>Email</span><input name="email" value={fields.email} onChange={handleChange} /></label>
          <label><span>Website</span><input name="website" value={fields.website} onChange={handleChange} /></label>
          <label><span>Price Range</span>
            <select name="priceRange" value={fields.priceRange} onChange={handleChange}>
              {PRICE_RANGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
        </div>

        <div className="createbiz-grid">
          <label><span>Address</span><input name="address" value={fields.address} onChange={handleChange} /></label>
          <label><span>City</span><input name="city" value={fields.city} onChange={handleChange} /></label>
          <label><span>Province/State</span><input name="provinceOrState" value={fields.provinceOrState} onChange={handleChange} /></label>
          <label><span>Country</span><input name="country" value={fields.country} onChange={handleChange} /></label>
          <label><span>Postal Code</span><input name="postalCode" value={fields.postalCode} onChange={handleChange} /></label>
          <label><span>Map Link</span><input name="mapLink" value={fields.mapLink} onChange={handleChange} placeholder="Google Maps URL" /></label>
        </div>

        <div className="createbiz-grid">
          <label><span>Opening Hours</span><input name="openingHours" value={fields.openingHours} onChange={handleChange} placeholder="e.g. Mon-Fri 9am-6pm" /></label>
          <label><span>Languages Spoken</span><input name="languages" value={fields.languages} onChange={handleChange} placeholder="e.g. French, Lingala, English" /></label>
          <label><span>Services Offered</span><input name="services" value={fields.services} onChange={handleChange} /></label>
          <label><span>Social Links</span><input name="socialLinks" value={fields.socialLinks} onChange={handleChange} placeholder="Instagram, Facebook, etc." /></label>
        </div>

        <label><span>Accessibility Information (optional)</span><input name="accessibilityInfo" value={fields.accessibilityInfo} onChange={handleChange} /></label>

        <div className="createbiz-grid">
          <label>
            <span>Logo (optional)</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => logo.selectFile(e.target.files[0])} />
            {logo.previewUrl && <img src={logo.previewUrl} alt="Logo preview" className="createbiz-image-preview" />}
            {logo.error && <p className="register-form__error" role="alert">{logo.error}</p>}
          </label>
          <label>
            <span>Cover Photo (optional)</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => cover.selectFile(e.target.files[0])} />
            {cover.previewUrl && <img src={cover.previewUrl} alt="Cover preview" className="createbiz-image-preview" />}
            {cover.error && <p className="register-form__error" role="alert">{cover.error}</p>}
          </label>
        </div>

        <div className="createbiz-actions">
          <button type="button" onClick={() => submit(false)} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Draft"}
          </button>
          <button type="button" onClick={() => submit(true)} disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit for Approval"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreateBusiness;
