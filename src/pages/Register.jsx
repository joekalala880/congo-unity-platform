import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebase";

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    province: "",
    territory: "",
    village: "",
    currentCountry: "",
    phone: "",
    email: "",
    password: "",
    profileImage: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const { password, ...profileData } = formData;

      await addDoc(collection(db, "congoleseProfiles"), {
        ...profileData,
        userId: userCredential.user.uid,
        role: "citizen",
        createdAt: new Date(),
        status: "pending_verification",
      });

      alert("Account created and profile saved successfully!");
    } catch (error) {
      console.error("Firebase error:", error);
      alert(error.message);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>Register Congolese Profile</h1>
        <p>Create your profile to join Congo Unity Platform.</p>
      </div>

      <form className="register-form" onSubmit={handleRegister}>
        <input name="firstName" onChange={handleChange} placeholder="First Name" />
        <input name="middleName" onChange={handleChange} placeholder="Middle Name" />
        <input name="lastName" onChange={handleChange} placeholder="Last Name" />
        <input name="dateOfBirth" onChange={handleChange} type="date" />

        <input name="province" onChange={handleChange} placeholder="Province" />
        <input name="territory" onChange={handleChange} placeholder="Territory" />
        <input name="village" onChange={handleChange} placeholder="Village / City" />
        <input name="currentCountry" onChange={handleChange} placeholder="Current Country" />

        <input name="phone" onChange={handleChange} placeholder="Phone Number" />
        <input name="email" onChange={handleChange} type="email" placeholder="Email Address" />
        <input name="password" onChange={handleChange} type="password" placeholder="Password" />
        <input
  name="profileImage"
  placeholder="Profile Image URL optional"
  onChange={handleChange}
/>

        <button type="submit">Register Profile</button>
      </form>
    </section>
  );
}

export default Register;