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
    primary: "bg-moss-600 text-white hover:bg-moss-700",
    dark: "bg-ink-900 text-white hover:bg-black",
    secondary:
      "bg-transparent text-moss-600 border border-ink-200 hover:border-moss-600",
    ghost: "bg-transparent text-ink-700 hover:text-moss-600",
  };

  return (
    <As className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </As>
  );
}
