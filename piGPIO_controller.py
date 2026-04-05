from http.server import BaseHTTPRequestHandler, HTTPServer
import time
import RPi.GPIO as GPIO
import urllib.parse
import subprocess
import threading

PIN_LIGHT = 17
PIN_MOTION = 14

motion_enabled = False
motion_state = False
last_capture_time = 0
process = None

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_LIGHT, GPIO.OUT)
GPIO.output(PIN_LIGHT, GPIO.HIGH)  # default OFF
GPIO.setup(PIN_MOTION, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        global motion_enabled 
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

        elif path == "/motion/on":
            motion_enabled
            motion_enabled = True

            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Motion ENABLED")

        elif path == "/motion/off":
            motion_enabled
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

    print("Motion thread started")

    while True:
        if not motion_enabled:
            time.sleep(0.5)
            continue

        current_input = GPIO.input(PIN_MOTION)

        if current_input:
            if not motion_state:
                print("🚨 Motion Detected!")
                motion_state = True

                if (time.time() - last_capture_time > 10 and
                    (process is None or process.poll() is not None)):

                    print("📸 Triggering capture script...")
                    last_capture_time = time.time()
                    process = subprocess.Popen(["python3", "upload.py"])
                    

        else:
            if motion_state:
                print("Motion cleared")
                motion_state = False

        time.sleep(0.5)

# start thread
threading.Thread(target=monitor_motion, daemon=True).start()

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
