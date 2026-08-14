import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Plus } from "lucide-react";

export default function SearchableDropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select or search...",
  id,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const exactMatch = options.some(
    (opt) => opt.toLowerCase() === searchQuery.toLowerCase().trim()
  );

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleAddCustom = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      onChange(trimmed);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="w-full text-left relative" ref={dropdownRef}>
      {label && (
        <label className="block text-[12px] font-bold text-ink-900 dark:text-white mb-1">
          {label}
        </label>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer px-3.5 py-2.5 h-[42px] rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-[#16241F] text-ink-900 dark:text-white text-xs font-medium transition-all hover:border-moss-600 dark:hover:border-[#E5C583]"
      >
        <span className={value ? "font-bold text-ink-900 dark:text-white truncate" : "text-ink-400 dark:text-cream-100/50 truncate"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[300] left-0 right-0 mt-1 max-h-60 rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-[#12221C] shadow-2xl overflow-hidden flex flex-col animate-in fade-in">
          {/* Search Box */}
          <div className="p-2 border-b border-ink-100 dark:border-white/10 bg-cream-50 dark:bg-[#182C24]">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1F362C] border border-ink-200 dark:border-white/15">
              <Search className="h-3.5 w-3.5 text-ink-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or type name..."
                className="w-full bg-transparent text-xs text-ink-900 dark:text-white outline-none placeholder:text-ink-400"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto py-1 max-h-44">
            {filteredOptions.length === 0 && !searchQuery.trim() ? (
              <div className="px-4 py-3 text-xs text-ink-400 dark:text-cream-100/50 text-center">
                No options available. Type to add custom.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt;
                return (
                  <div
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={`flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-moss-100/70 dark:bg-[#1E382A] text-moss-800 dark:text-[#E5C583] font-bold"
                        : "text-ink-900 dark:text-cream-100 hover:bg-cream-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-moss-700 dark:text-[#E5C583]" />}
                  </div>
                );
              })
            )}

            {/* Custom Option Adder button if searchQuery is typed and doesn't exactly match an existing option */}
            {searchQuery.trim() && !exactMatch && (
              <div
                onClick={handleAddCustom}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-moss-700 dark:text-[#E5C583] bg-moss-50/80 dark:bg-[#162B22] hover:bg-moss-100 dark:hover:bg-[#1D382D] cursor-pointer border-t border-ink-100 dark:border-white/10"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add custom: &quot;{searchQuery.trim()}&quot;</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
