"""Runtime configuration supplied by the deployment environment.

Set these values in Lambda Environment variables (or locally in your shell).
Never commit database passwords or a Flask secret key to source control.
"""

import os


DB_HOST = os.environ["medibill-db.c8fkemycy9sg.us-east-1.rds.amazonaws.com"]
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.environ["DB_USER"]
DB_PASSWORD = os.environ["DB_PASSWORD"]
DB_NAME = os.environ["DB_NAME"]
SECRET_KEY = os.environ["SECRET_KEY"]

# A comma-separated list of browser origins allowed to call the API directly.
# CloudFront deployments normally use the same origin, so no extra value is
# needed there.  The default makes local development work with Live Server.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500"
    ).split(",")
    if origin.strip()
]
