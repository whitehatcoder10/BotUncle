from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.businesses.router import router as businesses_router
from app.core.config import CORS_ORIGINS

app = FastAPI(
    title="BotUncle AI Service",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(businesses_router)


@app.get("/")
def root():
    return {"message": "BotUncle AI Service is running"}


@app.get("/health")
def health():
    return {"status": "healthy", "docker": "running"}
