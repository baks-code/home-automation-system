from http.server import BaseHTTPRequestHandler, HTTPServer
import RPi.GPIO as GPIO
import urllib.parse

PIN = 17

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN, GPIO.OUT)
GPIO.output(PIN, GPIO.HIGH)  # default OFF

class Handler(BaseHTTPRequestHandler):

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if path == "/light/on":
            GPIO.output(PIN, GPIO.LOW)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Light ON")

        elif path == "/light/off":
            GPIO.output(PIN, GPIO.HIGH)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Light OFF")

        elif path == "/":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"GPIO Server Running")

        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")

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
