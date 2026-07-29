import hashlib
import json
import secrets
from cryptography.fernet import Fernet, InvalidToken


class CredentialVault:
    """Encrypts provider auth at rest. The master key must come from the environment."""

    def __init__(self, master_key: str):
        if not master_key:
            raise RuntimeError("WORKOUT_HUB_MASTER_KEY is required")
        try:
            self._fernet = Fernet(master_key.encode("ascii"))
        except (ValueError, TypeError) as exc:
            raise RuntimeError("WORKOUT_HUB_MASTER_KEY must be a valid Fernet key") from exc

    def encrypt_json(self, value: dict) -> str:
        payload = json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")
        return self._fernet.encrypt(payload).decode("ascii")

    def decrypt_json(self, encrypted: str) -> dict:
        try:
            payload = self._fernet.decrypt(encrypted.encode("ascii"))
        except InvalidToken as exc:
            raise RuntimeError("Stored Speediance connection cannot be decrypted") from exc
        return json.loads(payload.decode("utf-8"))


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def new_session_token() -> str:
    return secrets.token_urlsafe(48)
