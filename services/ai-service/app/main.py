from fastapi import FastAPI
app = FastAPI(
    title="BotUncle AI Service",
    version="0.1.0"
)

@app.get("/")
def root():
    return {"message": "BotUncle AI Service is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}