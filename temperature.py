import board
import adafruit_dht

sensor = adafruit_dht.DHT22(board.D4)

try:
    temp = sensor.temperature
    hum  = sensor.humidity
    print(f"{temp},{hum}")
except RuntimeError as e:
    print("error", flush=True)
    exit(1)
finally:
    sensor.exit()
