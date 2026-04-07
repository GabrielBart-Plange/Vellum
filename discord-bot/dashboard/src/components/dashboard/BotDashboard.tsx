"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext"; // Assuming common context or separate auth

const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || "http://localhost:4001";
const BOT_API_KEY = process.env.NEXT_PUBLIC_BOT_API_KEY || "";

const CHANNEL_NAMES: Record<string, string> = {
  '1474317463264170088': '#bug-reports',
  '1474317372985839711': '#feature-requests',
  '1474306854288101499': '#support-chat',
  '1474317289833631826': '#dev-updates',
  '1474304640165347398': '#fan-creations',
  '1474313522652647516': '#story-feedback',
  '1474310525813788764': '#tech-questions',
  '1474301996709314690': '#events',
  '1474302396476686408': '#welcome',
  '1474302805866057749': '#rules',
};

interface BotStatus {
  status: string;
  system: string;
  version: string;
  endpoints: string[];
}

export default function BotDashboard() {
  const [activeTab, setActiveTab] = useState<"operations" | "moderation" | "insights" | "admin">("operations");
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [summaries, setSummaries] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [riskUsers, setRiskUsers] = useState<any[]>([]);
  const [modHistory, setModHistory] = useState<any[]>([]);
  const [trackedChannels, setTrackedChannels] = useState<any[]>([]);
  const [spotlightId, setSpotlightId] = useState("");
  const [spotlightData, setSpotlightData] = useState<{ profile: any, logs: any[] } | null>(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState("chat");
  const [loading, setLoading] = useState(true);
  const [modLoading, setModLoading] = useState(false);
  
  // Admin State
  const [adminChannelId, setAdminChannelId] = useState("1474302805866057749"); // Defaults to Rules
  const [adminText, setAdminText] = useState("");
  const [updateMode, setUpdateMode] = useState<"replace" | "edit" | "append">("edit");
  
  const [summaryMessage, setSummaryMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const fetchModerationData = async () => {
    setModLoading(true);
    try {
      const headers = { 'x-api-key': BOT_API_KEY };
      const [propRes, riskRes, historyRes] = await Promise.all([
        fetch(`${BOT_API_URL}/api/discord/moderation/proposals`, { headers }),
        fetch(`${BOT_API_URL}/api/discord/moderation/risk-users`, { headers }),
        fetch(`${BOT_API_URL}/api/discord/moderation/history`, { headers })
      ]);

      if (!propRes.ok || !riskRes.ok || !historyRes.ok) {
        throw new Error(`HTTP error! status: ${propRes.status}, ${riskRes.status}, ${historyRes.status}`);
      }

      const propData = await propRes.json();
      const riskData = await riskRes.json();
      const historyData = await historyRes.json();
      
      setProposals(Array.isArray(propData) ? propData : []);
      setRiskUsers(Array.isArray(riskData) ? riskData : []);
      setModHistory(Array.isArray(historyData) ? historyData : []);
    } catch (e) {
      console.error("Failed to fetch moderation data:", e);
    } finally {
      setModLoading(false);
    }
  };

  const handleProposal = async (proposalId: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/moderation/proposals/handle`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": BOT_API_KEY
        },
        body: JSON.stringify({ proposalId, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchModerationData();
      }
    } catch (e) {
      alert("Failed to handle proposal.");
    }
  };

  const generateNewProposals = async () => {
    setModLoading(true);
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/moderation/generate-proposals`, {
        method: "POST",
        headers: { "x-api-key": BOT_API_KEY }
      });
      const data = await res.json();
      if (data.success) {
        fetchModerationData();
      }
    } catch (e) {
      alert("Failed to generate proposals.");
    } finally {
      setModLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${BOT_API_URL}/`, {
        headers: { "x-api-key": BOT_API_KEY }
      });
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Failed to connect to Bot API:", e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/logs`, {
        headers: { "x-api-key": BOT_API_KEY }
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaries = async () => {
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/admin/summaries`, {
        headers: { "x-api-key": BOT_API_KEY }
      });
      const data = await res.json();
      setSummaries(data.reverse());
    } catch (e) {
      console.error("Failed to fetch summaries:", e);
    }
  };

  const fetchAdminConfig = async (channelId: string) => {
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/admin/config?channelId=${channelId}`, {
        headers: { "x-api-key": BOT_API_KEY }
      });
      const data = await res.json();
      setAdminText(data.text || "");
    } catch (e) {
      console.error("Failed to fetch admin config:", e);
    }
  };

  const fetchTrackedChannels = async () => {
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/admin/channels`, {
        headers: { "x-api-key": BOT_API_KEY }
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setTrackedChannels(data);
    } catch (e) {
      console.error("Failed to fetch tracked channels:", e);
    }
  };

  const fetchUserSpotlight = async (idOrEvent?: string | React.FormEvent) => {
    let id = spotlightId;
    
    if (idOrEvent && typeof idOrEvent !== 'string') {
      idOrEvent.preventDefault();
    } else if (typeof idOrEvent === 'string') {
      id = idOrEvent;
    }

    if (!id) return;
    setModLoading(true);
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/moderation/user-spotlight?userId=${id}`, {
        headers: { "x-api-key": BOT_API_KEY }
      });
      if (!res.ok) throw new Error("User not found or fetch failed");
      const data = await res.json();
      setSpotlightData(data);
    } catch (e) {
      alert("Failed to find user data. Make sure the ID is correct.");
      setSpotlightData(null);
    } finally {
      setModLoading(false);
    }
  };

  const createChannel = async () => {
    if (!newChannelName) return;
    setModLoading(true);
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/admin/channels/create`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": BOT_API_KEY
        },
        body: JSON.stringify({ name: newChannelName, type: newChannelType }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewChannelName("");
        await fetchTrackedChannels();
        alert(data.message);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (e) {
      alert("Failed to create channel.");
    } finally {
      setModLoading(false);
    }
  };

  const deleteChannel = async (channelId: string) => {
    if (!confirm("Delete this channel from Discord? This is permanent.")) return;
    setModLoading(true);
    try {
      const res = await fetch(`${BOT_API_URL}/api/discord/admin/channels/delete`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": BOT_API_KEY
        },
        body: JSON.stringify({ channelId }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchTrackedChannels();
        alert(data.message);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (e) {
      alert("Failed to delete channel.");
    } finally {
      setModLoading(false);
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
      await fetchModerationData();
      await fetchTrackedChannels();
      setLoading(false);
    };
    init();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
      if (activeTab === 'moderation') fetchModerationData();
    }, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [activeTab]);

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
          { id: "moderation", label: "Moderation" },
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
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-black">Live Server Logs</h3>
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-accent/50 border border-border rounded-lg px-2 py-1 text-[8px] font-black uppercase tracking-widest focus:outline-none"
                  >
                    <option value="all">All Channels</option>
                    <option value="bug">Bugs</option>
                    <option value="feature">Features</option>
                    <option value="support">Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="fan_creation">Fan Creations</option>
                  </select>
                </div>
                <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">{logs.length} entries</span>
              </div>
              <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
                <div className="h-[400px] overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                  {logs.filter(l => filterType === 'all' || l.type === filterType).length === 0 ? (
                    <p className="text-[10px] italic text-muted-foreground p-4">No matching logs found.</p>
                  ) : (
                    logs.filter(l => filterType === 'all' || l.type === filterType).map((log, i) => (
                      <div key={i} className="py-2 border-b border-border/20 last:border-0 flex gap-4 text-[11px] hover:bg-accent/50 transition-colors px-2 rounded-lg">
                        <span className="text-muted-foreground opacity-50 shrink-0 font-mono">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <div className="flex flex-col gap-0.5 w-full">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold uppercase tracking-tight">{log.authorName}</span>
                              {log.type && (
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                  log.type === 'bug' ? 'bg-red-500/10 text-red-500' :
                                  log.type === 'feature' ? 'bg-blue-500/10 text-blue-500' :
                                  log.type === 'support' ? 'bg-green-500/10 text-green-500' :
                                  'bg-primary/10 text-primary'
                                }`}>
                                  {log.type}
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] opacity-30 font-mono uppercase">Channel: {CHANNEL_NAMES[log.channelId] || log.channelId.slice(-4)}</span>
                          </div>
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

      {activeTab === "moderation" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-black">Behavioral Intelligence</h3>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">AI analysis of user interactions and risk profiles</p>
            </div>
            <button 
              onClick={generateNewProposals}
              disabled={modLoading}
              className="px-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[9px] uppercase tracking-widest font-black hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {modLoading ? "Analyzing..." : "Refresh AI Proposals"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Risk Profiles & Search */}
            <div className="space-y-8">
              {/* User Spotlight Search */}
              <div className="p-6 glass-panel rounded-2xl space-y-4">
                <div className="space-y-1">
                  <h4 className="text-[9px] uppercase tracking-[0.3em] font-black italic">User Spotlight</h4>
                  <p className="text-[8px] uppercase tracking-widest text-muted-foreground">Search behavioral history by ID</p>
                </div>
                <form onSubmit={fetchUserSpotlight} className="flex gap-2">
                  <input 
                    type="text"
                    value={spotlightId}
                    onChange={(e) => setSpotlightId(e.target.value)}
                    placeholder="Enter Discord User ID"
                    className="flex-1 bg-accent/30 border border-border rounded-lg p-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={modLoading || !spotlightId}
                    className="px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[9px] font-black uppercase hover:bg-primary/20 transition-all disabled:opacity-50"
                  >
                    🔍
                  </button>
                </form>

                {spotlightData && (
                  <div className="pt-4 border-t border-border/30 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase">{spotlightData.profile?.username || "Unknown"}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                        (spotlightData.profile?.riskScore || 0) > 70 ? 'bg-red-500/20 text-red-500' : 
                        (spotlightData.profile?.riskScore || 0) > 40 ? 'bg-yellow-500/20 text-yellow-500' : 
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {spotlightData.profile?.riskScore || 0}% RISK
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[8px] uppercase font-bold text-muted-foreground">Recent Activity</p>
                      <div className="max-h-[150px] overflow-y-auto space-y-1 pr-2 scrollbar-thin">
                        {spotlightData.logs.map((log, i) => (
                          <div key={i} className="text-[9px] p-2 bg-accent/20 rounded border border-border/30">
                            <p className="text-muted-foreground leading-tight italic">"{log.content}"</p>
                            <div className="flex justify-between mt-1 opacity-40">
                              <span className="text-[7px] uppercase">{CHANNEL_NAMES[log.channelId] || 'Unknown'}</span>
                              <span className="text-[7px]">{new Date(log.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => setSpotlightData(null)}
                      className="w-full py-1.5 text-[8px] uppercase font-black text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear Spotlight
                    </button>
                  </div>
                )}
              </div>

              {/* Risk Profiles */}
              <div className="space-y-4">
                <h4 className="text-[9px] uppercase tracking-[0.3em] font-black text-muted-foreground px-2">High Risk Profiles</h4>
                <div className="glass-panel rounded-2xl overflow-hidden border border-border/50 h-[400px] flex flex-col">
                  <div className="overflow-y-auto p-4 space-y-3 flex-1 scrollbar-thin">
                    {riskUsers.length === 0 ? (
                      <p className="text-[10px] italic text-muted-foreground p-4">No high-risk behaviors detected.</p>
                    ) : (
                      riskUsers.map((user, i) => (
                        <div key={i} className="p-4 bg-accent/30 rounded-xl border border-border/50 space-y-3 cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => {
                            setSpotlightId(user.userId);
                            fetchUserSpotlight(user.userId);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-tight">{user.username}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              user.riskScore > 70 ? 'bg-red-500/20 text-red-500' : 
                              user.riskScore > 40 ? 'bg-yellow-500/20 text-yellow-500' : 
                              'bg-blue-500/20 text-blue-500'
                            }`}>
                              {user.riskScore}% RISK
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <p className="text-[8px] uppercase text-muted-foreground">Toxic</p>
                              <div className="h-1 bg-border rounded-full overflow-hidden">
                                <div className="h-full bg-red-500" style={{ width: `${user.averages.toxic * 100}%` }}></div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] uppercase text-muted-foreground">Spam</p>
                              <div className="h-1 bg-border rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: `${user.averages.spam * 100}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Proposals */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-[9px] uppercase tracking-[0.3em] font-black text-muted-foreground px-2">AI Governance Proposals</h4>
              <div className="space-y-4">
                {proposals.length === 0 ? (
                  <div className="p-12 glass-panel rounded-3xl text-center border border-border/50">
                    <p className="text-[11px] italic text-muted-foreground">No pending AI proposals. Click "Refresh" to analyze recent activity.</p>
                  </div>
                ) : (
                  proposals.map((prop, i) => (
                    <div key={i} className="glass-panel rounded-2xl p-6 border border-border/50 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                            prop.type === 'punishment' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'
                          }`}>
                            {prop.type}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">Target: {prop.target}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleProposal(prop.id, 'rejected')}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                          <button 
                            onClick={() => handleProposal(prop.id, 'approved')}
                            className="p-2 hover:bg-green-500/10 text-green-500 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[13px] font-bold tracking-tight text-foreground">{prop.content}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed bg-accent/20 p-3 rounded-lg border border-border/30 italic">
                          " {prop.reasoning} "
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Moderation History */}
          <div className="space-y-4">
            <h4 className="text-[9px] uppercase tracking-[0.3em] font-black text-muted-foreground px-2">Moderation History</h4>
            <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
              <div className="h-[300px] overflow-y-auto p-4 space-y-2 scrollbar-thin">
                {modHistory.length === 0 ? (
                  <p className="text-[10px] italic text-muted-foreground p-4">No moderation history recorded.</p>
                ) : (
                  modHistory.map((item, i) => (
                    <div key={i} className="py-3 border-b border-border/10 last:border-0 flex items-center justify-between px-4 hover:bg-accent/30 transition-colors rounded-lg">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold uppercase tracking-tight">Target ID: {item.targetId}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                            item.type === 'xp_reduction' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{item.action}</span>
                      </div>
                      <span className="text-[9px] font-mono opacity-40 uppercase shrink-0">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "admin" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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

          {/* Channel Management Section */}
          <div className="space-y-6">
            <div className="space-y-1 px-2">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-black">Server Structure Management</h3>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Create or remove channels and sync AI tracking</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Create Channel Form */}
              <div className="p-6 glass-panel rounded-2xl space-y-6">
                <div className="space-y-1">
                  <h4 className="text-[9px] uppercase tracking-[0.3em] font-black italic">Provision New Channel</h4>
                  <p className="text-[8px] uppercase tracking-widest text-muted-foreground">Adds to Discord & AI Monitoring</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] uppercase font-black text-muted-foreground ml-1">Channel Name</label>
                    <input 
                      type="text"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="e.g. feedback-loop"
                      className="w-full bg-accent/50 border border-border rounded-xl p-3 text-[11px] tracking-tight focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] uppercase font-black text-muted-foreground ml-1">Tracking Category</label>
                    <select 
                      value={newChannelType}
                      onChange={(e) => setNewChannelType(e.target.value)}
                      className="w-full bg-accent/50 border border-border rounded-xl p-3 text-[11px] tracking-tight focus:outline-none transition-all"
                    >
                      <option value="chat">General Chat</option>
                      <option value="bug">Bug Reports</option>
                      <option value="feature">Feature Requests</option>
                      <option value="support">Support Tickets</option>
                      <option value="feedback">Community Feedback</option>
                      <option value="fan_creation">Fan Creations</option>
                    </select>
                  </div>
                  <button 
                    onClick={createChannel}
                    disabled={modLoading || !newChannelName}
                    className="w-full py-3 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {modLoading ? "Provisioning..." : "Create & Track"}
                  </button>
                </div>
              </div>

              {/* Tracked Channels List */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-[9px] uppercase tracking-[0.3em] font-black text-muted-foreground px-2">Currently Tracked Channels</h4>
                <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
                  <div className="h-[300px] overflow-y-auto p-4 space-y-2 scrollbar-thin">
                    {trackedChannels.length === 0 ? (
                      <p className="text-[10px] italic text-muted-foreground p-4">No channels tracked yet.</p>
                    ) : (
                      trackedChannels.map((ch, i) => (
                        <div key={i} className="py-3 border-b border-border/10 last:border-0 flex items-center justify-between px-4 hover:bg-accent/30 transition-colors rounded-lg">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-bold uppercase tracking-tight">#{ch.name}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                ch.type === 'bug' ? 'bg-red-500/10 text-red-500' :
                                ch.type === 'feature' ? 'bg-blue-500/10 text-blue-500' :
                                'bg-primary/10 text-primary'
                              }`}>
                                {ch.type}
                              </span>
                              {!ch.exists && (
                                <span className="text-[8px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded font-black uppercase italic">
                                  Missing in Discord
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-mono opacity-40 uppercase shrink-0">ID: {ch.id}</span>
                          </div>
                          <button 
                            onClick={() => deleteChannel(ch.id)}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                            title="Delete Channel"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                      <span className="text-[9px] font-mono text-muted-foreground">
                        {summary.timestamp?.seconds 
                          ? new Date(summary.timestamp.seconds * 1000).toLocaleString() 
                          : new Date(summary.timestamp).toLocaleString()}
                      </span>
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
