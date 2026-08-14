import { useState } from "react";

export default function DropdownWithOther({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option...",
  id,
  className = "",
  required = false
}) {
  const isPresetOption = options.some((opt) => opt.value === value || opt === value);
  const [selectedKey, setSelectedKey] = useState(
    !value ? "" : isPresetOption ? value : "other"
  );
  const [customInput, setCustomInput] = useState(
    !value ? "" : isPresetOption ? "" : value
  );

  const handleSelectChange = (e) => {
    const val = e.target.value;
    setSelectedKey(val);
    if (val === "other") {
      onChange(customInput);
    } else {
      onChange(val);
    }
  };

  const handleCustomInputChange = (e) => {
    const val = e.target.value;
    setCustomInput(val);
    onChange(val);
  };

  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={id} className="block text-[12px] font-bold text-ink-900 dark:text-white mb-1">
          {label}
        </label>
      )}

      <select
        id={id}
        value={selectedKey}
        onChange={handleSelectChange}
        required={required}
        className={`w-full rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-ink-900 dark:text-white text-xs font-medium px-3.5 py-2.5 h-[42px] outline-none transition-all focus:border-moss-600 dark:focus:border-[#E5C583] hover:border-moss-500 cursor-pointer ${className}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt, idx) => {
          const optValue = typeof opt === "object" ? opt.value : opt;
          const optLabel = typeof opt === "object" ? opt.label : opt;
          return (
            <option key={idx} value={optValue}>
              {optLabel}
            </option>
          );
        })}
        <option value="other">Other... (Type custom)</option>
      </select>

      {selectedKey === "other" && (
        <div className="mt-2 animate-in fade-in">
          <input
            type="text"
            value={customInput}
            onChange={handleCustomInputChange}
            placeholder="Type custom value here..."
            className="w-full rounded-xl border border-moss-500/80 dark:border-[#E5C583]/80 bg-white dark:bg-[#12221C] text-ink-900 dark:text-white text-xs font-medium px-3.5 py-2.5 h-[42px] outline-none transition-all"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
