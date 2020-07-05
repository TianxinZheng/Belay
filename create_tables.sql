DROP DATABASE IF EXISTS txzheng;
CREATE DATABASE txzheng CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE txzheng;

DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
	user_id INT PRIMARY KEY, 
  	email VARCHAR(100) NOT NULL,
    username VARCHAR(20) NOT NULL,
    password VARCHAR(60) NOT NULL
);

DROP TABLE IF EXISTS channels CASCADE;
CREATE TABLE channels(
	channel_name VARCHAR(30) PRIMARY KEY,
	creator int NOT NULL REFERENCES users(user_id)
);

DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages(
	message_id INT PRIMARY KEY AUTO_INCREMENT,
	user_id INT REFERENCES users(user_id),
	channel_name VARCHAR(30) REFERENCES channels(channel_name),
	content VARCHAR(255),
	reply_to INT DEFAULT NULL
)

