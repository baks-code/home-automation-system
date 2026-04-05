const express = require('express');
const app = express();
const { createProxyMiddleware } = require('http-proxy-middleware');


app.use(express.static('public'));
app.use(express.json()); // 👈 IMPORTANT for POST data

//device state
const devicesState = {
    mainLight: false,
    motionSensor: false,
    doorSensor: false
};

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
        }else if (deviceID === "motionSensor") {

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

    console.log("🚨 Motion event received:", image_link);

    if (!image_link) {
        return res.status(400).json({ success: false });
    }

    console.log(`📸 New motion image: ${image_link}`);

    res.json({ success: true });
});


app.use('/camera', createProxyMiddleware({
    target: 'http://192.168.0.141:8001',
    pathRewrite: {
        '^/camera': '/stream'
    },
    changeOrigin: true,
    ws: true,
    selfHandleResponse: false,
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['Cache-Control'] = 'no-cache, private';
        // Remove any content-length that could truncate the stream
        delete proxyRes.headers['content-length'];
    }
}));

app.listen(8000, () => console.log("Server running"));
