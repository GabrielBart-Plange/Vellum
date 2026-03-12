import { render, screen, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../ThemeContext";
import React from "react";

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        clear: () => { store = {}; }
    };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Helper component to test useTheme
const ThemeTestComponent = () => {
    const { theme, setTheme } = useTheme();
    return (
        <div>
            <span data-testid="current-theme">{theme}</span>
            <button onClick={() => setTheme("archive")}>Set Archive</button>
        </div>
    );
};

describe("ThemeContext", () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute("data-theme");
    });

    it("provides the default 'void' theme", async () => {
        render(
            <ThemeProvider>
                <ThemeTestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId("current-theme").textContent).toBe("void");
    });

    it("updates the theme and persists to localStorage", async () => {
        render(
            <ThemeProvider>
                <ThemeTestComponent />
            </ThemeProvider>
        );

        const button = screen.getByText("Set Archive");
        await act(async () => {
            button.click();
        });

        expect(screen.getByTestId("current-theme").textContent).toBe("archive");
        expect(localStorage.getItem("vellum-theme")).toBe("archive");
        expect(document.documentElement.getAttribute("data-theme")).toBe("archive");
    });

    it("loads theme from localStorage on mount", async () => {
        localStorage.setItem("vellum-theme", "midnight");

        render(
            <ThemeProvider>
                <ThemeTestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId("current-theme").textContent).toBe("midnight");
        expect(document.documentElement.getAttribute("data-theme")).toBe("midnight");
    });
});
