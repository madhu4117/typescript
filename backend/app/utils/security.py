from fastapi import (
    Depends,
    HTTPException,
    status,
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

from jose import (
    jwt,
    JWTError,
    ExpiredSignatureError,
)

from sqlalchemy.orm import Session

from dotenv import load_dotenv

import os

from app.database.database import get_db
from app.models.user import User


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# JWT CONFIGURATION
# =========================================================

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


# =========================================================
# HTTP BEARER
# =========================================================

security = HTTPBearer()


# =========================================================
# GET CURRENT USER
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
) -> User:

    # =====================================================
    # CHECK JWT CONFIGURATION
    # =====================================================

    if not SECRET_KEY:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT SECRET_KEY is missing",
        )

    if not ALGORITHM:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT ALGORITHM is missing",
        )

    # =====================================================
    # GET TOKEN
    # =====================================================

    token = credentials.credentials

    # =====================================================
    # DECODE TOKEN
    # =====================================================

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        # =================================================
        # GET USER ID
        # =================================================

        user_id = payload.get("user_id")

        # Support "sub" as fallback
        if user_id is None:
            user_id = payload.get("sub")

        # =================================================
        # USER ID REQUIRED
        # =================================================

        if user_id is None:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: user_id missing",
                headers={
                    "WWW-Authenticate": "Bearer"
                },
            )

        # =================================================
        # CONVERT USER ID TO INTEGER
        # =================================================

        try:

            user_id = int(user_id)

        except (TypeError, ValueError):

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: invalid user_id",
                headers={
                    "WWW-Authenticate": "Bearer"
                },
            )

    # =====================================================
    # TOKEN EXPIRED
    # =====================================================

    except ExpiredSignatureError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please login again.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # INVALID TOKEN
    # =====================================================

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # FIND USER
    # =====================================================

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    # =====================================================
    # USER NOT FOUND
    # =====================================================

    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # CHECK USER STATUS
    # =====================================================

    user_status = user.status

    # Handle SQLAlchemy Enum
    if hasattr(user_status, "value"):
        user_status = user_status.value

    user_status = str(user_status)

    if user_status != "Active":

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # RETURN USER
    # =====================================================

    return user


# =========================================================
# GET CURRENT ADMIN
# =========================================================

def get_current_admin(
    user: User = Depends(get_current_user),
) -> User:

    # =====================================================
    # GET ROLE
    # =====================================================

    user_role = user.role

    # Handle SQLAlchemy Enum
    if hasattr(user_role, "value"):
        user_role = user_role.value

    user_role = str(user_role)

    # =====================================================
    # ADMIN CHECK
    # =====================================================

    if user_role != "Company Admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin-only module: Access denied",
        )

    return user