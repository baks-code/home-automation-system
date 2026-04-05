const express = require('express');
const app = express();
const Database = require('better-sqlite3');
const db = new Database('event_history.db');



db.exec(`CREATE TABLE IF NOT EXISTS event_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            url TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
           )
          `);





const eventTypes = ['MOTION', 'SYSTEM_START', 'LIGHT_ON', 'LIGHT_OFF'];

// Use a transaction for massive speed (1000 inserts in milliseconds)
const insert = db.prepare('INSERT INTO event_history (event_type, url, timestamp) VALUES (?, ?, ?)');
const insertMany = db.transaction((data) => {
    for (const row of data) insert.run(row.type, row.url, row.time);
});

const dummyData = [];
for (let i = 0; i < 1000; i++) {
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const url = type === 'MOTION' ? `/captures/dummy_image_${i}.jpg` : null;
    
    // Generate a random date from the last 30 days
    const date = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    
    dummyData.push({ type, url, time: date.toISOString() });
}

insertMany(dummyData);
console.log("Successfully inserted 1,000 dummy records into event_history.db")












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
    res.render('dashboard');
});

// Route that handles button click
app.post('/action', async (req, res) => {
    const deviceID = req.body.device_ID;
    const newState = req.body.new_State;

    console.log("===============================================");
    console.log("Target Device: ", deviceID);
    console.log("Action: ", newState);

    try {
        if (deviceID === "mainLight") {

            const response = await fetch(
                "http://127.0.0.1:4000/light/" + (newState ? "on" : "off")
            );

            if (!response.ok) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to reach device"
                });
            }

            devicesState[deviceID] = newState;


            return res.json({
                success: true,
                message: `Switched ${deviceID} ${newState ? "ON" : "OFF"}`
            });
        } else if (deviceID === "motionSensor") {

            const response = await fetch(
                "http://127.0.0.1:4000/motion/" + (newState ? "on" : "off")
            );

            if (!response.ok) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to reach device"
                });
            }

            devicesState[deviceID] = newState;


            return res.json({
                success: true,
                message: `Switched ${deviceID} ${newState ? "ON" : "OFF"}`
            });
        }

    } catch (err) {
        console.error("Error communicating with device:", err);
        return res.status(500).json({
            success: false,
            message: "Error communicating with device"
        });
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

app.post('/motion-event', (req, res) => {
    const { image_link } = req.body;

    console.log("Motion event received:");

    if (!image_link) {
        return res.status(400).json({ success: false });
    }

    try {
        const insert = db.prepare('INSERT INTO event_history (event_type, url) VALUES (?, ?)');
        const info = insert.run('motion_image', image_link || null);
        
        console.log(`Saved event ID: ${info.lastInsertRowid}`);
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (err) {
        console.error("DB Error:", err);
        res.status(500).json({ success: false });
    }

    console.log(`image link: ${image_link}`);

    res.json({ success: true });
});

app.get('/history', (req, res) => {
    // 1. Pull the last 50 events from the DB
    const stmt = db.prepare('SELECT * FROM event_history ORDER BY timestamp DESC LIMIT 50');
    const events = stmt.all();

    // 2. Send the data to the history.ejs file
    res.render('history', { events: events });
});


app.listen(8000, () => console.log("Server running"));
