import os
import requests
from dotenv import load_dotenv

# Ensure env is loaded
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(os.path.dirname(current_dir), '.env')
if os.path.exists(env_path):
    # Manually parse if load_dotenv fails (double safety)
    try:
        load_dotenv(env_path)
    except:
        pass

class ScoutService:
    @staticmethod
    def _get_api_token():
        # Try env var
        token = os.getenv("APIFY_API_TOKEN")
        if token:
            return token
        
        # Fallback: manual parsing
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    if line.startswith("APIFY_API_TOKEN="):
                        return line.split("=", 1)[1].strip()
        return None

    @staticmethod
    def find_latest_space(username: str = "elonmusk") -> str:
        token = ScoutService._get_api_token()
        if not token:
            raise ValueError("APIFY_API_TOKEN not found in configuration.")

        # Actor: quacker/twitter-scraper
        # Using synchronous run to keep it simple for the user interaction
        actor_url = "https://api.apify.com/v2/acts/quacker~twitter-scraper/run-sync-get-dataset-items"
        
        # Query: specific user's spaces
        query = f"from:{username} filter:spaces"
        
        payload = {
            "searchTerms": [query],
            "maxItems": 1,
            "sort": "Latest",
            "proxyConfig": { "useApifyProxy": True }
        }

        try:
            response = requests.post(
                actor_url,
                headers={"Authorization": f"Bearer {token}"},
                json=payload,
                timeout=60
            )

            if response.status_code != 201:
                error_msg = f"Apify Error {response.status_code}: {response.text}"
                print(error_msg)
                raise Exception("Failed to contact Scout.")

            data = response.json()
            
            if not data:
                return None # No spaces found

            item = data[0]
            # Extract URL, prioritizing direct link
            url = item.get("url") or item.get("expanded_url") or f"https://twitter.com/i/spaces/{item.get('id_str')}"
            
            return url

        except Exception as e:
            print(f"Scout failed: {e}")
            raise e
