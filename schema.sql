CREATE TABLE users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	bitcoinJungleUsername TEXT,
	approved BOOLEAN NOT NULL DEFAULT FALSE,
	timestamp INT
);