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

CREATE TABLE destination_blocklist (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	destination TEXT UNIQUE
);

INSERT INTO alert (timestamp, active, message) VALUES ('1970-01-01-T00:00:00.000Z', false, null);

ALTER TABLE orders ADD COLUMN paymentStatus TEXT;
ALTER TABLE orders ADD COLUMN settlementData TEXT;
UPDATE orders set paymentStatus = 'complete';

ALTER TABLE phone_numbers ADD COLUMN allow_instant NOT NULL DEFAULT false;
ALTER TABLE phone_numbers ADD COLUMN daily_buy_limit DECIMAL(10,2) NOT NULL DEFAULT 9999.99;
ALTER TABLE phone_numbers ADD COLUMN daily_sell_limit DECIMAL(10,2) NOT NULL DEFAULT 1100.00;

ALTER TABLE alert ADD COLUMN types TEXT;
UPDATE alert SET types = '{"USD":{"buy":true,"sell":true},"CRC":{"buy":true,"sell":true}}';

ALTER TABLE phone_numbers ADD COLUMN per_txn_limit DECIMAL(10,2) NOT NULL DEFAULT 999.00;

ALTER TABLE phone_numbers ADD COLUMN kyc_docs_link TEXT;