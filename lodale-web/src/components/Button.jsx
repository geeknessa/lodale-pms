export default function Button({
  children,
  variant = "primary",
  className = "",
  as: As = "button",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C4633] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none";

  const variants = {
    primary:
      "bg-[#2C4633] text-white hover:bg-[#1E3324] active:bg-[#14221B] dark:bg-[#E5C583] dark:text-[#07130D] dark:hover:bg-[#d8b46e] dark:hover:text-[#07130D]",
    dark:
      "bg-ink-900 text-white hover:bg-black dark:bg-[#182C23] dark:text-white dark:hover:bg-[#233B31] dark:hover:text-white",
    secondary:
      "bg-transparent text-moss-600 border border-ink-200 hover:border-moss-600 hover:text-moss-700 dark:text-cream-100 dark:border-white/15 dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:text-white",
    ghost:
      "bg-transparent text-[#71717A] dark:text-white/70 hover:text-[#1C1917] dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/10",
    danger:
      "bg-[#FEE2E2] text-[#B91C1C] hover:bg-red-200 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 dark:hover:text-red-200 border border-red-200 dark:border-red-900/40",
    outline:
      "bg-transparent text-[#2C4633] dark:text-[#E5C583] border border-[#2C4633] dark:border-[#E5C583] hover:bg-[#2C4633]/5 dark:hover:bg-[#E5C583]/10 dark:hover:text-[#E5C583]",
  };

  return (
    <As className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </As>
  );
}
