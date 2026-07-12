// A single reusable field renderer for the three input shapes the
// Create* forms actually use. Deliberately not a schema-driven form
// generator — each page still writes out its own field list explicitly,
// this just removes the repeated input/textarea/select boilerplate.
//
// `label` renders a real <label htmlFor="..."> tied to the field via id,
// visually hidden (.sr-only) so the existing placeholder-driven look is
// unchanged, while giving the field a proper accessible name.
function FormField({ as = "input", name, value, onChange, placeholder, options, label, id, ...rest }) {
  const fieldId = id || name;

  let field;

  if (as === "textarea") {
    field = (
      <textarea
        id={fieldId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
      />
    );
  } else if (as === "select") {
    field = (
      <select id={fieldId} name={name} value={value} onChange={onChange} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else {
    field = (
      <input
        id={fieldId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
      />
    );
  }

  if (!label) {
    return field;
  }

  return (
    <>
      <label className="sr-only" htmlFor={fieldId}>
        {label}
      </label>
      {field}
    </>
  );
}

export default FormField;
