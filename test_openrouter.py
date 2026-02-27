
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv("backend/.env")

API_KEY = os.getenv("OPENROUTER_API_KEY")
print(f"API Key found: {'Yes' if API_KEY else 'No'}")

url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://viralspaces.app",
    "X-Title": "ViralSpaces"
}
data = {
    "model": "google/gemini-flash-1.5",
    "messages": [
        {"role": "user", "content": "Say hello!"}
    ]
}

print("Sending request...")
try:
    response = requests.post(url, headers=headers, json=data, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
