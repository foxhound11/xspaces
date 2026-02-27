
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv("backend/.env")

API_KEY = os.getenv("OPENROUTER_API_KEY")
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://viralspaces.app",
    "X-Title": "ViralSpaces"
}

def test_model(model_id):
    print(f"\n--- Testing {model_id} ---")
    url = "https://openrouter.ai/api/v1/chat/completions"
    data = {
        "model": model_id,
        "messages": [{"role": "user", "content": "Hello"}]
    }
    try:
        response = requests.post(url, headers=HEADERS, json=data, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Success!")
        else:
            print(f"Error: {response.text[:200]}")
    except Exception as e:
        print(f"Exception: {e}")

# 1. Test variations
test_model("google/gemini-1.5-flash")
test_model("google/gemini-flash-1.5")

# 2. List models if failed
print("\n--- Listing Google Models ---")
try:
    models_resp = requests.get("https://openrouter.ai/api/v1/models", headers=HEADERS, timeout=10)
    if models_resp.status_code == 200:
        data = models_resp.json()
        google_models = [m["id"] for m in data["data"] if "google" in m["id"] and "flash" in m["id"]]
        print("\nFound Gemini Flash models:")
        for m in sorted(google_models):
            print(f"- {m}")
    else:
        print(f"Failed to list models: {models_resp.status_code}")
except Exception as e:
    print(f"Exception listing models: {e}")
