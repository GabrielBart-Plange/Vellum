"use client";

import { useEffect, useState } from "react";

const BOT_API_URL = "http://localhost:4000";

interface BotStatus {
  status: string;
  system: string;
  version: string;
  endpoints: string[];
}

export default function BotDashboard() {
  const [activeTab, setActiveTab] = useState<"operations" | "insights" | "admin">("operations");
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin State
  const [adminChannelId, setAdminChannelId] = useState("1474302805866057749"); // Defaults to Rules
  const [adminText, setAdminText] = useState("");
  const [updateMode, setUpdateMode] = useState<"replace" | "edit" | "append">("edit");
  
  const [summaryMessage, setSummaryMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${BOT_API_URL}/`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Bot is offline or API unreachable");
      setStatus(null);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/logs`);
      const data = await res.json();
      setLogs(data.reverse().slice(0, 50)); 
    } catch (e) {
      console.error("Failed to fetch logs");
    }
  };

  const fetchSummaries = async () => {
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/admin/summaries`);
      const data = await res.json();
      setSummaries(data.reverse());
    } catch (e) {
      console.error("Failed to fetch summaries");
    }
  };

  const fetchAdminConfig = async (channelId: string) => {
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/admin/config?channelId=${channelId}`);
      const data = await res.json();
      setAdminText(data.text || "");
    } catch (e) {
      console.error("Failed to fetch admin config");
    }
  };

  const pushAdminUpdate = async () => {
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/admin/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: adminChannelId, text: adminText, mode: updateMode }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === "success") {
        alert("Push successful!");
      } else {
        alert(`Push failed: ${data.error || data.message || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Push Error:", e);
      alert("Network Error: Could not connect to the bot API. Make sure the bot is online.");
    }
  };

  const triggerSummary = async () => {
    setSummaryMessage("Generating...");
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/daily-summary`);
      const data = await res.json();
      setSummaryMessage(data.message || "Summary generated!");
      setTimeout(() => setSummaryMessage(""), 3000);
    } catch (e) {
      setSummaryMessage("Failed to generate summary.");
    }
  };

  const sendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage) return;
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: alertMessage }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setAlertMessage("");
        fetchLogs();
      }
    } catch (e) {
      alert("Failed to send alert.");
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchStatus();
      await fetchLogs();
      await fetchSummaries();
      await fetchAdminConfig(adminChannelId);
      setLoading(false);
    };
    init();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <p className="text-[10px] uppercase tracking-widest font-black animate-pulse">Initializing Vellum Ops...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Tab Navigation */}
      <div className="flex items-center gap-8 border-b border-border/50 pb-4">
        {[
          { id: "operations", label: "Operations" },
          { id: "admin", label: "Admin Control" },
          { id: "insights", label: "AI Insights" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`text-[10px] uppercase tracking-[0.3em] font-black transition-all ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary pb-4 -mb-[18px]"
                : "text-muted-foreground hover:text-foreground pb-4"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "operations" && (
        <>
          {/* Bot Health & Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 glass-panel rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Bot Health</h3>
                <div className="status-pulse">
                  <span className={`status-pulse-ring ${status ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`status-pulse-dot ${status ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-black tracking-tighter uppercase italic">{status ? "Online" : "Offline"}</p>
                <p className="text-[9px] font-mono text-muted-foreground uppercase">{status?.system || "Vellum Operations"}</p>
              </div>
            </div>

            <div className="p-6 glass-panel rounded-2xl flex flex-col justify-between">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Quick Actions</h3>
              <div className="flex gap-4 mt-4">
                <button 
                  onClick={triggerSummary}
                  className="px-4 py-2 border border-border rounded-xl text-[9px] uppercase tracking-widest font-black hover:bg-accent transition-all active:scale-95"
                >
                  Trigger AI Summary
                </button>
                {summaryMessage && <p className="text-[8px] italic opacity-60 mt-1">{summaryMessage}</p>}
              </div>
            </div>
            
            <div className="p-6 glass-panel rounded-2xl flex flex-col justify-between">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">System Version</h3>
              <p className="text-2xl font-black tracking-tighter uppercase italic">{status?.version || "1.0.0"}</p>
            </div>
          </div>

          {/* Main Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Logs */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-black">Live Server Logs</h3>
                <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">{logs.length} entries</span>
              </div>
              <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
                <div className="h-[400px] overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                  {logs.length === 0 ? (
                    <p className="text-[10px] italic text-muted-foreground p-4">No logs found in Vellum database.</p>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="py-2 border-b border-border/20 last:border-0 flex gap-4 text-[11px] hover:bg-accent/50 transition-colors px-2 rounded-lg">
                        <span className="text-muted-foreground opacity-50 shrink-0 font-mono">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold uppercase tracking-tight">{log.author}</span>
                          <span className="text-muted-foreground tracking-tight leading-relaxed">{log.content}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Global Alert System */}
            <aside className="space-y-6">
              <div className="p-6 glass-panel rounded-2xl space-y-6">
                <div className="space-y-1">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-black italic">Broadcast Center</h3>
                  <p className="text-[8px] uppercase tracking-widest text-muted-foreground">Send real-time alerts</p>
                </div>
                
                <form onSubmit={sendAlert} className="space-y-4">
                  <div className="space-y-2">
                    <textarea 
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      placeholder="Enter alert message..."
                      className="w-full h-24 bg-accent/50 border border-border rounded-xl p-3 text-[11px] tracking-tight placeholder:opacity-30 focus:outline-none focus:ring-1 focus:ring-ring transition-all resize-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-90 active:scale-95 transition-all"
                  >
                    Dispatch Alert
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </>
      )}

      {activeTab === "admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
           <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-black">Remote Channel Editor</h3>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Update administrative channels in real-time</p>
                </div>
                <select 
                  value={adminChannelId} 
                  onChange={(e) => {
                    setAdminChannelId(e.target.value);
                    fetchAdminConfig(e.target.value);
                  }}
                  className="bg-accent/50 border border-border rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none"
                >
                  <option value="1474302805866057749">#rules</option>
                  <option value="1474302396476686408">#welcome</option>
                  <option value="1474317289833631826">#announcements</option>
                </select>
              </div>

              <div className="glass-panel rounded-3xl p-8 space-y-6">
                <textarea 
                  value={adminText}
                  onChange={(e) => setAdminText(e.target.value)}
                  placeholder="Enter channel content..."
                  className="w-full h-[300px] bg-transparent border-none text-[13px] leading-relaxed tracking-tight placeholder:opacity-20 focus:outline-none resize-none font-mono"
                />
                
                <div className="flex items-center justify-between border-t border-border/30 pt-6">
                  <div className="flex gap-2">
                    {[
                      { id: 'edit', label: 'Edit Last' },
                      { id: 'replace', label: 'Replace All' },
                      { id: 'append', label: 'New Post' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setUpdateMode(mode.id as any)}
                        className={`px-4 py-2 rounded-lg text-[9px] uppercase tracking-widest font-black transition-all ${
                          updateMode === mode.id 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-accent/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={pushAdminUpdate}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-90 active:scale-95 transition-all shadow-xl"
                  >
                    Push to Discord
                  </button>
                </div>
              </div>
           </div>
           <aside className="p-6 border border-border/50 rounded-2xl h-fit">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-black mb-4">How it works</h4>
              <ul className="space-y-4 text-[9px] uppercase tracking-widest text-muted-foreground leading-relaxed">
                <li>• **Edit Last**: Bot will try to find and update its most recent message in the channel.</li>
                <li>• **Replace All**: Bot will delete its previous content and send a fresh message.</li>
                <li>• **New Post**: Bot will ignore previous history and send a new message.</li>
              </ul>
           </aside>
        </div>
      )}

      {activeTab === "insights" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
           <div className="space-y-1 px-2">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-black">AI Server Insights</h3>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Historical server operations summaries</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {summaries.length === 0 ? (
                <div className="p-12 glass-panel rounded-3xl text-center">
                  <p className="text-[11px] italic text-muted-foreground">No insights logged yet. AI summaries appear here after they are generated.</p>
                </div>
              ) : (
                summaries.map((summary, i) => (
                  <div key={i} className="glass-panel rounded-3xl p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-border/30 pb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">Insight #{summaries.length - i}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">{new Date(summary.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-[13px] leading-relaxed tracking-tight text-muted-foreground prose prose-invert max-w-none">
                       {summary.content.split('\n').map((line: string, j: number) => (
                         <p key={j}>{line}</p>
                       ))}
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>
      )}
    </div>
  );
}
