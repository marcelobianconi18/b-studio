import os
from app.core.database import SessionLocal
from app.models.agent import SystemSettings

FIELD_BY_KEY = {
    "FACEBOOK_ACCESS_TOKEN": "meta_access_token",
    "meta_access_token": "meta_access_token",
    "FACEBOOK_AD_ACCOUNT_ID": "meta_ad_account_id",
    "meta_ad_account_id": "meta_ad_account_id",
    "FACEBOOK_APP_ID": "meta_app_id",
    "meta_app_id": "meta_app_id",
    "FACEBOOK_APP_SECRET": "meta_app_secret",
    "meta_app_secret": "meta_app_secret",
    "OPENAI_API_KEY": "openai_api_key",
    "openai_api_key": "openai_api_key",
}

ENV_BY_KEY = {
    "meta_access_token": "FACEBOOK_ACCESS_TOKEN",
    "meta_ad_account_id": "FACEBOOK_AD_ACCOUNT_ID",
    "meta_app_id": "FACEBOOK_APP_ID",
    "meta_app_secret": "FACEBOOK_APP_SECRET",
    "openai_api_key": "OPENAI_API_KEY",
}


class ConfigService:
    def _get_singleton_settings(self, db, create: bool = False, cleanup_duplicates: bool = False):
        settings_list = db.query(SystemSettings).order_by(SystemSettings.id.asc()).all()
        if not settings_list:
            if not create:
                return None
            settings = SystemSettings()
            db.add(settings)
            db.flush()
            return settings

        primary = settings_list[0]
        if cleanup_duplicates and len(settings_list) > 1:
            for extra in settings_list[1:]:
                db.delete(extra)
        return primary

    def get_setting(self, key: str, default: str = None) -> str:
        """
        Retrieves a setting with priority: Database > Environment Variable > Default.
        """
        key_name = key.strip()
        field_name = FIELD_BY_KEY.get(key_name)

        db = SessionLocal()
        try:
            settings = self._get_singleton_settings(db)
            if settings and field_name:
                value = getattr(settings, field_name, None)
                if value:
                    return value
        except Exception as e:
            print(f"ConfigService Error: {e}")
        finally:
            db.close()

        # Fallback to Env – try the mapped key first, then common aliases
        env_key = ENV_BY_KEY.get(key_name, key_name)
        value = os.getenv(env_key)
        if value:
            return value

        # Try META_* aliases (the .env may use META_APP_ID instead of FACEBOOK_APP_ID)
        meta_aliases = {
            "FACEBOOK_APP_ID": "META_APP_ID",
            "FACEBOOK_APP_SECRET": "META_APP_SECRET",
            "FACEBOOK_ACCESS_TOKEN": "META_ACCESS_TOKEN",
            "FACEBOOK_AD_ACCOUNT_ID": "META_AD_ACCOUNT_ID",
        }
        alias = meta_aliases.get(env_key)
        if alias:
            value = os.getenv(alias)
            if value:
                return value

        return default

    def set_settings(self, data: dict):
        """
        Saves settings to the database.
        """
        db = SessionLocal()
        try:
            settings = self._get_singleton_settings(db, create=True, cleanup_duplicates=True)

            normalized = {}
            for key, value in data.items():
                field_name = FIELD_BY_KEY.get(key)
                if field_name:
                    normalized[field_name] = value

            if "meta_access_token" in normalized:
                settings.meta_access_token = normalized["meta_access_token"]
            if "meta_ad_account_id" in normalized:
                settings.meta_ad_account_id = normalized["meta_ad_account_id"]
            if "meta_app_id" in normalized:
                settings.meta_app_id = normalized["meta_app_id"]
            if "meta_app_secret" in normalized:
                settings.meta_app_secret = normalized["meta_app_secret"]
            if "openai_api_key" in normalized:
                settings.openai_api_key = normalized["openai_api_key"]

            db.commit()
            return True
        except Exception as e:
            print(f"Error saving settings: {e}")
            db.rollback()
            return False
        finally:
            db.close()

config_service = ConfigService()
