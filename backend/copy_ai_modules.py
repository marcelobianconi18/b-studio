import os
import shutil

src_ai = "/Volumes/SSD Externo/repositórios/biageoFinal/backend/engine/ai_assistant.py"
src_mkt = "/Volumes/SSD Externo/repositórios/biageoFinal/backend/engine/marketing.py"

dst_ai = "/Volumes/SSD Externo/repositórios/b-studio/backend/app/services/ai_engine/ai_assistant.py"
dst_mkt = "/Volumes/SSD Externo/repositórios/b-studio/backend/app/services/ai_engine/marketing.py"

shutil.copy2(src_ai, dst_ai)
shutil.copy2(src_mkt, dst_mkt)

# Rewrite imports in ai_assistant.py
with open(dst_ai, 'r') as f:
    ai_content = f.read()
ai_content = ai_content.replace('engine.meta_core.', 'app.services.meta_engine.')
ai_content = ai_content.replace('engine.', 'app.services.')
with open(dst_ai, 'w') as f:
    f.write(ai_content)

# Rewrite imports in marketing.py
with open(dst_mkt, 'r') as f:
    mkt_content = f.read()
mkt_content = mkt_content.replace('engine.meta_core.', 'app.services.meta_engine.')
mkt_content = mkt_content.replace('engine.intelligence_core', 'app.services.ai_engine')
with open(dst_mkt, 'w') as f:
    f.write(mkt_content)

print("Successfully copied and patched AI modules in B-Studio.")
