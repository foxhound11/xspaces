import os
import json

CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'config.json')
PROMPTS_DIR = os.path.join(os.path.dirname(__file__), 'prompts')

class ConfigManager:
    @staticmethod
    def get_config():
        """Reads models config and all prompt files."""
        # Read models config
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
        else:
            config = {
                "models": {
                    "transcript": "google/gemini-2.0-flash-001",
                    "extract": "google/gemini-2.0-flash-001",
                    "verify": "google/gemini-2.0-flash-001"
                }
            }

        # Read prompts
        prompts = {}
        for filename in ["transcript.md", "extract.md", "verify.md", "thread_writer.md", "thread_judge.md"]:
            path = os.path.join(PROMPTS_DIR, filename)
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    # Remove extenson for key name
                    key = filename.replace('.md', '')
                    prompts[key] = f.read()
            else:
                prompts[filename.replace('.md', '')] = ""

        return {
            "models": config.get("models", {}),
            "prompts": prompts
        }

    @staticmethod
    def update_config(data):
        """Updates models config and writes prompt files."""
        # Update models
        if "models" in data:
            current_config = {}
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r') as f:
                    current_config = json.load(f)
            
            current_config["models"] = data["models"]
            
            with open(CONFIG_FILE, 'w') as f:
                json.dump(current_config, f, indent=2)

        # Update prompts
        if "prompts" in data:
            for key, content in data["prompts"].items():
                filename = f"{key}.md"
                path = os.path.join(PROMPTS_DIR, filename)
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)

        return ConfigManager.get_config()
