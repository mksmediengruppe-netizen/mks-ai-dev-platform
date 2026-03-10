"""
Structured Logging Module for AI Dev Team Platform.

Provides JSON-formatted logging with request context, service identification,
and correlation IDs for distributed tracing across microservices.

Usage:
    from libs.shared.structured_logging import setup_logging, get_logger
    setup_logging(service_name="chat-api")
    logger = get_logger(__name__)
    logger.info("Processing request", extra={"user_id": 123, "action": "create_task"})
"""

import logging
import json
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from contextvars import ContextVar

# Context variable for request-scoped data
_request_id: ContextVar[str] = ContextVar("request_id", default="")
_user_id: ContextVar[str] = ContextVar("user_id", default="")

def set_request_context(request_id: str = None, user_id: str = None):
    """Set request-scoped context for logging."""
    if request_id:
        _request_id.set(request_id)
    else:
        _request_id.set(str(uuid.uuid4())[:8])
    if user_id:
        _user_id.set(str(user_id))

def clear_request_context():
    """Clear request-scoped context."""
    _request_id.set("")
    _user_id.set("")


class JSONFormatter(logging.Formatter):
    """JSON log formatter for structured logging."""

    def __init__(self, service_name: str = "unknown"):
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": self.service_name,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add request context if available
        req_id = _request_id.get("")
        if req_id:
            log_entry["request_id"] = req_id
        user_id = _user_id.get("")
        if user_id:
            log_entry["user_id"] = user_id

        # Add extra fields
        for key in ("user_id", "action", "task_id", "conversation_id",
                     "duration_ms", "status_code", "error_type", "endpoint"):
            val = getattr(record, key, None)
            if val is not None:
                log_entry[key] = val

        # Add exception info
        if record.exc_info and record.exc_info[1]:
            log_entry["error"] = str(record.exc_info[1])
            log_entry["error_type"] = type(record.exc_info[1]).__name__

        return json.dumps(log_entry, ensure_ascii=False, default=str)


class HumanReadableFormatter(logging.Formatter):
    """Human-readable formatter for development."""

    def __init__(self, service_name: str = "unknown"):
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        req_id = _request_id.get("")
        prefix = f"[{ts}] [{record.levelname:7s}] [{self.service_name}]"
        if req_id:
            prefix += f" [{req_id}]"
        msg = f"{prefix} {record.getMessage()}"
        if record.exc_info and record.exc_info[1]:
            msg += f"\n  ERROR: {record.exc_info[1]}"
        return msg


def setup_logging(service_name: str = "platform", log_level: str = None):
    """
    Configure structured logging for a service.

    Args:
        service_name: Name of the microservice (e.g., "chat-api", "task-runner")
        log_level: Override log level. Defaults to LOG_LEVEL env var or INFO.
    """
    level_str = log_level or os.environ.get("LOG_LEVEL", "INFO")
    level = getattr(logging, level_str.upper(), logging.INFO)

    # Determine format: JSON for production, human-readable for development
    env = os.environ.get("ENVIRONMENT", "production")
    use_json = env == "production"

    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    if use_json:
        handler.setFormatter(JSONFormatter(service_name=service_name))
    else:
        handler.setFormatter(HumanReadableFormatter(service_name=service_name))

    # Configure root logger
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Suppress noisy libraries
    for lib in ("urllib3", "httpx", "httpcore", "asyncio", "sqlalchemy.engine"):
        logging.getLogger(lib).setLevel(logging.WARNING)

    logging.getLogger(service_name).info(
        f"Structured logging initialized: service={service_name}, level={level_str}, format={'json' if use_json else 'human'}"
    )


def get_logger(name: str) -> logging.Logger:
    """Get a named logger."""
    return logging.getLogger(name)
