"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "void" | "archive" | "midnight" | "light" | "nebula" | "serene";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("void");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Hydrate theme from localStorage or document attribute (set by head script)
        const savedTheme = localStorage.getItem("vellum-theme") as Theme;
        const currentTheme = document.documentElement.getAttribute("data-theme") as Theme;
        
        if (savedTheme) {
            setThemeState(savedTheme);
            if (currentTheme !== savedTheme) {
                document.documentElement.setAttribute("data-theme", savedTheme);
            }
        }
        setMounted(true);
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("vellum-theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);

        // Smooth transition between themes
        document.documentElement.style.setProperty('--transition-speed', '0.5s');
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <div className={mounted ? "contents" : "invisible"}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
