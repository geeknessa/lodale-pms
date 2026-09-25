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
            </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-2 text-left">
            <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link to="/explore" className="text-zinc-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/explore#listings" className="text-zinc-400 hover:text-white transition-colors">
                  Properties
                </Link>
              </li>
              <li>
                <Link to="/explore#about" className="text-zinc-400 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/explore#features" className="text-zinc-400 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-zinc-400 hover:text-white transition-colors">
                  Contact
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
                <a href="mailto:support@lodale.com" className="text-zinc-400 hover:text-white transition-colors">
                  Help Center
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
