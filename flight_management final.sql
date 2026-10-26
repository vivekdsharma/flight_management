-- ==============================================================================
-- FLIGHT MANAGEMENT SYSTEM - DATABASE CREATION & SETUP SCRIPT
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS flight_management;
USE flight_management;

-- ------------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES IN REVERSE DEPENDENCY ORDER
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS Booking;
DROP TABLE IF EXISTS Flights;
DROP TABLE IF EXISTS Passenger;

-- ------------------------------------------------------------------------------
-- 2. CREATE TABLES
-- ------------------------------------------------------------------------------

-- Passenger Table
CREATE TABLE Passenger (
    PassengerID INT PRIMARY KEY AUTO_INCREMENT,
    First_name VARCHAR(50) NOT NULL,
    Last_name VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    Role ENUM('user', 'admin') DEFAULT 'user',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_phone_numeric CHECK (Phone REGEXP '^[0-9]+$')
);

-- Flights Table
CREATE TABLE Flights (
    FlightID INT PRIMARY KEY AUTO_INCREMENT,
    AirlineName VARCHAR(50) NOT NULL,
    Departure_Place VARCHAR(50) NOT NULL,
    Destination_Place VARCHAR(50) NOT NULL,
    DepartureTime DATETIME NOT NULL,
    ArrivalTime DATETIME NOT NULL,
    SeatsAvailable INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL
);

-- Booking Table
CREATE TABLE Booking (
    BookingID INT PRIMARY KEY AUTO_INCREMENT,
    PassengerID INT,
    FlightID INT,
    BookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Confirmed', 'Cancelled', 'Pending') DEFAULT 'Pending',
    FOREIGN KEY (PassengerID) REFERENCES Passenger(PassengerID) ON DELETE CASCADE,
    FOREIGN KEY (FlightID) REFERENCES Flights(FlightID) ON DELETE CASCADE
);

-- Payment Table
CREATE TABLE Payment (
    PaymentID INT PRIMARY KEY AUTO_INCREMENT,
    BookingID INT,
    Amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Credit Card', 'Debit Card', 'UPI', 'Net Banking') NOT NULL,
    Status ENUM('Success', 'Failed', 'Pending') DEFAULT 'Pending',
    PaymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BookingID) REFERENCES Booking(BookingID) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 3. STORED PROCEDURES
-- ------------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS AddPassenger;
DELIMITER //
CREATE PROCEDURE AddPassenger(
    IN p_FirstName VARCHAR(50),
    IN p_LastName VARCHAR(50),
    IN p_Email VARCHAR(100),
    IN p_Phone VARCHAR(15),
    IN p_Password VARCHAR(255)
)
BEGIN
    INSERT INTO Passenger (First_name, Last_name, Email, Phone, password, Role)
    VALUES (p_FirstName, p_LastName, p_Email, p_Phone, p_Password, 'user');
END //
DELIMITER ;

-- ------------------------------------------------------------------------------
-- 4. TRIGGERS
-- ------------------------------------------------------------------------------

-- Trigger 1: Decrease seats available when a booking is created
DROP TRIGGER IF EXISTS reduce_seat_after_booking;
DELIMITER //
CREATE TRIGGER reduce_seat_after_booking
AFTER INSERT ON Booking
FOR EACH ROW
BEGIN
    UPDATE Flights
    SET SeatsAvailable = SeatsAvailable - 1
    WHERE FlightID = NEW.FlightID;
END //
DELIMITER ;

-- Trigger 2: Automatically confirm booking when payment is successful
DROP TRIGGER IF EXISTS confirm_booking_after_payment;
DELIMITER //
CREATE TRIGGER confirm_booking_after_payment
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
    IF NEW.Status = 'Success' THEN
        UPDATE Booking
        SET Status = 'Confirmed'
        WHERE BookingID = NEW.BookingID;
    END IF;
END //
DELIMITER ;

-- Trigger 3: Restore seat when a booking is cancelled
DROP TRIGGER IF EXISTS increase_seat_on_cancel;
DELIMITER //
CREATE TRIGGER increase_seat_on_cancel
AFTER UPDATE ON Booking
FOR EACH ROW
BEGIN
    IF OLD.Status != 'Cancelled' AND NEW.Status = 'Cancelled' THEN
        UPDATE Flights
        SET SeatsAvailable = SeatsAvailable + 1
        WHERE FlightID = NEW.FlightID;
    END IF;
END //
DELIMITER ;

-- ------------------------------------------------------------------------------
-- 5. SAMPLE DATA INSERTION
-- ------------------------------------------------------------------------------

-- Admin User: vsharma6_be23@thapar.edu (Password: hello@123)
-- Standard Users (Password: pass@123)
INSERT INTO Passenger (First_name, Last_name, Email, Phone, password, Role)
VALUES 
('Vivek', 'Sharma', 'vsharma6_be23@thapar.edu', '6239860497', '$2a$10$bBItRbSoIymnl3XWMcklrO6Jy1eL7ULmiIPhbFQaKdOeekhqzndre', 'admin'),
('Aryan', 'Singh', 'aryan.singh@example.com', '9876543211', '$2a$10$2xibxWdvJ7YynvA/TGnFuex.JclJqC0x0jYc8H5KjxLos2gMwPaTK', 'user'),
('Sneha', 'Patel', 'sneha.patel@example.com', '9876543212', '$2a$10$2xibxWdvJ7YynvA/TGnFuex.JclJqC0x0jYc8H5KjxLos2gMwPaTK', 'user'),
('Raj', 'Kumar', 'raj.kumar@example.com', '9876543213', '$2a$10$2xibxWdvJ7YynvA/TGnFuex.JclJqC0x0jYc8H5KjxLos2gMwPaTK', 'user'),
('Priya', 'Sharma', 'priya.sharma@example.com', '9876543214', '$2a$10$2xibxWdvJ7YynvA/TGnFuex.JclJqC0x0jYc8H5KjxLos2gMwPaTK', 'user'),
('Karan', 'Malhotra', 'karan.malhotra@example.com', '9876543215', '$2a$10$2xibxWdvJ7YynvA/TGnFuex.JclJqC0x0jYc8H5KjxLos2gMwPaTK', 'user');

-- Flights with up-to-date realistic dates across major routes
INSERT INTO Flights (AirlineName, Departure_Place, Destination_Place, DepartureTime, ArrivalTime, SeatsAvailable, Price)  
VALUES 
('IndiGo', 'Delhi', 'Goa', '2026-10-27 08:00:00', '2026-10-27 10:30:00', 148, 5200.00),
('Air India', 'Mumbai', 'Chennai', '2026-10-27 09:00:00', '2026-10-27 11:30:00', 160, 4800.00),
('SpiceJet', 'Bangalore', 'Kolkata', '2026-10-28 07:30:00', '2026-10-28 10:15:00', 140, 5100.00),
('Vistara', 'Pune', 'Delhi', '2026-10-28 12:00:00', '2026-10-28 14:30:00', 180, 5600.00),
('GoAir', 'Hyderabad', 'Jaipur', '2026-10-29 06:45:00', '2026-10-29 09:15:00', 170, 4700.00),
('IndiGo', 'Delhi', 'Mumbai', '2026-10-29 11:00:00', '2026-10-29 13:15:00', 150, 4200.00),
('Air India', 'Mumbai', 'Goa', '2026-10-30 14:00:00', '2026-10-30 15:15:00', 165, 3400.00),
('Vistara', 'Bangalore', 'Delhi', '2026-10-30 16:30:00', '2026-10-30 19:15:00', 175, 6200.00),
('SpiceJet', 'Delhi', 'Goa', '2026-11-01 09:30:00', '2026-11-01 12:00:00', 180, 4950.00),
('IndiGo', 'Mumbai', 'Bangalore', '2026-11-02 10:00:00', '2026-11-02 11:45:00', 190, 3800.00);

-- Initial Bookings & Payments
INSERT INTO Booking (PassengerID, FlightID, Status)
VALUES 
(2, 1, 'Confirmed'),
(3, 2, 'Confirmed');

INSERT INTO Payment (BookingID, Amount, payment_method, Status)
VALUES 
(1, 5200.00, 'UPI', 'Success'),
(2, 4800.00, 'Credit Card', 'Success');

-- ------------------------------------------------------------------------------
-- 6. VERIFICATION QUERIES (Reference Only)
-- ------------------------------------------------------------------------------
-- SELECT * FROM Passenger;
-- SELECT * FROM Flights;
-- SELECT * FROM Booking;
-- SELECT * FROM Payment;
