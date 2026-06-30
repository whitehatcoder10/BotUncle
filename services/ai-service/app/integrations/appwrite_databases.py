import json
import uuid

import requests

from app.core.config import (
    APPWRITE_API_KEY,
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
)


def _admin_headers(*, with_json: bool = False) -> dict[str, str]:
    headers = {
        "X-Appwrite-Project": APPWRITE_PROJECT_ID,
        "X-Appwrite-Key": APPWRITE_API_KEY,
    }
    if with_json:
        headers["Content-Type"] = "application/json"
    return headers


def _documents_url(database_id: str, collection_id: str) -> str:
    return (
        f"{APPWRITE_ENDPOINT}/databases/{database_id}"
        f"/collections/{collection_id}/documents"
    )


def _raise_for_status(response: requests.Response) -> None:
    if response.ok:
        return
    try:
        message = response.json().get("message", response.text)
    except ValueError:
        message = response.text
    raise RuntimeError(message)


def list_documents(
    database_id: str,
    collection_id: str,
    *,
    equal_filters: dict[str, str] | None = None,
    limit: int | None = None,
) -> list[dict]:
    """List documents via REST — avoids Appwrite Python SDK GET body bug."""
    queries: list[str] = []
    for attribute, value in (equal_filters or {}).items():
        queries.append(
            json.dumps({"method": "equal", "attribute": attribute, "values": [value]})
        )
    if limit is not None:
        queries.append(json.dumps({"method": "limit", "values": [limit]}))

    response = requests.get(
        _documents_url(database_id, collection_id),
        headers=_admin_headers(),
        params=[("queries[]", query) for query in queries] if queries else None,
        timeout=10,
    )
    _raise_for_status(response)
    return response.json().get("documents", [])


def create_document(
    database_id: str,
    collection_id: str,
    *,
    data: dict,
    permissions: list[str],
    document_id: str | None = None,
) -> dict:
    """Create a document via REST."""
    payload = {
        "documentId": document_id or uuid.uuid4().hex[:20],
        "data": data,
        "permissions": permissions,
    }

    response = requests.post(
        _documents_url(database_id, collection_id),
        headers=_admin_headers(with_json=True),
        json=payload,
        timeout=10,
    )
    _raise_for_status(response)
    return response.json()
