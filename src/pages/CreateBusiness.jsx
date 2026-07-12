import useCreateForm from "../hooks/useCreateForm";
import FormPage from "../components/forms/FormPage";
import FormField from "../components/forms/FormField";

function validateBusiness(values) {
  if (!values.name || !values.category || !values.country) {
    return "Please fill business name, category, and country";
  }

  return null;
}

function CreateBusiness() {
  const { values, handleChange, handleSubmit, isSubmitting } = useCreateForm({
    collectionName: "businesses",
    initialValues: {
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
    },
    successMessage: "Business published successfully!",
    validate: validateBusiness,
  });

  return (
    <FormPage
      title="Create Business"
      subtitle="Add Congolese-owned businesses and organizations."
      onSubmit={handleSubmit}
      submitLabel="Publish Business"
      isSubmitting={isSubmitting}
    >
      <FormField name="name" value={values.name} onChange={handleChange} placeholder="Business Name" />
      <FormField name="category" value={values.category} onChange={handleChange} placeholder="Category" />
      <FormField name="country" value={values.country} onChange={handleChange} placeholder="Country" />
      <FormField name="city" value={values.city} onChange={handleChange} placeholder="City" />
      <FormField name="address" value={values.address} onChange={handleChange} placeholder="Address" />
      <FormField name="phone" value={values.phone} onChange={handleChange} placeholder="Phone" />
      <FormField name="email" value={values.email} onChange={handleChange} placeholder="Email" />
      <FormField name="website" value={values.website} onChange={handleChange} placeholder="Website" />
      <FormField
        name="imageUrl"
        value={values.imageUrl}
        onChange={handleChange}
        placeholder="Image URL optional"
      />

      <FormField
        as="textarea"
        name="description"
        value={values.description}
        onChange={handleChange}
        placeholder="Business Description"
      />
    </FormPage>
  );
}

export default CreateBusiness;
