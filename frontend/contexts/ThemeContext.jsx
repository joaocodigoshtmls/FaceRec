import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "facerec-theme";
const THEMES = { LIGHT: "light", DARK: "dark" };

function resolveInitialTheme() {
  if (typeof window === "undefined") {
    return THEMES.DARK;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === THEMES.LIGHT || stored === THEMES.DARK) {
      return stored;
    }
  } catch {
    /* ignore */
  }

  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
  return prefersLight ? THEMES.LIGHT : THEMES.DARK;
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const body = document.body;

    root.dataset.theme = theme;
    body.dataset.theme = theme;

    if (theme === THEMES.LIGHT) {
      body.classList.add("theme-holo");
    } else {
      body.classList.remove("theme-holo");
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: light)");
    if (!media) {
      return undefined;
    }
    const handleChange = (event) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === THEMES.LIGHT || stored === THEMES.DARK) {
          return; // explicit preference wins
        }
      } catch {
        /* ignore */
      }
      setTheme(event.matches ? THEMES.LIGHT : THEMES.DARK);
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    if (typeof media.addListener === "function") {
      media.addListener(handleChange);
      return () => media.removeListener(handleChange);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }
      if (!event.newValue) {
        setTheme(resolveInitialTheme());
        return;
      }
      if (event.newValue === THEMES.LIGHT || event.newValue === THEMES.DARK) {
        setTheme(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(() => ({
    theme,
    isLight: theme === THEMES.LIGHT,
    isDark: theme === THEMES.DARK,
    setTheme,
    toggleTheme: () => setTheme((prev) => (prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT)),
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme deve ser usado dentro de <ThemeProvider />");
  }
  return ctx;
}
