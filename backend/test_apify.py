import os
import requests
import json
from dotenv import load_dotenv

# Load env variables manually (dotenv fallback)
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
apify_token = None

if os.path.exists(dotenv_path):
    with open(dotenv_path, 'r') as f:
        for line in f:
            if line.startswith("APIFY_API_TOKEN="):
                apify_token = line.split("=", 1)[1].strip()
                break

APIFY_TOKEN = apify_token

if not APIFY_TOKEN:
    print("Error: APIFY_API_TOKEN not found in .env (manual parse)")
    exit(1)

print(f"Found API Token: {APIFY_TOKEN[:5]}...")

# Apify Actor: apidojo/twitter-scraper-lite (Unlimited)
ACTOR_URL = "https://api.apify.com/v2/acts/apidojo~twitter-scraper-lite/run-sync-get-dataset-items"

# Basic test: simple search for user tweets
payload = {
    "searchTerms": ["from:elonmusk"],
    "maxItems": 5,
    "sort": "Latest"
}

print(f"Scout dispatched! Searching for: {payload['searchTerms'][0]}")

try:
    response = requests.post(
        ACTOR_URL,
        headers={"Authorization": f"Bearer {APIFY_TOKEN}"},
        json=payload,
        timeout=60
    )

    if response.status_code != 201:
        print(f"Error from Apify ({response.status_code}): {response.text}")
        exit(1)

    data = response.json()
    
    if not data:
        print("Warning: No tweets found.")
    else:
        print(f"Success! Found {len(data)} item(s).")
        print("--- All Items Dump ---")
        for i, item in enumerate(data):
            print(f"Item {i}: {json.dumps(item, indent=2)}")
        print("---------------------")

except Exception as e:
    print(f"Exception: {e}")
