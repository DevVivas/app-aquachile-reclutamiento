export default function ValidatedTextInput({
  id,
  name,
  ariaLabel,
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

  return (
    <div className="validated-field">
      <div className={`validated-input-wrap${invalid ? ' is-invalid' : ''}${isValid ? ' is-valid' : ''}`}>
        <input
          id={id}
          type="text"
          name={name}
          required
          minLength={minLength}
          maxLength={maxLength}
          aria-label={ariaLabel}
          aria-invalid={invalid}
          aria-describedby={invalid ? feedbackId : undefined}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="form-input"
        />
        {isValid && !invalid && (
          <span className="field-valid-check" aria-label="Correcto">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 10 3.2 3.2L15.5 6" />
            </svg>
          </span>
        )}
      </div>
      {invalid && (
        <p id={feedbackId} className="field-error" role="alert">
          {validationError}
        </p>
      )}
    </div>
  )
}
