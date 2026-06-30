from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.businesses.schemas import BusinessResponse, CreateBusinessRequest
from app.businesses.service import create_business_for_owner, get_business_for_owner
from app.integrations.appwrite_client import get_user_id_from_jwt

router = APIRouter(prefix="/businesses", tags=["businesses"])


def get_current_user_id(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Appwrite session token",
        )

    jwt = authorization.removeprefix("Bearer ").strip()
    try:
        return get_user_id_from_jwt(jwt)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc) or "Invalid or expired session token",
        ) from exc


@router.post("", response_model=BusinessResponse)
def create_business(
    payload: CreateBusinessRequest,
    owner_id: str = Depends(get_current_user_id),
) -> dict:
    return create_business_for_owner(owner_id=owner_id, name=payload.name)


@router.get("/me", response_model=BusinessResponse)
def get_my_business(owner_id: str = Depends(get_current_user_id)) -> dict:
    business = get_business_for_owner(owner_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No business found for this user",
        )
    return business
