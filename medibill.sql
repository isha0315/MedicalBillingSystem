CREATE DATABASE medibill_db;
USE medibill_db;
CREATE TABLE users (

    id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(100) UNIQUE NOT NULL,

    username VARCHAR(50) UNIQUE NOT NULL,

    password VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
INSERT INTO users
(full_name,email,username,password)

VALUES

(
'Isha Amar',
'isha@gmail.com',
'isha123',
'password123'
);
SELECT * FROM users;



CREATE TABLE patients (

    id INT PRIMARY KEY AUTO_INCREMENT,

    patient_name VARCHAR(100) NOT NULL,

    age INT NOT NULL,

    gender VARCHAR(10),

    phone VARCHAR(15),

    disease VARCHAR(100),

    address TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

SELECT * FROM patients;





CREATE TABLE bills (

    id INT PRIMARY KEY AUTO_INCREMENT,

    bill_number VARCHAR(30) UNIQUE,

    patient_id INT NOT NULL,

    consultation_fee DECIMAL(10,2) NOT NULL,

    medicine_charge DECIMAL(10,2) NOT NULL,

    laboratory_charge DECIMAL(10,2) DEFAULT 0,

    other_charge DECIMAL(10,2) DEFAULT 0,

    gst DECIMAL(10,2) NOT NULL,

    total_amount DECIMAL(10,2) NOT NULL,

    payment_method VARCHAR(30),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id)
    REFERENCES patients(id)
    ON DELETE CASCADE

);
SELECT * FROM bills;

DESCRIBE bills;
ALTER TABLE bills
ADD COLUMN subtotal DECIMAL(10,2) NOT NULL AFTER patient_id;

ALTER TABLE bills
DROP COLUMN consultation_fee,
DROP COLUMN medicine_charge,
DROP COLUMN laboratory_charge,
DROP COLUMN other_charge;

DESCRIBE bills;




CREATE TABLE inventory(
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_name VARCHAR(100),
    category VARCHAR(50),
    stock INT,
    unit_price DECIMAL(10,2),
    expiry_date DATE,
    supplier VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);





CREATE TABLE bill_items (

    id INT PRIMARY KEY AUTO_INCREMENT,

    bill_id INT NOT NULL,

    item_name VARCHAR(100) NOT NULL,

    item_type ENUM(
        'Consultation',
        'Medicine',
        'Laboratory',
        'Other'
    ) NOT NULL,

    quantity INT DEFAULT 1,

    unit_price DECIMAL(10,2) NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (bill_id)
    REFERENCES bills(id)
    ON DELETE CASCADE

);
DESCRIBE bills;
DESCRIBE bill_items;

CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO services (service_name, category, price) VALUES
('Doctor Consultation', 'Consultation', 500),
('Blood Test', 'Laboratory', 300),
('Urine Test', 'Laboratory', 200),
('X-Ray', 'Radiology', 600),
('ECG', 'Cardiology', 400),
('MRI Scan', 'Radiology', 2500),
('CT Scan', 'Radiology', 3000),
('Injection', 'Nursing', 150),
('Dressing', 'Nursing', 250);

DESCRIBE inventory;
SELECT * FROM inventory;
INSERT INTO inventory
(medicine_name, category, stock, unit_price, expiry_date, supplier)
VALUES
('Paracetamol 500mg','Tablet',100,20,'2028-12-31','Sun Pharma'),
('Crocin','Tablet',80,25,'2028-10-15','GSK'),
('Amoxicillin','Capsule',60,50,'2027-11-20','Cipla'),
('Azithromycin','Tablet',40,120,'2027-09-10','Abbott'),
('Dolo 650','Tablet',90,30,'2028-05-12','Micro Labs'),
('ORS','Powder',150,15,'2029-01-01','WHO Supply'),
('Cough Syrup','Syrup',35,95,'2027-08-15','Benadryl'),
('Insulin','Injection',20,450,'2027-12-31','Novo Nordisk'),
('Vitamin C','Tablet',120,10,'2028-07-20','Himalaya'),
('Bandage','Medical',200,12,'2030-01-01','3M');




ALTER TABLE users
ADD COLUMN role ENUM('Admin', 'Receptionist')
NOT NULL DEFAULT 'Receptionist'
AFTER password;

ALTER TABLE patients
ADD COLUMN created_by INT NULL
AFTER id;

ALTER TABLE bills
ADD COLUMN created_by INT NULL
AFTER patient_id;

ALTER TABLE patients
ADD CONSTRAINT fk_patients_created_by
FOREIGN KEY (created_by)
REFERENCES users(id);

ALTER TABLE bills
ADD CONSTRAINT fk_bills_created_by
FOREIGN KEY (created_by)
REFERENCES users(id);


---------------------------------


ALTER TABLE users
ADD COLUMN role ENUM('Admin', 'Receptionist')
NOT NULL DEFAULT 'Receptionist'
AFTER password;

ALTER TABLE patients
ADD COLUMN created_by INT NULL
AFTER id;

ALTER TABLE bills
ADD COLUMN created_by INT NULL
AFTER patient_id;

ALTER TABLE patients
ADD CONSTRAINT fk_patients_user
FOREIGN KEY (created_by)
REFERENCES users(id)
ON DELETE SET NULL;

ALTER TABLE bills
ADD CONSTRAINT fk_bills_user
FOREIGN KEY (created_by)
REFERENCES users(id)
ON DELETE SET NULL;

UPDATE users
SET role = 'Admin'
WHERE email = 'admin@gmail.com';


