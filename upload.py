import requests
import subprocess
from datetime import datetime

from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials


# Step 1: Capture image
image_path = "image.jpg"

subprocess.run(["rpicam-still", "-o", image_path])

# Step 2: Prepare timestamped filename
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
file_name = f"motion_captured_@_{timestamp}.jpg"

# Step 3: Authenticate Google Drive
SCOPES = ['https://www.googleapis.com/auth/drive.file']
creds = Credentials.from_authorized_user_file('token.json', SCOPES)

service = build('drive', 'v3', credentials=creds)


# Step 4: Upload file

file_metadata = {
    'name': file_name
}

media = MediaFileUpload(image_path, mimetype='image/jpeg')

file = service.files().create(
    body=file_metadata,
    media_body=media,
    fields='id'
).execute()

file_id = file.get('id')

print("✅ Uploaded successfully!")
print("File ID:", file_id)

# Step 5: Make file publicly accessible
permission = {
    'role': 'reader',
    'type': 'anyone'
}

service.permissions().create(
    fileId=file_id,
    body=permission
).execute()

print("🔗 Public link:")
print(f"https://drive.google.com/file/d/{file_id}/view")

# after uploading to Google Drive
requests.post("http://127.0.0.1:8000/motion-event", json={
    "image_link": f"https://drive.google.com/file/d/{file_id}/view"
})