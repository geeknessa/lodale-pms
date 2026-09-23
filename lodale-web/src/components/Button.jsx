export default function Button({
  children,
  variant = "primary",
  className = "",
  as: As = "button",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4.5 py-2 text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss-600 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-moss-600 text-white hover:bg-moss-700 dark:bg-[#E5C583] dark:text-[#07130D] dark:hover:bg-[#d8b46e] dark:hover:text-[#07130D]",
    dark:
      "bg-ink-900 text-white hover:bg-black dark:bg-[#182C23] dark:text-white dark:hover:bg-[#233B31] dark:hover:text-white",
    secondary:
      "bg-transparent text-moss-600 border border-ink-200 hover:border-moss-600 hover:text-moss-700 dark:text-cream-100 dark:border-white/15 dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:text-white",
    ghost:
      "bg-transparent text-ink-700 hover:text-moss-600 hover:bg-black/5 dark:text-cream-100/90 dark:hover:text-[#E5C583] dark:hover:bg-white/10",
  };

  return (
    <As className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </As>
  );
}
