import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from dotenv import load_dotenv
load_dotenv()

from backend.routers import chat as chat_router
from backend.routers import health as health_router
from backend.routers import web as web_router

app = FastAPI(title="Local LLM Chat API", version="0.1.0")

# Allow local dev origins; adjust as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev; tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static assets (CSS, JS) from /static
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Routers
app.include_router(health_router.router)
app.include_router(chat_router.router)
app.include_router(web_router.router)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8011)