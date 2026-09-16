import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

/**
 * Password field with a show/hide toggle.
 *
 * The toggle is a button rather than a checkbox so it is reachable by keyboard
 * and announced as pressed/not pressed, and the field reverts to hidden on
 * every mount so a password is never revealed by a stale toggle.
 */
export default function PasswordInput({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  autoComplete = "current-password",
  minLength,
  required = false,
  hint = "",
}) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();
  const hintId = `${inputId}-hint`;

  return (
    <label htmlFor={inputId}>
      <span>{label}</span>
      <span className="password-field">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          aria-describedby={hint ? hintId : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </span>
      {hint && <small id={hintId} className="password-field__hint">{hint}</small>}
    </label>
  );
}
