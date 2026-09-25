import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY", "default_secret_key")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False") == "True"

# Base domain and site details
SITE_NAME = "Perpetual Tech"
BASE_DOMAIN = os.getenv("BASE_DOMAIN", "perpetualapi-production.up.railway.app")
SITE_URL = os.getenv("SITE_URL", f"https://{BASE_DOMAIN}")
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


# Security settings --comment in dev
# SECURE_SSL_REDIRECT = True  # Redirect HTTP to HTTPS
# SECURE_PROXY_SSL_HEADER = (
#     "HTTP_X_FORWARDED_PROTO",
#     "https",
# )
# # Trust proxy's HTTPS header
# CSRF_COOKIE_SECURE = True  # Secure CSRF cookies
# SESSION_COOKIE_DOMAIN = f".{BASE_DOMAIN}"  # Domain for session cookies
# CSRF_COOKIE_DOMAIN = f".{BASE_DOMAIN}"  # Domain for CSRF cookies

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
    # "SIGNING_KEY": settings.SECRET_KEY,
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


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "default_db_name"),
        "USER": os.environ.get("DB_USER", "default_user"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "default_password"),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}


# DATABASES = {
#     "default": dj_database_url.config(
#         default=os.getenv("DATABASE_URL"),
#         conn_max_age=600,  # Keep the connection alive for 10 minutes
#         ssl_require=True,  # Ensure a secure (SSL-encrypted) connection
#     )
# }

AUTH_USER_MODEL = "accounts.User"

############################### LOGIN AND SESSION SETTINGS ###############################

# Login and session settings
LOGIN_REDIRECT_URL = "/"
LOGIN_URL = "login"
# LOGIN_URL = '/api/accounts/login/'

SESSION_COOKIE_AGE = 3600  # 60 * 60 seconds = 1 hour
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # Close session when browser closes

############################### EMAIL CONFIGURATION ###############################

# Email backend (console for development)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Email configuration (for production)
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_USE_TLS = True
EMAIL_PORT = 587
EMAIL_TIMEOUT = 10

# The email sending the email
EMAIL_HOST_USER = os.getenv("EMAIL_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_PASS")

# The email receiving the notifications
HOST_EMAIL = os.getenv("HOST_EMAIL")


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
}

DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"
# Django 5.2 uses STORAGES; preserve the existing Cloudinary media backend.
STORAGES = {
    "default": {"BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_ALL_ORIGINS = os.getenv("CORS_ALLOW_ALL_ORIGINS", "False") == "True"
