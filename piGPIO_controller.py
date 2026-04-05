from http.server import BaseHTTPRequestHandler, HTTPServer
import time
import RPi.GPIO as GPIO
import urllib.parse
import subprocess
import threading
import requests  # Added this import for Node.js communication

# PIN CONFIGURATION
PIN_LIGHT = 17
PIN_MOTION = 14
PIN_DOOR_LOCK = 22
PIN_REED_SWITCH = 26

# GLOBAL STATES
motion_enabled = False
door_sensor_enabled = False  # Standardised name
motion_state = False
door_physical_state = "CLOSED"  # Added missing initial state
last_capture_time = 0
process = None

# GPIO SETUP
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_LIGHT, GPIO.OUT)
GPIO.output(PIN_LIGHT, GPIO.HIGH)  # default OFF
GPIO.setup(PIN_MOTION, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.setup(PIN_REED_SWITCH, GPIO.IN, pull_up_down=GPIO.PUD_UP) # Setup Reed Switch

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        global motion_enabled, door_sensor_enabled
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if path == "/":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"GPIO Server Running")

        elif path == "/light/on":
            GPIO.output(PIN_LIGHT, GPIO.LOW)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Light ON")

        elif path == "/light/off":
            GPIO.output(PIN_LIGHT, GPIO.HIGH)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Light OFF")
            
        elif path == "/door/on":
            door_sensor_enabled = True # Fixed variable name
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Door Sensor ENABLED")

        elif path == "/door/off":
            door_sensor_enabled = False # Fixed variable name
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Door Sensor DISABLED")

        elif path == "/motion/on":
            motion_enabled = True
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Motion ENABLED")

        elif path == "/motion/off":
            motion_enabled = False
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Motion DISABLED")

        elif path == "/temperature":
            temp_hum = subprocess.run(["python3", "temperature.py"], capture_output=True, text=True).stdout.strip()
            self.send_response(200)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(temp_hum.encode())

        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")

def monitor_motion():
    global motion_enabled, motion_state, last_capture_time, process
    print("Motion monitor started")
    while True:
        if not motion_enabled:
            time.sleep(0.5)
            continue

        if GPIO.input(PIN_MOTION):
            if not motion_state:
                print("🚨 Motion Detected!")
                motion_state = True
                if (time.time() - last_capture_time > 10 and (process is None or process.poll() is not None)):
                    last_capture_time = time.time()
                    process = subprocess.Popen(["python3", "upload.py"])
        else:
            if motion_state:
                motion_state = False
        time.sleep(0.5)

def monitor_door():
    global door_sensor_enabled, door_physical_state
    print("Door monitor started")
    
    while True:
        # 1. Read the physical sensor (1 is OPEN, 0 is CLOSED for Reed)
        current_input = "OPEN" if GPIO.input(PIN_REED_SWITCH) == 1 else "CLOSED"

        # 2. Check if the state changed
        if current_input != door_physical_state:
            door_physical_state = current_input
            print(f"Door state changed to: {door_physical_state}")

            # 3. Only tell Node.js if enabled
            if door_sensor_enabled:
                try:
                    # Fixed the incomplete URL to point to your Node.js server
                    requests.post("http://127.0.0.1:8000/door-event", 
                                  json={"status": door_physical_state}, 
                                  timeout=1)
                except:
                    print("Node.js server not responding to door update")

        time.sleep(0.5)

# Start background threads
threading.Thread(target=monitor_motion, daemon=True).start()
threading.Thread(target=monitor_door, daemon=True).start()

def run():
    server = HTTPServer(("0.0.0.0", 4000), Handler)
    print("Server running on port 4000...")
    server.serve_forever()

if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        GPIO.cleanup()
        print("Stopped")
