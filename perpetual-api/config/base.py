"""Shared application settings. Use config.local or config.settings as the entry point."""

import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from urllib.parse import urlsplit

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY", "default_secret_key")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False") == "True"

# Base domain and site details
SITE_NAME = "Perpetual Labs"
SITE_URL = os.getenv("SITE_URL", "http://127.0.0.1:8000").rstrip("/")
BASE_DOMAIN = urlsplit(SITE_URL).hostname or "localhost"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Allowed hosts and trusted origins
ALLOWED_HOSTS = ["localhost", "127.0.0.1", BASE_DOMAIN]
CSRF_TRUSTED_ORIGINS = [
    SITE_URL,
    FRONTEND_URL,
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
]


############################## CORS CONFIGURATION ###############################

CORS_ALLOWED_ORIGINS = [
    SITE_URL,
    FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_RATES": {
        "registration": os.getenv("REGISTRATION_THROTTLE_RATE", "10/hour"),
        "contact": os.getenv("CONTACT_THROTTLE_RATE", "10/hour"),
        "newsletter": os.getenv("NEWSLETTER_THROTTLE_RATE", "10/hour"),
        "login": os.getenv("LOGIN_THROTTLE_RATE", "20/minute"),
    },
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}


SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": False,
    "ALGORITHM": "HS256",
    "VERIFYING_KEY": "",
    "AUDIENCE": None,
    "ISSUER": None,
    "JSON_ENCODER": None,
    "JWK_URL": None,
    "LEEWAY": 0,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    "JTI_CLAIM": "jti",
    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=30),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),
    "TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainPairSerializer",
    "TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSerializer",
    "TOKEN_VERIFY_SERIALIZER": "rest_framework_simplejwt.serializers.TokenVerifySerializer",
    "TOKEN_BLACKLIST_SERIALIZER": "rest_framework_simplejwt.serializers.TokenBlacklistSerializer",
    "SLIDING_TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainSlidingSerializer",
    "SLIDING_TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSlidingSerializer",
}


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "drf_yasg",
    "rest_framework",
    "cloudinary",
    "cloudinary_storage",
    "corsheaders",
    "api.home",
    "api.accounts",
    "api.blog",
    "api.services",
    "api.projects",
    "api.testimonials",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database configuration is selected by config.local or config.production.

AUTH_USER_MODEL = "accounts.User"

############################### LOGIN AND SESSION SETTINGS ###############################

# Login and session settings
LOGIN_REDIRECT_URL = "/"
LOGIN_URL = "login"

SESSION_COOKIE_AGE = 3600  # 60 * 60 seconds = 1 hour
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # Close session when browser closes

# All application and Django framework email uses Resend.
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() in {"true", "1", "yes"}
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "10"))
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_API_URL = os.getenv("RESEND_API_URL", "https://api.resend.com/emails")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "")
DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    RESEND_FROM_EMAIL or EMAIL_HOST_USER,
)
if not RESEND_FROM_EMAIL:
    RESEND_FROM_EMAIL = DEFAULT_FROM_EMAIL
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    (
        "config.email_backends.ResendEmailBackend"
        if RESEND_API_KEY
        else "django.core.mail.backends.smtp.EmailBackend"
    ),
)

HOST_EMAIL = os.getenv("HOST_EMAIL", "").strip()
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# Bound form parsing and never trust arbitrary X-Forwarded-For for throttling.
DATA_UPLOAD_MAX_MEMORY_SIZE = 1024 * 1024
DATA_UPLOAD_MAX_NUMBER_FIELDS = 100
DATA_UPLOAD_MAX_NUMBER_FILES = 5
REST_FRAMEWORK["NUM_PROXIES"] = 0
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["token_refresh"] = "30/minute"


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

# Cloudinary storage configuration
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": CLOUDINARY_CLOUD_NAME,
    "API_KEY": CLOUDINARY_API_KEY,
    "API_SECRET": CLOUDINARY_API_SECRET,
    "SECURE": True,
}


# Configure storage only through STORAGES; the legacy setting conflicts on Django 4.2.
STORAGES = {
    "default": {"BACKEND": "api.storage.BoundedMediaCloudinaryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_ALL_ORIGINS = os.getenv("CORS_ALLOW_ALL_ORIGINS", "False") == "True"

# Media files are stored by the configured storage backend.
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

ENABLE_API_DOCS = True


# OAuth values are resolved after local/production chooses its frontend origin.
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["social_login"] = "20/minute"


# Password-bound JWTs revoke access tokens immediately after password changes.
SIMPLE_JWT["CHECK_REVOKE_TOKEN"] = True
PASSWORD_RESET_TIMEOUT = int(os.getenv("PASSWORD_RESET_TIMEOUT", "3600"))
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"].update(
    {
        "password_reset_request": "10/hour",
        "password_reset_account": "5/hour",
        "password_reset_confirm": "20/hour",
        "password_change": "10/hour",
        "profile": "120/hour",
        "profile_picture": "20/hour",
    }
)
