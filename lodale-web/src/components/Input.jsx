export default function Input({
  label,
  id,
  type = "text",
  light = false,
  ...props
}) {
  return (
    <label htmlFor={id} className="block">
      <span
        className={`mb-2 block text-[13px] font-medium ${light ? "text-white/90" : "text-ink-700"}`}
      >
        {label}
      </span>
      <input
        id={id}
        type={type}
        className={`w-full rounded-lg border ${light ? "border-white/20 bg-white/10 text-white placeholder:text-white/45 focus:border-white/40" : "border-ink-200 bg-white text-ink-900 placeholder:text-ink-400 focus:border-moss-600"} px-4 py-3 text-[15px] outline-none transition-colors`}
        {...props}
      />
    </label>
  );
}
