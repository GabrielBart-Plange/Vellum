import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/vellum_bot.json');

// Ensure data dir exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Ensure file exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ 
    messages: [], 
    summaries: [],
    admin_tracking: {}, // { channelId: lastMessageId }
    admin_configs: {}, // { channelId: { text: "...", lastUpdated: 0 } }
    server_stats: {} 
  }), 'utf-8');
}

export const db = {
  read: () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')),
  write: (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8'),
  logMessage: (message: any) => {
    const data = db.read();
    data.messages.push(message);
    db.write(data);
  },
  logSummary: (summary: string) => {
    const data = db.read();
    if (!data.summaries) data.summaries = [];
    data.summaries.push({
      content: summary,
      timestamp: Date.now()
    });
    db.write(data);
  },
  trackAdminMessage: (channelId: string, messageId: string) => {
    const data = db.read();
    if (!data.admin_tracking) data.admin_tracking = {};
    data.admin_tracking[channelId] = messageId;
    db.write(data);
  },
  saveAdminConfig: (channelId: string, text: string) => {
    const data = db.read();
    if (!data.admin_configs) data.admin_configs = {};
    data.admin_configs[channelId] = {
      text,
      lastUpdated: Date.now()
    };
    db.write(data);
  },
  getAdminConfig: (channelId: string) => {
    const data = db.read();
    return data.admin_configs?.[channelId] || null;
  },
  getAdminMessageId: (channelId: string) => {
    const data = db.read();
    return data.admin_tracking?.[channelId] || null;
  }
};
