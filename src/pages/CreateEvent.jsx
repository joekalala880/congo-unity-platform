import useCreateForm from "../hooks/useCreateForm";
import FormPage from "../components/forms/FormPage";
import FormField from "../components/forms/FormField";

function CreateEvent() {
  const { values, handleChange, handleSubmit, isSubmitting } = useCreateForm({
    collectionName: "events",
    initialValues: {
      title: "",
      organizer: "",
      location: "",
      date: "",
      time: "",
      description: "",
      link: "",
    },
    successMessage: "Event posted successfully!",
  });

  return (
    <FormPage
      title="Create Event"
      subtitle="Add community events, fundraisers, meetings, and diaspora programs."
      onSubmit={handleSubmit}
      submitLabel="Publish Event"
      isSubmitting={isSubmitting}
    >
      <FormField name="title" value={values.title} onChange={handleChange} placeholder="Event Title" />
      <FormField name="organizer" value={values.organizer} onChange={handleChange} placeholder="Organizer" />
      <FormField name="location" value={values.location} onChange={handleChange} placeholder="Location" />
      <FormField name="date" value={values.date} onChange={handleChange} placeholder="Date" />
      <FormField name="time" value={values.time} onChange={handleChange} placeholder="Time" />

      <FormField
        as="textarea"
        name="description"
        value={values.description}
        onChange={handleChange}
        placeholder="Event Description"
      />

      <FormField name="link" value={values.link} onChange={handleChange} placeholder="Event Link" />
    </FormPage>
  );
}

export default CreateEvent;
