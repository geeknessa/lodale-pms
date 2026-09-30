import { AlertCircle } from "lucide-react";

export default function Input({
  label,
  id,
  type = "text",
  light = false,
  multiline = false,
  rows = 1,
  className = "",
  containerClassName = "",
  error,
  touched,
  helperText,
  onChange,
  onInput,
  ...props
}) {
  const autoResize = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.max(44, Math.min(el.scrollHeight, 300))}px`;
  };

  const handleChange = (e) => {
    autoResize(e);
    if (onChange) onChange(e);
  };

  const handleInput = (e) => {
    autoResize(e);
    if (onInput) onInput(e);
  };

  const hasError = Boolean(error && (touched === undefined || touched));

  const borderClasses = hasError
    ? "border-red-500 dark:border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-500/20 bg-red-500/5 text-red-950 dark:text-red-100"
    : light
      ? "border-white/20 bg-white/10 text-white placeholder:text-white/45 focus:border-white/50"
      : "border-[#E7E5E0] dark:border-white/15 bg-white dark:bg-[#14221B] text-[#1C1917] dark:text-white placeholder:text-[#71717A] dark:placeholder:text-white/40 focus:border-[#2C4633] dark:focus:border-[#E5C583] hover:border-[#2C4633]/40 transition-colors";

  const baseClasses = `w-full rounded-xl border ${borderClasses} px-3.5 py-2.5 text-sm font-normal outline-none break-words ${className}`;

  return (
    <div className={`block text-left w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className={`block text-xs font-medium mb-1.5 ${light ? "text-white/90" : "text-[#1C1917] dark:text-white"}`}
        >
          {label}
        </label>
      )}
      {multiline || type === "textarea" ? (
        <textarea
          id={id}
          rows={rows}
          className={`${baseClasses} resize-none min-h-[80px] leading-relaxed`}
          onChange={handleChange}
          onInput={handleInput}
          {...props}
        />
      ) : (
        <input
          id={id}
          type={type}
          className={`${baseClasses} h-[40px]`}
          onChange={onChange}
          onInput={onInput}
          {...props}
        />
      )}
      {hasError ? (
        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#71717A] dark:text-white/60">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

