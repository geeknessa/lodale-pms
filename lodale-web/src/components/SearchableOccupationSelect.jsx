import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export const OCCUPATIONS_LIST = [
  "Accountant",
  "Actor / Performing Artist",
  "Architect",
  "Banker / Financial Analyst",
  "Business Owner / Entrepreneur",
  "Chef / Caterer",
  "Civil Servant / Government Official",
  "Consultant",
  "Customer Support Specialist",
  "Data Analyst / Scientist",
  "Dentist",
  "Doctor / Medical Practitioner",
  "Driver / Logistics Specialist",
  "Electrician / Technician",
  "Engineer (Civil / Mechanical / Electrical)",
  "Event Planner / Manager",
  "Fashion Designer / Tailor",
  "Freelancer / Independent Contractor",
  "Human Resources (HR) Specialist",
  "IT / Network Administrator",
  "Lawyer / Legal Practitioner",
  "Manager / Corporate Executive",
  "Marketer / Sales Specialist",
  "Nurse / Healthcare Worker",
  "Pharmacist",
  "Photographer / Videographer",
  "Pilot / Aviation Staff",
  "Plumber / Tradesperson",
  "Product Manager",
  "Project Manager",
  "Real Estate Agent / Broker",
  "Researcher / Academic",
  "Software Engineer / Developer",
  "Student",
  "Teacher / Lecturer / Educator",
  "Trader / Merchant",
  "UI/UX / Graphic Designer",
  "Veterinarian",
  "Writer / Journalist / Content Creator",
  "Other"
];

export default function SearchableOccupationSelect({ value, onChange, placeholder = "Search or select occupation...", required = false, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOccupations = OCCUPATIONS_LIST.filter(occ => 
    occ.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (occ) => {
    onChange(occ);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full text-left font-sans ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full rounded-xl border border-ink-200 dark:border-white/10 bg-cream-50/50 dark:bg-[#12221C] p-2.5 sm:p-3 text-xs sm:text-sm text-ink-900 dark:text-white cursor-pointer transition-colors focus-within:border-moss-600 shadow-sm"
      >
        <span className={value ? "font-semibold text-ink-900 dark:text-white" : "text-ink-400 dark:text-cream-100/50"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-ink-400 dark:text-cream-100/50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[9999] left-0 right-0 mt-1 bg-white dark:bg-[#162721] border border-ink-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden max-h-60 flex flex-col">
          <div className="p-2 border-b border-ink-100 dark:border-white/10 flex items-center gap-2 bg-cream-50/50 dark:bg-white/5">
            <Search className="h-3.5 w-3.5 text-ink-400 dark:text-cream-100/50" />
            <input
              type="text"
              autoFocus
              placeholder="Search occupation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent text-ink-900 dark:text-white outline-none"
            />
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-ink-50 dark:divide-white/5">
            {filteredOccupations.length > 0 ? (
              filteredOccupations.map((occ) => {
                const isSelected = value === occ;
                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => handleSelect(occ)}
                    className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-moss-50 text-moss-800 dark:bg-moss-900/40 dark:text-[#E5C583] font-bold'
                        : 'hover:bg-ink-50 dark:hover:bg-white/5 text-ink-800 dark:text-cream-100'
                    }`}
                  >
                    <span>{occ}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-moss-600 dark:text-[#E5C583]" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-ink-500 dark:text-cream-100/60">
                <span>No matching standard occupation found.</span>
                <button
                  type="button"
                  onClick={() => handleSelect(searchQuery)}
                  className="block mx-auto mt-1 font-bold text-moss-700 dark:text-[#E5C583] underline cursor-pointer"
                >
                  Use "{searchQuery}" as custom occupation
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
