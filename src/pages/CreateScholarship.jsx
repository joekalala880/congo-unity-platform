import useCreateForm from "../hooks/useCreateForm";
import FormPage from "../components/forms/FormPage";
import FormField from "../components/forms/FormField";

function CreateScholarship() {
  const { values, handleChange, handleSubmit, isSubmitting } = useCreateForm({
    collectionName: "scholarships",
    initialValues: {
      title: "",
      organization: "",
      location: "",
      deadline: "",
      amount: "",
      description: "",
      link: "",
    },
    successMessage: "Scholarship posted successfully!",
  });

  return (
    <FormPage
      title="Create Scholarship"
      subtitle="Add education opportunities for the Congolese community."
      onSubmit={handleSubmit}
      submitLabel="Publish Scholarship"
      isSubmitting={isSubmitting}
    >
      <FormField name="title" value={values.title} onChange={handleChange} placeholder="Scholarship Title" />
      <FormField
        name="organization"
        value={values.organization}
        onChange={handleChange}
        placeholder="Organization"
      />
      <FormField name="location" value={values.location} onChange={handleChange} placeholder="Location" />
      <FormField name="deadline" value={values.deadline} onChange={handleChange} placeholder="Deadline" />
      <FormField name="amount" value={values.amount} onChange={handleChange} placeholder="Amount" />

      <FormField
        as="textarea"
        name="description"
        value={values.description}
        onChange={handleChange}
        placeholder="Scholarship Description"
      />

      <FormField name="link" value={values.link} onChange={handleChange} placeholder="Application Link" />
    </FormPage>
  );
}

export default CreateScholarship;
