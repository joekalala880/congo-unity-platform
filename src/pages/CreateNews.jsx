import useCreateForm from "../hooks/useCreateForm";
import FormPage from "../components/forms/FormPage";
import FormField from "../components/forms/FormField";

function validateNews(values) {
  if (!values.title || !values.summary || !values.content) {
    return "Please fill title, summary, and content";
  }

  return null;
}

function CreateNews() {
  const { values, handleChange, handleSubmit, isSubmitting } = useCreateForm({
    collectionName: "news",
    initialValues: {
      title: "",
      category: "",
      location: "",
      imageUrl: "",
      summary: "",
      content: "",
      sourceLink: "",
    },
    successMessage: "News published successfully!",
    validate: validateNews,
  });

  return (
    <FormPage
      title="Create News"
      subtitle="Publish verified news and community updates."
      onSubmit={handleSubmit}
      submitLabel="Publish News"
      isSubmitting={isSubmitting}
    >
      <FormField name="title" value={values.title} onChange={handleChange} placeholder="News Title" />
      <FormField name="category" value={values.category} onChange={handleChange} placeholder="Category" />
      <FormField name="location" value={values.location} onChange={handleChange} placeholder="Location" />
      <FormField
        name="imageUrl"
        value={values.imageUrl}
        onChange={handleChange}
        placeholder="Image URL optional"
      />

      <FormField
        as="textarea"
        name="summary"
        value={values.summary}
        onChange={handleChange}
        placeholder="Short Summary"
      />

      <FormField
        as="textarea"
        name="content"
        value={values.content}
        onChange={handleChange}
        placeholder="Full News Content"
      />

      <FormField
        name="sourceLink"
        value={values.sourceLink}
        onChange={handleChange}
        placeholder="Source Link optional"
      />
    </FormPage>
  );
}

export default CreateNews;
