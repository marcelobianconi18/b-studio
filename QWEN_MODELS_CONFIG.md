# 🤖 Configuração de Modelos Qwen no Antigravity

## ✅ Modelos Instalados no SSD Externo

| Modelo | Tamanho | Uso Ideal |
|--------|---------|-----------|
| **qwen2.5:7b** | 4.7 GB | ✅ Conversas, explicações, código básico |
| **qwen2.5-coder:7b** | 4.7 GB | ✅ Código, debug, refatoração |
| **qwen2.5-coder:14b** | 9.0 GB | ✅ Código complexo, análise profunda |
| **llama3:latest** | 4.7 GB | ✅ Uso geral |

---

## ⚙️ Como Usar no Antigravity

### **Opção 1: Via Settings (Recomendado)**

1. **Abra o Antigravity**
2. **Cmd+,** (Configurações)
3. **Procure por:** `AI Model` ou `Ollama`
4. **Mude o modelo:**
   ```
   qwen2.5:7b         → Para conversas
   qwen2.5-coder:7b   → Para código
   qwen2.5-coder:14b  → Para código complexo
   ```

### **Opção 2: Via Comando Rápido**

1. **Cmd+Shift+P**
2. **Digite:** `Change AI Model`
3. **Selecione:** O modelo desejado

---

## 🔄 Trocar de Modelo no Meio da Conversa

**Sim! É possível!**

### **No Antigravity:**

1. **Abra a paleta de comandos:** `Cmd+Shift+P`
2. **Digite:** `Change Model` ou `Select AI Model`
3. **Escolha:** O modelo desejado
4. **Continue a conversa** com o novo modelo

### **Modelos Recomendados por Tarefa:**

| Tarefa | Modelo Ideal |
|--------|--------------|
| **Conversar, explicar conceitos** | `qwen2.5:7b` ✅ |
| **Escrever código** | `qwen2.5-coder:7b` ✅ |
| **Debug complexo** | `qwen2.5-coder:14b` ✅ |
| **Análise de arquitetura** | `qwen2.5-coder:14b` ✅ |
| **Tarefas rápidas** | `qwen2.5:7b` ou `llama3:latest` |

---

## 📍 Localização dos Modelos

```
/Volumes/SSD Externo/ai-models/ollama/models/
```

---

## 🚀 Comandos Úteis

### **Ver modelos instalados:**
```bash
OLLAMA_MODELS="/Volumes/SSD Externo/ai-models/ollama/models" ollama list
```

### **Baixar mais modelos:**
```bash
# Qwen 2.5 14B (mais potente)
OLLAMA_MODELS="/Volumes/SSD Externo/ai-models/ollama/models" ollama pull qwen2.5:14b

# Qwen 2.5 32B (máximo)
OLLAMA_MODELS="/Volumes/SSD Externo/ai-models/ollama/models" ollama pull qwen2.5:32b
```

### **Testar modelo:**
```bash
OLLAMA_MODELS="/Volumes/SSD Externo/ai-models/ollama/models" ollama run qwen2.5:7b "Olá, como vai?"
```

---

## 💡 Dica de Fluxo de Trabalho

### **No Antigravity:**

1. **Crie múltiplas janelas/abas** do Antigravity
2. **Nomeie cada uma:**
   - `Qwen Conversa` → `qwen2.5:7b`
   - `Qwen Code` → `qwen2.5-coder:7b`
   - `Qwen Max` → `qwen2.5-coder:14b`
3. **Alterne entre abas** conforme a tarefa

---

## ✅ Status

- ✅ **Ollama configurado** para usar SSD Externo
- ✅ **Qwen 2.5 7B instalado** (conversas)
- ✅ **Qwen 2.5 Coder 14B instalado** (código)
- ✅ **Qwen 2.5 Coder 7B instalado** (código leve)
- ✅ **Llama3 instalado** (geral)

---

**Pronto! Agora é só usar!** 🚀
