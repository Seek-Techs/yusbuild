"""
Custom exception handling for the Piles API.
"""

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns structured error responses.
    
    Ensures all errors follow a consistent format:
    {
        "error": "error_type",
        "detail": "human readable message",
        "status_code": 400
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Log the error
        view = context.get("view", None)
        view_name = view.__class__.__name__ if view else "Unknown"
        logger.error(
            "API error in %s: %s (status=%s)",
            view_name,
            str(exc),
            response.status_code,
        )

        # Standardize error format
        error_data = {
            "error": exc.__class__.__name__,
            "detail": str(exc),
            "status_code": response.status_code,
        }

        # Handle DRF validation errors (which have 'detail' as a dict)
        if isinstance(response.data, dict):
            if "detail" in response.data:
                error_data["detail"] = response.data["detail"]
            else:
                # Field-level validation errors
                error_data["detail"] = "Validation failed"
                error_data["errors"] = response.data
        else:
            error_data["detail"] = str(response.data)

        response.data = error_data
        return response

    # Unhandled exceptions (500 errors)
    logger.critical("Unhandled exception: %s", str(exc), exc_info=True)
    return Response(
        {
            "error": "InternalServerError",
            "detail": "An unexpected error occurred. Please try again later.",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
