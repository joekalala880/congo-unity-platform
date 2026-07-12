import useCreateForm from "../hooks/useCreateForm";
import FormPage from "../components/forms/FormPage";
import FormField from "../components/forms/FormField";

const CATEGORY_OPTIONS = [
  { value: "", label: "Select Category" },
  { value: "Community", label: "Community" },
  { value: "Emergency Alert", label: "Emergency Alert" },
  { value: "Diaspora Event", label: "Diaspora Event" },
  { value: "Government Notice", label: "Government Notice" },
  { value: "Fundraiser", label: "Fundraiser" },
];

function CreateAnnouncement() {
  const { values, handleChange, handleSubmit, isSubmitting } = useCreateForm({
    collectionName: "announcements",
    initialValues: {
      title: "",
      category: "",
      message: "",
    },
    successMessage: "Announcement created successfully!",
  });

  return (
    <FormPage
      title="Create Announcement"
      subtitle="Post community updates, alerts, events, or official notices."
      onSubmit={handleSubmit}
      submitLabel="Publish Announcement"
      isSubmitting={isSubmitting}
    >
      <FormField
        name="title"
        value={values.title}
        onChange={handleChange}
        placeholder="Announcement Title"
      />

      <FormField
        as="select"
        name="category"
        value={values.category}
        onChange={handleChange}
        options={CATEGORY_OPTIONS}
      />

      <FormField
        as="textarea"
        name="message"
        value={values.message}
        onChange={handleChange}
        placeholder="Write announcement message..."
      />
    </FormPage>
  );
}

export default CreateAnnouncement;
