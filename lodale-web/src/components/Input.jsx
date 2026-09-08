export default function Input({
  label,
  id,
  type = "text",
  light = false,
  multiline = false,
  rows = 1,
  className = "",
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

  const baseClasses = `w-full rounded-xl border ${
    light
      ? "border-white/20 bg-white/10 text-white placeholder:text-white/45 focus:border-white/40"
      : "border-ink-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-ink-900 dark:text-white placeholder:text-ink-400 dark:placeholder:text-cream-100/50 focus:border-moss-600 dark:focus:border-[#E5C583] hover:border-moss-500"
  } px-3.5 py-2.5 text-xs font-medium outline-none transition-all break-words ${className}`;

  return (
    <label htmlFor={id} className="block text-left w-full">
      {label && (
        <span
          className={`block text-[12px] font-bold mb-1 ${light ? "text-white/90" : "text-ink-900 dark:text-white"}`}
        >
          {label}
        </span>
      )}
      {multiline || type === "textarea" ? (
        <textarea
          id={id}
          rows={rows}
          className={`${baseClasses} resize-none min-h-[44px] overflow-hidden leading-relaxed`}
          onChange={handleChange}
          onInput={handleInput}
          {...props}
        />
      ) : (
        <input
          id={id}
          type={type}
          className={`${baseClasses} h-[42px]`}
          onChange={onChange}
          onInput={onInput}
          {...props}
        />
      )}
    </label>
  );
}
