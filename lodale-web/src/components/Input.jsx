export default function Input({
  label,
  id,
  type = "text",
  light = false,
  className = "",
  ...props
}) {
  return (
    <label htmlFor={id} className="block text-left">
      {label && (
        <span
          className={`block text-[12px] font-bold mb-1 ${light ? "text-white/90" : "text-ink-900 dark:text-white"}`}
        >
          {label}
        </span>
      )}
      <input
        id={id}
        type={type}
        className={`w-full rounded-xl border ${light ? "border-white/20 bg-white/10 text-white placeholder:text-white/45 focus:border-white/40" : "border-ink-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-ink-900 dark:text-white placeholder:text-ink-400 dark:placeholder:text-cream-100/50 focus:border-moss-600 dark:focus:border-[#E5C583] hover:border-moss-500"} px-3.5 py-2.5 h-[42px] text-xs font-medium outline-none transition-all ${className}`}
        {...props}
      />
    </label>
  );
}
