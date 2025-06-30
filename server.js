const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;
const FILE = 'leaderboard.json';

app.use(cors());
app.use(express.json());

function getLeaderboardData() {
    if (!fs.existsSync(FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(FILE));
    } catch {
        return {};
    }
}

function saveLeaderboardData(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

app.get('/leaderboard', (req, res) => {
    const size = req.query.size;
    const data = getLeaderboardData();
    let arr = (data[size] || []);
    // Sort by timeSec, then moves
    arr = arr.sort((a, b) => a.timeSec - b.timeSec || a.moves - b.moves);
    res.json(arr.slice(0, 10));
});

app.post('/leaderboard', (req, res) => {
    const { name, moves, time, timeSec, size } = req.body;
    if (!name || !size) return res.status(400).json({ error: "Missing name or size" });
    const data = getLeaderboardData();
    if (!data[size]) data[size] = [];
    // Check for existing entry
    const idx = data[size].findIndex(e => e.name.toLowerCase() === name.toLowerCase());
    if (idx !== -1) {
        const old = data[size][idx];
        // Only update if new time is less, or if time is same and moves are less
        if (timeSec < old.timeSec || (timeSec === old.timeSec && moves < old.moves)) {
            data[size][idx] = { name, moves, time, timeSec, size };
        }
    } else {
        data[size].push({ name, moves, time, timeSec, size });
    }
    saveLeaderboardData(data);
    res.json({ status: "ok" });
});

app.listen(PORT, () => console.log(`Leaderboard server running on port ${PORT}`));