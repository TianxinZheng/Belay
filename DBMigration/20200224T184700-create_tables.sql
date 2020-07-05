-- sudo mysql -u root weblog < 20200224T184700-create_tables.sql

DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
	user_id INT PRIMARY KEY, 
  	email VARCHAR(100) NOT NULL,
    username VARCHAR(20) NOT NULL,
    password BINARY(60) NOT NULL
);

DROP TABLE IF EXISTS channels CASCADE;
CREATE TABLE channels(
	channel_name VARCHAR(30) PRIMARY KEY,
	creator int NOT NULL REFERENCES users(user_id)
);