/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // themePreference: 'system' | 'light' | 'dark'
  const [themePreference, setThemePreferenceState] = useState(() => {
    const saved = localStorage.getItem("lodale_theme_pref");
    if (saved && ["system", "light", "dark"].includes(saved)) {
      return saved;
    }
    // Migration fallback for legacy 'theme' key
    const legacy = localStorage.getItem("theme");
    if (legacy && ["light", "dark"].includes(legacy)) {
      return legacy;
    }
    return "system";
  });

  // Effective theme computed ('light' or 'dark')
  const [effectiveTheme, setEffectiveTheme] = useState(() => {
    if (themePreference === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return themePreference;
  });

  // Update theme preference and localStorage
  const setThemePreference = (pref) => {
    if (["system", "light", "dark"].includes(pref)) {
      setThemePreferenceState(pref);
      localStorage.setItem("lodale_theme_pref", pref);
    }
  };

  // Toggle theme explicitly (flips between light and dark)
  const toggleTheme = () => {
    const nextTheme = effectiveTheme === "dark" ? "light" : "dark";
    setThemePreference(nextTheme);
  };

  // Sync effectiveTheme and DOM class list
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const computeEffective = () => {
      if (themePreference === "system") {
        return mediaQuery.matches ? "dark" : "light";
      }
      return themePreference;
    };

    const currentEffective = computeEffective();
    setEffectiveTheme(currentEffective);

    // Apply or remove .dark class on html and body
    const root = document.documentElement;
    const body = document.body;

    if (currentEffective === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
    }

    // Listener for system preference changes when set to 'system'
    const handleSystemChange = (e) => {
      if (themePreference === "system") {
        const newEffective = e.matches ? "dark" : "light";
        setEffectiveTheme(newEffective);
        if (newEffective === "dark") {
          root.classList.add("dark");
          body.classList.add("dark");
        } else {
          root.classList.remove("dark");
          body.classList.remove("dark");
        }
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemChange);
      } else {
        mediaQuery.removeListener(handleSystemChange);
      }
    };
  }, [themePreference]);

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        setThemePreference,
        effectiveTheme,
        isDark: effectiveTheme === "dark",
        toggleTheme,
        // Backwards compatibility property
        theme: effectiveTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
