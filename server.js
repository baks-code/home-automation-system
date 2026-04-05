const express = require('express');
const app = express();
const Database = require('better-sqlite3');
const db = new Database('event_history.db');


db.exec(`
    CREATE TABLE IF NOT EXISTS event_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        url TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_timestamp ON event_history(timestamp);
`);


app.use(express.static('public'));
app.use(express.json()); // 👈 IMPORTANT for POST data
app.set('view engine', 'ejs');

//device state
const devicesState = {
    mainLight: false,
    motionSensor: false,
    doorSensor: false
};

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/dashboard', (req, res) => {
    try {
        // 1. Get the 4 most recent events (Images, Lights, System, etc.)
        const recentEvents = db.prepare(`
            SELECT * FROM event_history 
            ORDER BY timestamp DESC LIMIT 4
        `).all();
        res.render('dashboard', { recentEvents });
    } catch (err) {
        console.error("Dashboard DB Error:", err);
        res.render('dashboard', { recentEvents: []});
    }
});

// Route that handles button click
app.post('/action', async (req, res) => {
    const deviceID = req.body.device_ID;
    const newState = req.body.new_State;

    console.log("===============================================");
    console.log("Target Device: ", deviceID);
    console.log("Action: ", newState);

    try {
        let targetPath = "";
        let eventType = "";

        // 1. Determine the path and event type
        if (deviceID === "mainLight") {
            targetPath = "/light/" + (newState ? "on" : "off");
            eventType = newState ? "LIGHT_ON" : "LIGHT_OFF";
        } else if (deviceID === "motionSensor") {
            targetPath = "/motion/" + (newState ? "on" : "off");
            eventType = newState ? "MOTION_ENABLED" : "MOTION_DISABLED";
        }

        // 2. Perform the fetch to the hardware
        const response = await fetch("http://127.0.0.1:4000" + targetPath);

        if (!response.ok) {
            return res.status(500).json({ success: false, message: "Device unreachable" });
        }

        // 3. LOG TO DATABASE (The "History" part)
        try {
            const stmt = db.prepare(`INSERT INTO event_history (event_type, url) VALUES (?, ?)`);
            const info = stmt.run(eventType, null);

            console.log(`Event Logged: ${eventType} (ID: ${info.lastInsertRowid})`);
        } catch (err) {
            console.error("History Log Error:", err.message);
        }

        // 4. Update local state and respond
        devicesState[deviceID] = newState;
        return res.json({
            success: true,
            message: `Switched ${deviceID} ${newState ? "ON" : "OFF"}`
        });

    } catch (error) {
        console.error("System Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }


    //res.json({ message: `Switched ${deviceID} ${newState ? "ON" : "OFF"}` });
});

app.get('/temperature', async (req, res) => {
    const MAX_RETRIES = 5;
    const DELAY_MS = 500;

    try {
        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                const response = await fetch("http://127.0.0.1:4000/temperature");

                if (!response.ok) {
                    throw new Error("Bad response");
                }

                const text = await response.text();

                if (text === "error" || !text.includes(",")) {
                    throw new Error("Sensor error");
                }

                const [temperature, humidity] = text.split(",");

                return res.json({
                    temperature: parseFloat(temperature),
                    humidity: parseFloat(humidity)
                });

            } catch (err) {
                // retry after delay
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }

        res.status(500).json({ error: "Failed after 5 retries" });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.get('/devices-state', async (req, res) => {
    try {
        res.json(devicesState);
    } catch (err) {
        res.status(500).json({ error: "Failed to get device states" });
    }
});

//internal route for motion events
app.post('/motion-event', (req, res) => {
    const { image_link } = req.body;
    const info = db.prepare('INSERT INTO event_history (event_type, url) VALUES (?, ?)').run('MOTION', image_link || null);
    res.json({ success: true, id: info.lastInsertRowid });
});

app.get('/history', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM event_history ORDER BY timestamp DESC LIMIT 50').all();
        res.render('history', { events: rows });
    } catch (err) {
        res.render('history', { events: [] });
    }
});


app.listen(8000, () => console.log("Server running"));
