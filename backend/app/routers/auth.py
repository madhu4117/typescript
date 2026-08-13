from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.user import User

from app.schemas.auth_schema import (
    RegisterRequest,
    LoginRequest,
)

from app.utils.password import (
    hash_password,
    verify_password,
)

from app.utils.jwt import create_access_token


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):

    # =====================================================
    # CHECK EXISTING EMAIL
    # =====================================================

    existing_user = (
        db.query(User)
        .filter(
            User.email == request.email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    # =====================================================
    # CREATE USER
    # =====================================================

    new_user = User(
        company_id=1,
        name=request.name,
        email=request.email,
        password=hash_password(
            request.password
        ),
        role="Company Admin",
        status="Active",
    )

    # =====================================================
    # SAVE USER
    # =====================================================

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "message": "User registered successfully"
    }


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):

    # =====================================================
    # FIND USER
    # =====================================================

    user = (
        db.query(User)
        .filter(
            User.email == request.email
        )
        .first()
    )

    # =====================================================
    # USER NOT FOUND
    # =====================================================

    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # CHECK PASSWORD
    # =====================================================

    if not verify_password(
        request.password,
        user.password,
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # CHECK USER STATUS
    # =====================================================

    user_status = user.status

    if hasattr(user_status, "value"):
        user_status = user_status.value

    if str(user_status) != "Active":

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # =====================================================
    # CREATE JWT
    # =====================================================

    access_token = create_access_token(
        {
            "user_id": user.id,
            "company_id": user.company_id,
            "role": (
                user.role.value
                if hasattr(user.role, "value")
                else user.role
            ),
        }
    )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "access_token": access_token,
        "token_type": "bearer",

        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": (
                user.role.value
                if hasattr(user.role, "value")
                else user.role
            ),
        },
    }