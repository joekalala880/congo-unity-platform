import useCreateForm from "../hooks/useCreateForm";
import FormPage from "../components/forms/FormPage";
import FormField from "../components/forms/FormField";

function CreateJob() {
  const { values, handleChange, handleSubmit, isSubmitting } = useCreateForm({
    collectionName: "jobs",
    initialValues: {
      title: "",
      company: "",
      location: "",
      type: "",
      description: "",
      link: "",
    },
    successMessage: "Job posted successfully!",
  });

  return (
    <FormPage
      title="Create Job"
      subtitle="Add job opportunities for the Congolese community."
      onSubmit={handleSubmit}
      submitLabel="Publish Job"
      isSubmitting={isSubmitting}
    >
      <FormField name="title" value={values.title} onChange={handleChange} placeholder="Job Title" />
      <FormField name="company" value={values.company} onChange={handleChange} placeholder="Company" />
      <FormField name="location" value={values.location} onChange={handleChange} placeholder="Location" />
      <FormField
        name="type"
        value={values.type}
        onChange={handleChange}
        placeholder="Full-time, Part-time, Internship..."
      />

      <FormField
        as="textarea"
        name="description"
        value={values.description}
        onChange={handleChange}
        placeholder="Job Description"
      />

      <FormField name="link" value={values.link} onChange={handleChange} placeholder="Application Link" />
    </FormPage>
  );
}

export default CreateJob;
