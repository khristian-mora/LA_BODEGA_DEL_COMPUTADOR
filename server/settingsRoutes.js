// CMS Settings Routes
import { db } from './db.js';

export const getSettings = (req, res) => {
    db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);
        res.json(settings);
    });
};

export const updateSettings = (req, res) => {
    const settings = req.body; // { key: value, ... }

    db.serialize(() => {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        Object.entries(settings).forEach(([key, value]) => {
            stmt.run(key, value);
        });
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
};
