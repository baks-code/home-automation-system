const express = require('express');
const app = express();
const { createProxyMiddleware } = require('http-proxy-middleware');


app.use(express.static('public'));
app.use(express.json()); // 👈 IMPORTANT for POST data

// Route that handles button click
app.post('/action', async (req, res) => {
    const deviceID = req.body.device_ID;
    const newState = req.body.new_State;

    console.log("===============================================");
    console.log("Target Device: ", deviceID);
    console.log("Action: ", newState);

    if(deviceID == "living-light-1"){
        await fetch("http://127.0.0.1:4000/light/" + (newState ? "on" : "off"));

        res.json({ message: `Switched ${deviceID} ${newState ? "ON" : "OFF"}` });
    }

    
    //res.json({ message: `Switched ${deviceID} ${newState ? "ON" : "OFF"}` });
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
