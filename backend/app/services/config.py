
import os
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.agent import SystemSettings

class ConfigService:
    def __init__(self):
        self._db_session = None

    def get_db(self):
        if not self._db_session:
            self._db_session = SessionLocal()
        return self._db_session
    
    def get_setting(self, key: str, default: str = None) -> str:
        """
        Retrieves a setting with priority: Database > Environment Variable > Default.
        """
        db = self.get_db()
        try:
            settings = db.query(SystemSettings).first()
            if settings:
                if key == "FACEBOOK_ACCESS_TOKEN" and settings.meta_access_token:
                    return settings.meta_access_token
                if key == "FACEBOOK_AD_ACCOUNT_ID" and settings.meta_ad_account_id:
                     return settings.meta_ad_account_id
                if key == "FACEBOOK_APP_ID" and settings.meta_app_id:
                     return settings.meta_app_id
                if key == "FACEBOOK_APP_SECRET" and settings.meta_app_secret:
                     return settings.meta_app_secret
                if key == "OPENAI_API_KEY" and settings.openai_api_key:
                     return settings.openai_api_key
        except Exception as e:
            print(f"ConfigService Error: {e}")
        finally:
            db.close()
            self._db_session = None

        # Fallback to Env
        return os.getenv(key, default)

    def set_settings(self, data: dict):
        """
        Saves settings to the database.
        """
        db = self.get_db()
        try:
            settings = db.query(SystemSettings).first()
            if not settings:
                settings = SystemSettings()
                db.add(settings)
            
            if "meta_access_token" in data: settings.meta_access_token = data["meta_access_token"]
            if "meta_ad_account_id" in data: settings.meta_ad_account_id = data["meta_ad_account_id"]
            if "meta_app_id" in data: settings.meta_app_id = data["meta_app_id"]
            if "meta_app_secret" in data: settings.meta_app_secret = data["meta_app_secret"]
            if "openai_api_key" in data: settings.openai_api_key = data["openai_api_key"]
            
            db.commit()
            return True
        except Exception as e:
            print(f"Error saving settings: {e}")
            db.rollback()
            return False
        finally:
             db.close()
             self._db_session = None

config_service = ConfigService()
