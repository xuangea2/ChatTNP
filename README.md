# Local LLM Chatbot

Este repositorio proporciona una forma sencilla de desplegar en local un chatbot basado en un modelo de lenguaje grande (LLM). El objetivo es experimentar de primera mano con generación de texto y chat streaming usando un backend ligero en FastAPI y una interfaz moderna en el navegador.

## Contexto Académico
Proyecto del Tema 18 (Deep Learning) del Máster en Ciencia de Datos e Inteligencia Artificial de EBIS Business Techschool. Se usa como práctica para comprender los componentes de inferencia de modelos grandes, gestión de prompts y entrega de una interfaz interactiva al usuario.

## Requisitos
- Python 3.10+ (recomendado entorno virtual).
- Dependencias listadas en `requirements.txt`.
- GPU con memoria suficiente es **casi imprescindible**: el modelo por defecto (`meta-llama/Llama-3.2-3B-Instruct`) puede requerir ~4GB VRAM o más. En CPU funcionará muy lento.
- Conexión a internet inicial para descargar los pesos (solo primera vez).

Parámetros por defecto:
- Modelo: `meta-llama/Llama-3.2-3B-Instruct`
- Máx. tokens nuevos: 2048
- Temperatura: 0.7

## Instalación y Puesta en Marcha

1. Clona el repositorio o coloca los archivos en tu máquina.
2. Crea y activa entorno virtual (opcional pero recomendado):
	```bash
	python -m venv .venv
	source .venv/bin/activate
	```
3. Instala dependencias:
	```bash
	pip install -r requirements.txt
	# (Opcional) Instala PyTorch con CUDA adecuada si tu GPU lo soporta.
	```
4. Inicia el backend FastAPI:
	```bash
	uvicorn main:app --host 0.0.0.0 --port 8000 --reload
	```
5. Abre el frontend: simplemente abre `frontend/index.html` en tu navegador o sirve la carpeta `frontend/` estáticamente.
6. Visita `http://0.0.0.0:8000/` si usas la plantilla servida por FastAPI (carga la interfaz).

La primera petición que dispare generación descargará el modelo.

## Descripción del Código
- `main.py`: Aplicación FastAPI. Define endpoints `/chat` (respuesta completa) y `/chat/stream` (streaming de tokens). Monta `/static` para servir assets y renderiza `index.html`.
- `model.py`: Inicialización perezosa (lazy) del pipeline de Hugging Face y funciones para generación normal y streaming con `TextIteratorStreamer`.
- `schemas.py`: Modelos Pydantic (`ChatRequest`, `ChatResponse`) y roles de mensajes.
- `frontend/`: Interfaz web (HTML, CSS, JS). Incluye la lógica para enviar prompts, mostrar mensajes, hacer streaming y configurar parámetros.
- `requirements.txt`: Dependencias principales (FastAPI, Uvicorn, Transformers, etc.).

## Descripción de la Interfaz
La interfaz presenta un contenedor central con:
- Área de conversación donde se listan los mensajes (usuario, asistente y sistema). El mensaje de sistema inicial indica el rol del asistente.
- Formulario inferior para escribir el prompt y enviar (botón "Send").
- Botón "Clear" para reiniciar la conversación manteniendo el mensaje de sistema.
- Botón "Settings" que abre un modal donde puedes ajustar:
  - System Prompt (mensaje inicial de rol)
  - Max New Tokens
  - Temperature
  - Activar/desactivar streaming
  - Activar/desactivar renderizado Markdown
- Visualización en vivo de la generación cuando el streaming está activo (los tokens se van acumulando).
- Soporte para Markdown (código, listas, tablas) con sanitización.

## Personalización Rápida
- Cambia el modelo editando `MODEL_ID` en `model.py`.
- Ajusta colores y estilos en `frontend/style.css`.
- Modifica la lógica de presentación / markdown en `frontend/app.js`.
