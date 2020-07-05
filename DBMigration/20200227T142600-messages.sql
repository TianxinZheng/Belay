DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages(
	message_id INT PRIMARY KEY AUTO_INCREMENT,
	user_id INT REFERENCES users(user_id),
	channel_name VARCHAR(30) REFERENCES channels(channel_name),
	content VARCHAR(255),
	reply_to INT DEFAULT NULL
)