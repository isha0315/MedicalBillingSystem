MediBill Cloud

MediBill Cloud is a web-based medical billing and patient-management application designed to manage patients, medical services, medicine inventory, and billing from a centralized system.

1. Project Overview

MediBill provides a simple workflow for a medical/clinic billing environment:

User registers/logs in.

Patient information is added and managed.

Medical services are selected while preparing a bill.

Medicines are selected from the inventory.

Available medicine stock is displayed during billing.

The system prevents billing a medicine quantity greater than the available stock on the frontend.

A bill number is automatically generated.

The bill is submitted to the backend.

The backend stores the bill and bill items in MySQL.

The generated invoice can be opened/printed.

2. Main Features

Authentication

User registration

User login

Session/cookie-based backend authentication

Logged-in user information displayed in the application

Patient Management

Add patient information

Retrieve patients for billing

Select an existing patient while creating a bill

Billing

Automatic bill-number generation

Patient selection

Add medical services

Add medicines

Quantity selection

GST calculation

Payment-method selection

Subtotal and total calculation

Generate bill

Open/print the generated invoice

Medicine Inventory

The billing module retrieves medicine information through the inventory API.

Each medicine is used with information such as:

Medicine name

Unit price

Available stock

During billing, the frontend checks the available stock. If the requested quantity is greater than the available stock, the quantity is restricted to the available amount.

Services

Services are retrieved from the backend and displayed when a service row is added to a bill.

3. Technology Stack

Frontend

HTML5

CSS3

JavaScript

Font Awesome/icons where used by the UI

Backend

Python

Flask

Flask-CORS

Serverless WSGI integration for Lambda

Database

MySQL

Amazon RDS for the deployed database

AWS / Cloud

Amazon EC2 — frontend/web-server hosting

Nginx — web server/reverse proxy on EC2

Amazon API Gateway — public API entry point

AWS Lambda — Flask backend execution

Amazon RDS MySQL — application database

Amazon S3 — project/static-file storage/backup where applicable

4. Application Architecture

The deployed application follows this flow:

                    ┌──────────────────┐
                    │     Browser      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  EC2 + Nginx    │
                    │ Frontend files   │
                    └────────┬─────────┘
                             │
                       /api requests
                             │
                             ▼
                    ┌──────────────────┐
                    │  API Gateway     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   AWS Lambda     │
                    │ Flask backend    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   RDS MySQL      │
                    │   Database       │
                    └──────────────────┘

The frontend uses:

const API_URL = "/api";

This keeps frontend API requests relative to the current website. Nginx forwards /api/ requests to the API Gateway endpoint.

5. Important Project Structure

A typical project structure used by MediBill is:

MedicalBillingSystem/
│
├── html/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── patient.html
│   ├── billing.html
│   ├── print.html
│   └── History.html
│
├── css/
│   ├── main.css
│   ├── dashboard.css
│   ├── register.css
│   └── ...
│
├── js/
│   ├── billing.js
│   ├── patient.js
│   ├── validation.js
│   └── ...
│
└── py/
    ├── app.py
    ├── db.py
    ├── config.py
    ├── lambda_function.py
    ├── serverless_wsgi.py
    ├── requirements.txt
    └── Python dependencies

Exact files may vary depending on the current project version.

6. Billing Data Flow

When the Billing page opens, the frontend:

billing.html
      │
      ▼
billing.js
      │
      ├── GET /api/patients
      │
      ├── GET /api/services
      │
      └── GET /api/inventory

The returned data is used to populate the Billing page.

Patient loading

The frontend expects patient information from the /patients API and creates patient options using the patient's ID, name, and phone.

Service loading

The /services endpoint provides services and their prices.

Medicine loading

The /inventory endpoint provides medicine information including stock.

The billing JavaScript uses the medicine stock to prevent a user from entering a quantity greater than the available stock.

7. Bill Generation Flow

When the user clicks Generate Bill:

Select Patient
      +
Add Services
      +
Add Medicines
      +
GST
      +
Payment Method
      ↓
Generate Bill
      ↓
POST /api/generate_bill
      ↓
Lambda / Flask
      ↓
MySQL
      ↓
Bill created
      ↓
GET /api/bill/<bill_number>
      ↓
print.html

The frontend sends information including:

{
  "bill_number": "generated-number",
  "patient_id": 1,
  "gst": 18,
  "payment_method": "Cash",
  "items": []
}

The exact values depend on the user's selections.

8. Bill Number Generation

The current billing frontend generates a bill number in JavaScript using the current date and a time-based value.

The format is similar to:

MB-YYYYMMDD-XXXXXX

Example:

MB-20260808-123456

The generated number is sent to the backend when the bill is submitted.

9. Database

The project uses MySQL. The application contains data concepts for areas such as:

users
patients
services
inventory
bills
bill_items

The exact schema should always be taken from the SQL file/database used by the deployed project.

Important

Do not put real database passwords, API secrets, Flask secret keys, or other credentials in this README or in source control.

Use environment variables for sensitive configuration.

10. Backend Configuration

The backend reads deployment configuration from environment variables.

Typical configuration includes:

DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
SESSION_COOKIE_SECURE

Never commit actual production credentials.

For the current HTTP-only EC2 setup, the deployed environment may use:

SESSION_COOKIE_SECURE=false

When the application is moved to HTTPS, this should be reviewed and normally changed to:

SESSION_COOKIE_SECURE=true

11. Local Development

Frontend

The frontend can be opened using a local development server such as VS Code Live Server/Live Preview.

Because the deployed frontend uses:

const API_URL = "/api";

local development may require a suitable backend/proxy configuration if the API is not being served from the same origin.

Backend

The Flask backend can be run locally when the required Python dependencies and environment variables are configured.

Do not place production database credentials directly inside app.py.

12. AWS Deployment

Frontend deployment

The current deployed website is served from EC2 using Nginx.

Frontend files are stored under:

/var/www/medibill/

Expected structure:

/var/www/medibill/html/
    index.html
    login.html
    register.html
    dashboard.html
    patient.html
    billing.html
    print.html

/var/www/medibill/css/

/var/www/medibill/js/

Nginx

Nginx serves the frontend and forwards API requests under /api/ to API Gateway.

Conceptually:

/             → frontend files
/api/...      → API Gateway

Lambda deployment

The Python backend is packaged into a Lambda ZIP.

A typical update process is:

cd path\to\MedicalBillingSystem\py

Remove-Item ..\medibill-lambda.zip -Force

Compress-Archive -Path * -DestinationPath ..\medibill-lambda.zip -Force

The ZIP is then uploaded to the Lambda function and deployed.

Only backend/dependency changes require rebuilding the Lambda ZIP.

Frontend-only changes such as billing.html or billing.js do not require a Lambda deployment.

13. Updating Frontend Files on EC2

The EC2 website is a separate copy of the project files.

Changing a file in VS Code does NOT automatically update the EC2 copy.

Use a file-transfer tool such as WinSCP or SCP to replace the corresponding file.

Examples:

Local:
html/billing.html

EC2:
 /var/www/medibill/html/billing.html

and:

Local:
js/billing.js

EC2:
 /var/www/medibill/js/billing.js

After updating frontend files, perform a hard browser refresh:

Ctrl + Shift + R

14. S3

S3 can be maintained as a backup/static-file location if it is part of the project's deployment workflow.

However, when the website is currently being served directly by EC2/Nginx, changing a file in S3 does not automatically change the copy already stored on EC2.

Keep the deployment source and EC2 copy synchronized when necessary.

15. Inventory / Stock Updates

The current Billing frontend reads stock from the inventory API.

The medicine data includes:

medicine_name
unit_price
stock

When a medicine is selected, the frontend displays the available stock and prevents the entered billing quantity from exceeding the available stock.

If a dedicated inventory-management UI is not implemented, stock can be updated directly in the MySQL inventory table.

Example:

USE medibill_db;

SELECT id, medicine_name, unit_price, stock
FROM inventory;

Then update the required medicine:

UPDATE inventory
SET stock = 50
WHERE id = 1;

Always verify the medicine ID before running an UPDATE.

16. Security Notes

Never commit:

Database passwords

AWS access keys

Private keys

.pem files

Flask secret keys

Production credentials

Recommended practice:

Environment Variables
        ↓
Application Configuration
        ↓
Database / AWS Services

The EC2 .pem file should remain private and should never be uploaded to GitHub, S3, or the project ZIP.

17. Troubleshooting

Website does not open

Check:

EC2 instance is running

Security Group allows HTTP port 80

Nginx is running

Frontend files exist under /var/www/medibill/

Useful commands:

sudo systemctl status nginx
sudo nginx -t

Frontend JavaScript changes are not visible

Perform:

Ctrl + Shift + R

Also verify that the updated file was copied to EC2.

API request fails

Check:

Browser Developer Tools → Network

API Gateway

Lambda logs in CloudWatch

Database connection fails

Check:

Lambda VPC configuration

Lambda security group

RDS security group

Database host/port

Environment variables

Do not expose database passwords in logs or screenshots.

Billing page fails

Check:

F12 → Console
F12 → Network

Verify requests to:

/api/patients
/api/services
/api/inventory
/api/generate_bill

The Billing JavaScript uses these API endpoints to retrieve data and generate the bill.

18. Current Billing JavaScript Behavior

The billing module:

Generates a bill number when the page loads.

Loads patients.

Loads services.

Loads medicine inventory.

Adds service rows.

Adds medicine rows.

Calculates subtotal.

Calculates GST.

Calculates total.

Checks available medicine stock.

Sends bill information to /generate_bill.

Retrieves the saved bill.

Stores the latest bill in browser local storage.

Redirects to print.html.

19. Project Limitations / Future Improvements

Potential future improvements include:

Dedicated inventory-management page

Add/edit/delete medicines through the UI

Stock-in and stock-out transaction history

Automatic stock deduction after successful billing

Low-stock alerts

Admin role and permissions

Better centralized authentication

HTTPS with a custom domain

CloudFront/CDN if required

Better audit logging

Automated deployment using CI/CD

Automated database backups

Stronger server-side validation for all billing quantities and prices

20. Important Deployment Rule

Before making a deployment change, identify whether the changed file belongs to:

Frontend

html/
css/
js/

Update the EC2/Nginx copy.

Backend

app.py
db.py
config.py
lambda_function.py
requirements.txt

Rebuild and redeploy the Lambda ZIP when required.

Database

SQL/schema/data changes should be applied to the RDS MySQL database carefully.

Do not modify AWS networking just because a frontend file was changed.

21. Quick Reference

Website

EC2 → Nginx → HTML/CSS/JS

API

Browser → /api → Nginx → API Gateway → Lambda

Database

Lambda → RDS MySQL

Billing

Patient
   ↓
Service / Medicine
   ↓
Quantity + Price
   ↓
GST
   ↓
Total
   ↓
Generate Bill
   ↓
MySQL
   ↓
Print Invoice

22. Project Goal

MediBill Cloud aims to provide a cloud-connected medical billing solution that combines patient management, medicine inventory, service management, and invoice generation while using AWS services for hosting, API execution, and database storage.

Note: This README describes the current project/deployment workflow. Before production use, credentials, authentication, authorization, HTTPS, server-side inventory validation, and stock transaction handling should be reviewed and strengthened.