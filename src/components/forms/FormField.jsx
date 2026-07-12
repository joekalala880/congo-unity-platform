// A single reusable field renderer for the three input shapes the
// Create* forms actually use. Deliberately not a schema-driven form
// generator — each page still writes out its own field list explicitly,
// this just removes the repeated input/textarea/select boilerplate.
function FormField({ as = "input", name, value, onChange, placeholder, options, ...rest }) {
  if (as === "textarea") {
    return (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
      />
    );
  }

  if (as === "select") {
    return (
      <select name={name} value={value} onChange={onChange} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...rest}
    />
  );
}

export default FormField;
