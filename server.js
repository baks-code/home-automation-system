const express = require('express');
const app = express();
const Database = require('better-sqlite3');
const db = new Database('event_history.db');
const bcrypt = require('bcrypt');
const session = require('express-session');


db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS event_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        url TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_timestamp ON event_history(timestamp);
`);

app.use(session({
    secret: 'super-secret-key-will-be-this-one',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: false, // true ONLY if using HTTPS (Cloudflare = ok later)
        maxAge: 5 * 60 * 1000
    }
}));

app.use(express.static('public'));
app.use(express.json()); // 👈 IMPORTANT for POST data
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    if (req.session.user) {
        req.session._lastActivity = Date.now();
    }
    next();
});

//device state
const devicesState = {
    mainLight: false,
    motionSensor: false,
    doorSensor: false
};

app.get('/', (req, res) => {
    res.redirect('login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = db.prepare(
            "SELECT * FROM users WHERE username = ?"
        ).get(username);

        if (!user) {
            res.render('login', { error: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            res.render('login', { error: "Invalid credentials" });
        }

        // save session
        req.session.user = {
            id: user.id,
            username: user.username
        };

console.log("✅ Session set:", req.session.user);

        // redirect after login
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.get('/dashboard', requireAuth, (req, res) => {

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
app.post('/action', requireAuth, async (req, res) => {
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
        }else if (deviceID === "doorSensor") {
            targetPath = "/door/" + (newState ? "on" : "off");
            eventType = newState ? "DOOR_ENABLED" : "DOOR_DISABLED";
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

app.get('/temperature', requireAuth, async (req, res) => {
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

app.get('/devices-state', requireAuth, async (req, res) => {
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

app.post('/door-event', (req, res) => {
    const { status } = req.body;

    console.log(`Door event received: ${status}`);

    try {
        // 1. Determine the standardized event type
        const eventType = (status === "OPEN") ? "DOOR_OPENED" : "DOOR_CLOSED";

        // 2. Insert into the database (better-sqlite3 is synchronous)
        const stmt = db.prepare('INSERT INTO event_history (event_type, url) VALUES (?, ?)');
        const info = stmt.run(eventType, null);

        console.log(`Event Logged: ${eventType} (ID: ${info.lastInsertRowid})`);

        // 3. Respond to the Raspberry Pi
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


app.get('/history', requireAuth, (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM event_history ORDER BY timestamp DESC LIMIT 50').all();
        res.render('history', { events: rows });
    } catch (err) {
        res.render('history', { events: [] });
    }
});

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

app.listen(8000, () => console.log("Server running"));
