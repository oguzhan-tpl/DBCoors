from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from rotalar import api
import os

uygulama = FastAPI(title="DBCreator")

uygulama.include_router(api.router, prefix="/api")

os.makedirs("statik", exist_ok=True)
os.makedirs("statik/css", exist_ok=True)
os.makedirs("statik/js", exist_ok=True)

uygulama.mount("/statik", StaticFiles(directory="statik"), name="statik")

@uygulama.get("/")
def ana_sayfa():
    return FileResponse("statik/index.html")
