import os
import requests
import json
from dotenv import load_dotenv

# Ensure env is loaded
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_KEY:
    print("Error: OPENROUTER_API_KEY not found.")
    exit(1)

print(f"Using OpenRouter Key: {OPENROUTER_KEY[:5]}...")

# Use Grok 2 Vision (known for live access)
MODEL = "x-ai/grok-2-vision-1212"

prompt = """
Find the most recent Twitter Space hosted by @elonmusk.
Return ONLY the URL of the space.
It likely happened recently (within the last week).
If you cannot find a specific link, return 'NOT_FOUND'.
"""

print(f"Dispatching Grok ({MODEL})...")

try:
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Space2Thread Scout",
            "Content-Type": "application/json"
        },
        json={
            "model": MODEL,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        },
        timeout=60
    )

    if response.status_code != 200:
        print(f"Error ({response.status_code}): {response.text}")
        exit(1)

    data = response.json()
    content = data['choices'][0]['message']['content']
    print(f"Grok says: {content}")

except Exception as e:
    print(f"Exception: {e}")
