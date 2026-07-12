import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Shared submit behavior for the "Create <Thing>" pages: require login,
// run an optional per-form validation check, write to Firestore with the
// same createdBy/createdAt/status shape every form already used, show the
// same alert-based success/error feedback, and reset the form on success.
//
// This intentionally does not touch navigation: none of the existing
// Create* pages redirect after submitting (they alert and reset in place),
// so this hook doesn't either.
function useCreateForm({ collectionName, initialValues, successMessage, validate }) {
  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    const validationError = validate?.(values);

    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, collectionName), {
        ...values,
        createdBy: user.email,
        createdAt: new Date(),
        status: "published",
      });

      alert(successMessage);
      setValues(initialValues);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { values, handleChange, handleSubmit, isSubmitting };
}

export default useCreateForm;
