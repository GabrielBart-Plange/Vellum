import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/vellum_bot.json');

// Ensure data dir exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Ensure file exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ messages: [], server_stats: {} }), 'utf-8');
}

export const db = {
  read: () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')),
  write: (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8'),
  logMessage: (message: any) => {
    const data = db.read();
    data.messages.push(message);
    db.write(data);
  }
};
