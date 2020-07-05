-- sudo mysql -u root weblog < 20200224T184900-insert_users_and_channels.sql

INSERT INTO users 
VALUES (21234, "alice@uchicago.edu", "alice", '$2b$12$21pYPO4ettriIBCn4OoH1uItkzlUQncopvsdogydH5577j4JpAYXi');

INSERT INTO channels
VALUES ("dog", 21234);


INSERT INTO users 
VALUES (14284, "james@uchicago.edu", "james", '$2b$12$21pYPO4ettriIBCn4OoH1uxikswzTmkWjlnmpwQm8r8nCABBY6C.e');

INSERT INTO channels
VALUES ("cat", 14284);

INSERT INTO users 
VALUES (63253, "chen@uchicago.edu", "chen", '$2b$12$21pYPO4ettriIBCn4OoH1uAKfKDol4A4m9rHKxjwGM.TZwZyaW.06');

INSERT INTO channels
VALUES ("rabbit", 63253);

