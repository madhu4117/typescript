from datetime import datetime, timedelta, timezone
import os

from jose import jwt
from dotenv import load_dotenv


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# JWT CONFIGURATION
# =========================================================

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Token lifetime
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)


# =========================================================
# VALIDATE CONFIGURATION
# =========================================================

if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY is missing from environment variables"
    )


# =========================================================
# CREATE ACCESS TOKEN
# =========================================================

def create_access_token(data: dict) -> str:

    # Make a copy so we don't modify the original dictionary
    to_encode = data.copy()

    # Current UTC time
    now = datetime.now(timezone.utc)

    # Expiration time
    expire = now + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # =====================================================
    # JWT STANDARD CLAIMS
    # =====================================================

    to_encode.update(
        {
            "iat": now,
            "exp": expire,
        }
    )

    # =====================================================
    # CREATE JWT
    # =====================================================

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return encoded_jwt