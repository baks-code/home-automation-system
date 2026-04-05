import requests
import subprocess
from datetime import datetime

import cloudinary
import cloudinary.uploader

# --- CONFIGURATION ---
# Replace these with your actual details from the Cloudinary Dashboard
cloudinary.config( 
  cloud_name = "dmun4qikp", 
  api_key = "583514636122767", 
  api_secret = "Olavm7h6Rx7jFvlzRPVJJXL0SaM",
  secure = True
)


# Step 1: Capture image
image_path = "temp_image.jpg"

subprocess.run(["rpicam-still", "-o", image_path])

# Step 2: Prepare timestamped filename
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
file_name = f"motion_captured_@_{timestamp}.jpg"


# Step 3: Upload to Cloudinary

try:
    # 3. Upload file
    # 'public_id' sets the filename in the cloud
    upload_result = cloudinary.uploader.upload(
        image_path, 
        public_id = file_name,
        folder = "motion_captures" # Keeps your cloud organized
    )

    # Step 4: Get link
    
    image_url = upload_result['secure_url']

    print(f"✅ Uploaded successfully!")
    print(f"🔗 Image URL: {image_url}")

    # Step 5: send to web server
    requests.post("http://127.0.0.1:8000/motion-event", json={
        "image_link": image_url
    })

except Exception as e:
    print(f"❌ Upload failed: {e}")