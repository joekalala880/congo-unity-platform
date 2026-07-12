import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function CreateBusiness() {
  const [business, setBusiness] = useState({
    name: "",
    category: "",
    country: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    imageUrl: "",
    description: "",
  });

  const handleChange = (e) => {
    setBusiness({
      ...business,
      [e.target.name]: e.target.value,
    });
  };

  const submitBusiness = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    if (!business.name || !business.category || !business.country) {
      alert("Please fill business name, category, and country");
      return;
    }

    try {
      await addDoc(collection(db, "businesses"), {
        ...business,
        createdBy: user.email,
        createdAt: new Date(),
        status: "published",
      });

      alert("Business published successfully!");

      setBusiness({
        name: "",
        category: "",
        country: "",
        city: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        imageUrl: "",
        description: "",
      });
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Create Business</h1>
        <p>Add Congolese-owned businesses and organizations.</p>
      </div>

      <form className="register-form" onSubmit={submitBusiness}>
        <input name="name" value={business.name} onChange={handleChange} placeholder="Business Name" />
        <input name="category" value={business.category} onChange={handleChange} placeholder="Category" />
        <input name="country" value={business.country} onChange={handleChange} placeholder="Country" />
        <input name="city" value={business.city} onChange={handleChange} placeholder="City" />
        <input name="address" value={business.address} onChange={handleChange} placeholder="Address" />
        <input name="phone" value={business.phone} onChange={handleChange} placeholder="Phone" />
        <input name="email" value={business.email} onChange={handleChange} placeholder="Email" />
        <input name="website" value={business.website} onChange={handleChange} placeholder="Website" />
        <input name="imageUrl" value={business.imageUrl} onChange={handleChange} placeholder="Image URL optional" />

        <textarea
          name="description"
          value={business.description}
          onChange={handleChange}
          placeholder="Business Description"
        />

        <button type="submit">Publish Business</button>
      </form>
    </section>
  );
}

export default CreateBusiness;