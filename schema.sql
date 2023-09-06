CREATE TABLE users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	bitcoinJungleUsername TEXT UNIQUE,
	approved BOOLEAN NOT NULL DEFAULT FALSE,
	timestamp INT
);

CREATE TABLE payment_identifiers (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	identifier TEXT UNIQUE
);

CREATE TABLE phone_numbers (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	phoneNumber TEXT UNIQUE
);

CREATE TABLE orders (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	timestamp TEXT UNIQUE,
	status TEXT,
	data TEXT
);

CREATE TABLE alert (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	timestamp TEXT,
	active BOOLEAN,
	message TEXT
);

INSERT INTO alert (timestamp, active, message) VALUES ('1970-01-01-T00:00:00.000Z', false, null);

ALTER TABLE orders ADD COLUMN paymentStatus TEXT;
ALTER TABLE orders ADD COLUMN settlementData TEXT;
UPDATE orders set paymentStatus = 'complete';

ALTER TABLE phone_numbers ADD COLUMN allow_instant NOT NULL DEFAULT false;