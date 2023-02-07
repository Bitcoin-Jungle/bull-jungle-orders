#sqlite3 orders.db

CREATE TABLE orders (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	fiat_amount INTEGER NOT NULL, 
	fiat_currency TEXT NOT NULL, 
	sat_amount INTEGER NOT NULL, 
	direction TEXT NOT NULL, 
	payment_request TEXT NOT NULL,
	`timestamp` datetime default current_timestamp
);
