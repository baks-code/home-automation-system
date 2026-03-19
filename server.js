const express = require('express');
const app = express();

app.use(express.static('public'));
app.use(express.json()); // 👈 IMPORTANT for POST data

// Route that handles button click
app.post('/action', (req, res) => {
    const deviceID = req.body.device_ID;
    const newState = req.body.new_State;

    console.log("===============================================");
    console.log("Target Device: ", deviceID);
    console.log("Action: ", newState);

    res.json({ message: `Switched ${deviceID} ${newState ? "ON" : "OFF"}` });
});

app.listen(8000, () => console.log("Server running"));
