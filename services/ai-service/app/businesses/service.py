import json
import secrets

from fastapi import HTTPException, status

from app.core.config import APPWRITE_BUSINESSES_COLLECTION_ID, APPWRITE_DATABASE_ID
from app.integrations.appwrite_databases import create_document, list_documents


def _to_response(document: dict) -> dict:
    return {
        "id": document["$id"],
        "owner_id": document["ownerId"],
        "name": document["name"],
        "widget_key": document["widgetKey"],
        "allowed_domains": document.get("allowedDomains", []),
        "widget_config": document.get("widgetConfig", "{}"),
    }


def get_business_for_owner(owner_id: str) -> dict | None:
    documents = list_documents(
        APPWRITE_DATABASE_ID,
        APPWRITE_BUSINESSES_COLLECTION_ID,
        equal_filters={"ownerId": owner_id},
        limit=1,
    )
    if not documents:
        return None
    return _to_response(documents[0])


def create_business_for_owner(owner_id: str, name: str) -> dict:
    if not APPWRITE_DATABASE_ID or not APPWRITE_BUSINESSES_COLLECTION_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Appwrite database is not configured on ai-service",
        )

    existing = get_business_for_owner(owner_id)
    if existing:
        return existing

    try:
        document = create_document(
            APPWRITE_DATABASE_ID,
            APPWRITE_BUSINESSES_COLLECTION_ID,
            data={
                "ownerId": owner_id,
                "name": name,
                "widgetKey": secrets.token_urlsafe(24),
                "allowedDomains": [],
                "widgetConfig": json.dumps({}),
            },
            permissions=[
                f'read("user:{owner_id}")',
                f'update("user:{owner_id}")',
            ],
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    return _to_response(document)
