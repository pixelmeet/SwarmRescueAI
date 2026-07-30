import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "swarmrescue"
    GROQ_API_KEY: str = "placeholder_groq_key"
    JWT_SECRET: str = "placeholder_jwt_secret"
    NEXTJS_NOTIFY_URL: str = "http://localhost:3000/api/notify"
    INTERNAL_API_SECRET: str = "placeholder_secret"
    OSRM_BASE_URL: str = "https://router.project-osrm.org"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "adminpass"


    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
