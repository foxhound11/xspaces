import os
import requests
import json
from dotenv import load_dotenv

# Find the project root .env
_current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(os.path.dirname(_current_dir), '.env')

# Load the env once here
if os.path.exists(env_path):
    load_dotenv(env_path)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

def get_env_var(key: str) -> str:
    """Helper to get an env var (tries standard os.getenv first)."""
    return os.getenv(key)

def send_to_openrouter(messages: list, model: str) -> str:
    """
    Centralized helper to send requests to OpenRouter.
    Automatically fetches the API key from environment.
    """
    api_key = get_env_var("OPENROUTER_API_KEY")
    if not api_key:
        raise Exception("OPENROUTER_API_KEY not found in environment.")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://space2thread.app",
        "X-Title": "Space2Thread"
    }
    payload = {
        "model": model,
        "messages": messages
    }
    
    print(f"Sending request to OpenRouter ({model})...")
    response = requests.post(OPENROUTER_URL, headers=headers, data=json.dumps(payload))
    
    if response.status_code != 200:
        raise Exception(f"OpenRouter API Error ({response.status_code}): {response.text}")

    result = response.json()
    try:
        return result["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise Exception(f"Unexpected response format: {result}")
