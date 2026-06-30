import requests

from app.core.config import (
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
)


def get_user_id_from_jwt(jwt: str) -> str:
    """Verify the dashboard user's session JWT and return their Appwrite user ID."""
    # Appwrite Python SDK sends a JSON body on GET requests, which Appwrite rejects.
    # Use direct HTTP for JWT validation.
    response = requests.get(
        f"{APPWRITE_ENDPOINT}/account",
        headers={
            "X-Appwrite-Project": APPWRITE_PROJECT_ID,
            "X-Appwrite-JWT": jwt,
        },
        timeout=10,
    )

    if response.status_code != 200:
        message = response.json().get("message", "JWT validation failed")
        raise ValueError(message)

    user = response.json()
    return user["$id"]
