import RPi.GPIO as GPIO
import time
import subprocess
from datetime import datetime

# --- Configuration ---
PIR_PIN = 14
WARMUP_TIME = 60      # Seconds for sensor to stabilize
COOLDOWN_TIME = 10    # Seconds between captures

# --- Setup GPIO ---
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

def log_time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

print(f"[{log_time()}] Warming up PIR sensor...")
time.sleep(WARMUP_TIME)
print(f"[{log_time()}] System Ready. Monitoring for motion...")

motion_state = False
last_capture_time = 0
process = None

try:
    while True:
        current_input = GPIO.input(PIR_PIN)

        if current_input:
            # Motion detected (LOW → HIGH transition)
            if not motion_state:
                print(f"[{log_time()}] 🚨 Motion Detected!")
                motion_state = True

                # Only trigger if:
                # 1. Cooldown has passed
                # 2. No upload script currently running
                if (time.time() - last_capture_time > COOLDOWN_TIME and
                    (process is None or process.poll() is not None)):

                    print(f"[{log_time()}] 📸 Triggering capture script...")

                    # Run upload script in background
                    process = subprocess.Popen(["python3", "upload.py"])

                    last_capture_time = time.time()

        else:
            # Motion ended (HIGH → LOW)
            if motion_state:
                print(f"[{log_time()}] INFO: Motion Cleared.")
                motion_state = False

        time.sleep(0.1)

except KeyboardInterrupt:
    print("\n[!] Program stopped by user.")

finally:
    GPIO.cleanup()
    print("[!] GPIO Cleanup complete. Goodbye!")
