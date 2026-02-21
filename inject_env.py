import os

source_env = "/Volumes/SSD Externo/repositórios/biageoFinal/.env"
target_env = "/Volumes/SSD Externo/repositórios/b-studio/backend/.env"

pipeboard_token = None
if os.path.exists(source_env):
    with open(source_env, "r") as f:
        for line in f:
            if line.startswith("PIPEBOARD_API_TOKEN="):
                pipeboard_token = line.strip()

with open(target_env, "a") as f:
    f.write("\n\n# --- BIA AI INTEGRATION ---\n")
    if pipeboard_token:
        f.write(f"{pipeboard_token}\n")
    else:
        # Fallback to the one we created earlier
        f.write("PIPEBOARD_API_TOKEN=pk_8d419db95ee54af0a873fe187620e5e3\n")
        
    f.write("BIA_AI_PROVIDER=ollama\n")
    f.write("BIA_AI_MODEL=qwen2.5-coder:7b\n")
    f.write("OLLAMA_BASE_URL=http://localhost:11434\n")

print("Successfully injected BIA AI credentials into B-Studio backend/.env")
