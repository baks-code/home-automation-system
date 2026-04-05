const express = require('express');
const app = express();
const sqlite = require('sqlite3');
const db = new sqlite.Database('event_history.db');


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
        const sql = `INSERT INTO event_history (event_type, url) VALUES (?, ?)`;
        db.run(sql, [eventType, null], function (err) {
            if (err) console.error("History Log Error:", err.message);
            else console.log(`Event Logged: ${eventType} (ID: ${this.lastID})`);
        });

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
    const sql = 'INSERT INTO event_history (event_type, url) VALUES (?, ?)';

    db.run(sql, ['MOTION', image_link || null], function (err) {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, id: this.lastID });
    });
});

app.get('/history', (req, res) => {
    const sql = `SELECT * FROM event_history ORDER BY timestamp DESC LIMIT 50`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            // If there's an error, send an empty array so the page doesn't crash
            return res.render('history', { events: [] });
        }

        // Ensure 'rows' is an array before sending
        const eventList = Array.isArray(rows) ? rows : [];
        res.render('history', { events: eventList });
    });
});


app.listen(8000, () => console.log("Server running"));
