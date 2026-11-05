export default function ValidatedTextInput({
  id,
  name,
  label,
  hint,
  placeholder,
  value,
  minLength,
  maxLength,
  isValid,
  validationError,
  onChange,
  onBlur,
}) {
  const invalid = Boolean(validationError)
  const feedbackId = `${id}-feedback`
  const hintId = `${id}-hint`
  const describedBy = [invalid && feedbackId, hint && hintId].filter(Boolean).join(' ')

  return (
    <div className="validated-field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className={`validated-input-wrap${invalid ? ' is-invalid' : ''}${isValid ? ' is-valid' : ''}`}>
        <input
          id={id}
          type="text"
          name={name}
          required
          minLength={minLength}
          maxLength={maxLength}
          aria-invalid={invalid}
          aria-describedby={describedBy || undefined}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="form-input"
        />
        {isValid && !invalid && (
          <span className="field-valid-check" role="img" aria-label="Correcto">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 10 3.2 3.2L15.5 6" />
            </svg>
          </span>
        )}
      </div>
      {hint && !invalid && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {invalid && (
        <p id={feedbackId} className="field-error" role="alert">
          {validationError}
        </p>
      )}
    </div>
  )
}
