import serverless_wsgi

from app import app


def _without_api_prefix(event):
    """Return an API Gateway event whose path is usable by the Flask app."""
    request_event = dict(event)

    for key in ("path", "rawPath"):
        value = request_event.get(key)

        if value == "/api":
            request_event[key] = "/"
        elif isinstance(value, str) and value.startswith("/api/"):
            request_event[key] = value[4:]

    return request_event


def lambda_handler(event, context):
    return serverless_wsgi.handle_request(
        app,
        _without_api_prefix(event),
        context
    )
