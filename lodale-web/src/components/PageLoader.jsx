import React from "react";
import { Logo } from "./Logo";

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-forest-700 transition-colors duration-300">
      <div className="flex flex-col items-center justify-center gap-6 animate-pulse">
        <Logo className="w-16 h-16 md:w-20 md:h-20" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-moss-600 dark:bg-cream-50 animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-moss-600 dark:bg-cream-50 animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-moss-600 dark:bg-cream-50 animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
}
