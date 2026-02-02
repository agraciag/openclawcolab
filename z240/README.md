# Mini-Daemon z240

## Setup

```bash
# 1. Copiar archivos a z240
cd ~/dev_projects/test_openclawcolab
mkdir -p tasks completed src/utils

# 2. Copiar el daemon (desde multi_llm_collab o crear manualmente)
# El archivo mini-daemon.sh debe estar en ~/dev_projects/test_openclawcolab/

# 3. Dar permisos
chmod +x mini-daemon.sh
```

## Uso

### Iniciar daemon
```bash
./mini-daemon.sh
```

### Crear tarea
```bash
cat > tasks/mi-tarea.task << 'EOF'
AGENT: CLAUDE
PROMPT:
Usando Write, crea /home/alex/dev_projects/test_openclawcolab/src/mi-archivo.js con:
// contenido aquí
module.exports = {};
EOF
```

### Formato de tarea

```
AGENT: CLAUDE|QWEN|GEMINI
PROMPT:
[instrucciones para el agente]
```

## Flujo

1. Daemon monitorea `tasks/` cada 5 segundos
2. Cuando encuentra un archivo `.task`, lo ejecuta
3. Mueve la tarea a `completed/`
4. Log en `daemon.log`

## Ejemplos

Ver archivos `example-task-*.task`
