import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export default function Footer() {
  return (
    <div className="w-full">
      {/* Main Footer Links Block */}
      <footer className="bg-black text-white px-6 py-16 border-t border-zinc-900">
        <div className="mx-auto max-w-6xl w-full grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Column 1: Brand Info & Social Icons */}
          <div className="md:col-span-4 flex flex-col items-start text-left">
            <Logo variant="white" className="mb-4" />
            <p className="text-[13px] text-zinc-400 max-w-xs leading-relaxed">
              Property Management, On the Record. Securing the rental lifecycle
              with verified trust profiles, digital ledgers, and contract
              automation.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-moss-700 hover:text-white transition-all"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-moss-700 hover:text-white transition-all"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-moss-700 hover:text-white transition-all"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-moss-700 hover:text-white transition-all"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-2 text-left">
            <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link
                  to="/explore"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/explore#for-tenants"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  For Tenants
                </Link>
              </li>
              <li>
                <Link
                  to="/explore#for-landlords"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  For Landlords
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="text-[#DAD7CD] hover:text-white font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Admin Portal</span>
                  <span className="text-[9px] bg-[#344E41] text-white px-1.5 py-0.2 rounded">Staff</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="md:col-span-3 text-left">
            <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-4">
              Support
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <a
                  href="#"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Safety Guides
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="md:col-span-3 text-left">
            <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5 text-[13px] text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                  Email
                </span>
                <a
                  href="mailto:support@lodale.com"
                  className="hover:text-white transition-colors"
                >
                  support@lodale.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                  Phone
                </span>
                <span>+234 (0) 812 345 6789</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">
                  Location
                </span>
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright details */}
        <div className="mx-auto max-w-6xl w-full border-t border-zinc-800 mt-12 pt-8 text-center text-[12px] text-zinc-500">
          © {new Date().getFullYear()} Lodale · Built for landlords & tenants in
          Nigeria
        </div>
      </footer>
    </div>
  );
}
