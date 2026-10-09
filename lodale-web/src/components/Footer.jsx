import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";

export default function Footer() {
  const location = useLocation();

  const handleLinkClick = (e, hash) => {
    if (location.pathname === "/explore" || location.pathname === "/") {
      e.preventDefault();
      if (hash === "#hero") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const targetId = hash.replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = elem.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        window.scrollTo({
          top: elementPosition - offset,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div className="w-full">
      {/* Main Footer Links Block */}
      <footer className="bg-black dark:bg-[#07130D] text-white px-6 py-16 border-t border-zinc-900 dark:border-[#2C4633]">
        <div className="mx-auto max-w-6xl w-full grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Column 1: Brand Info */}
          <div className="md:col-span-4 flex flex-col items-start text-left">
            <Logo variant="white" className="mb-4" />
            <p className="text-[13px] text-zinc-400 dark:text-[#d9b56f]/70 max-w-xs leading-relaxed">
              Property Management, On the Record. Securing the rental lifecycle
              with verified trust profiles, digital ledgers, and contract
              automation.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-2 text-left">
            <h4 className="text-[11px] font-bold text-zinc-300 dark:text-[#E5C583] uppercase tracking-widest mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link
                  to="/explore#hero"
                  onClick={(e) => handleLinkClick(e, "#hero")}
                  className="text-zinc-400 hover:text-white dark:text-[#d9b56f] dark:hover:text-[#E5C583] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/explore#listings"
                  onClick={(e) => handleLinkClick(e, "#listings")}
                  className="text-zinc-400 hover:text-white dark:text-[#d9b56f] dark:hover:text-[#E5C583] transition-colors"
                >
                  Properties
                </Link>
              </li>
              <li>
                <Link
                  to="/explore#about"
                  onClick={(e) => handleLinkClick(e, "#about")}
                  className="text-zinc-400 hover:text-white dark:text-[#d9b56f] dark:hover:text-[#E5C583] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/explore#features"
                  onClick={(e) => handleLinkClick(e, "#features")}
                  className="text-zinc-400 hover:text-white dark:text-[#d9b56f] dark:hover:text-[#E5C583] transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/explore#contact"
                  onClick={(e) => handleLinkClick(e, "#contact")}
                  className="text-zinc-400 hover:text-white dark:text-[#d9b56f] dark:hover:text-[#E5C583] transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="md:col-span-3 text-left">
            <h4 className="text-[11px] font-bold text-zinc-300 dark:text-[#E5C583] uppercase tracking-widest mb-4">
              Support
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <a
                  href="mailto:support@lodale.com"
                  className="text-zinc-400 hover:text-white dark:text-[#d9b56f] dark:hover:text-[#E5C583] transition-colors"
                >
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div id="contact" className="md:col-span-3 text-left scroll-mt-24">
            <h4 className="text-[11px] font-bold text-zinc-300 dark:text-[#E5C583] uppercase tracking-widest mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5 text-[13px] text-zinc-400 dark:text-[#d9b56f]/70">
              <li className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-[#d9b56f]/50 uppercase">
                  Email
                </span>
                <a
                  href="mailto:support@lodale.com"
                  className="hover:text-white dark:text-[#d9b56f] dark:hover:text-[#E5C583] transition-colors"
                >
                  support@lodale.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-[#d9b56f]/50 uppercase">
                  Phone
                </span>
                <span>+234 (0) 812 345 6789</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-[#d9b56f]/50 uppercase mt-0.5">
                  Location
                </span>
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright details */}
        <div className="mx-auto max-w-6xl w-full border-t border-zinc-800 dark:border-[#2C4633] mt-12 pt-8 text-center text-[12px] text-zinc-500 dark:text-[#d9b56f]/60">
          © {new Date().getFullYear()} Lodale · Built for landlords & tenants in
          Nigeria
        </div>
      </footer>
    </div>
  );
}
