// Reproduces the exact layout every Create* page already used:
// a .register-section/.register-header/.register-form shell with a
// single submit button. No visual changes from the original markup.
function FormPage({ title, subtitle, onSubmit, submitLabel, submittingLabel, isSubmitting, children }) {
  return (
    <section className="register-section">
      <div className="register-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <form className="register-form" onSubmit={onSubmit}>
        {children}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel ?? "Publishing..." : submitLabel}
        </button>
      </form>
    </section>
  );
}

export default FormPage;
