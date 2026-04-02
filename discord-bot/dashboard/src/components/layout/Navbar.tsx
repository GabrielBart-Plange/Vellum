"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [showQR, setShowQR] = useState(false);
  const [networkUrl, setNetworkUrl] = useState("");

  useEffect(() => {
    // In a real dev environment, we'd use the local IP
    // For now, we'll use a placeholder or the origin
    setNetworkUrl(window.location.origin);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-8">
      <div className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
             <span className="text-[10px] font-bold text-primary-foreground">V</span>
          </div>
          <span className="text-sm font-bold tracking-tight uppercase">Vellum Ops</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowQR(!showQR)}
            className="text-[10px] uppercase tracking-widest font-bold hover:text-muted-foreground transition-colors"
          >
            Mobile Access
          </button>
          
          <button
            onClick={toggleTheme}
            className="text-[10px] uppercase tracking-widest font-bold hover:text-muted-foreground transition-colors"
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </div>

      {showQR && (
        <div className="absolute right-8 top-16 p-6 glass-panel rounded-2xl shadow-2xl z-50 text-center space-y-4 animate-in fade-in zoom-in duration-200">
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Scan to Open on Mobile</p>
          <div className="bg-white p-2 rounded-xl inline-block border border-border">
            <QRCodeSVG value={networkUrl} size={150} />
          </div>
          <p className="text-[9px] font-mono opacity-50 truncate max-w-[150px]">{networkUrl}</p>
          <button 
            onClick={() => setShowQR(false)}
            className="block w-full py-2 text-[8px] uppercase tracking-widest font-black border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </nav>
  );
}
