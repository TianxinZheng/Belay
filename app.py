from flask import Flask, render_template, request, jsonify
from functools import wraps
from flask_debug import Debug
import string
import random
import datetime
import mysql.connector
import sendgrid
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import bcrypt
import configparser

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
Debug(app)

config = configparser.ConfigParser()
config.read('secrets.cfg')
PEPPER = config['secrets']['PEPPER']
DB_NAME = 'txzheng'
DB_USERNAME = config['secrets']['DB_USERNAME']
DB_PASSWORD = config['secrets']['DB_PASSWORD']

session_token_set = set()

@app.route('/')
@app.route('/channel/<int:channel_id>')
@app.route('/register')
@app.route('/ask_to_reset_password')
@app.route('/reset')
def index(channel_id=None):
    return app.send_static_file('index.html')

# -------------------------------- API ROUTES ----------------------------------

@app.route('/api/create_account', methods=['POST'])
def create ():
    username = request.get_json()["username"]
    password = request.get_json()["password"] + PEPPER
    email = request.get_json()["email"]
    user_id = generate_user_id()
    con = connect_to_datebase()
    cursor = con.cursor()  
    cursor.execute("SELECT COUNT(user_id) FROM users WHERE email = %s", (email, ))
    
    if cursor.fetchone()[0] == 1:
        return {"email": email}, 302
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    cursor.execute("INSERT INTO users VALUES (%s, %s, %s, %s)", 
    (user_id, email, username, hashed))
    con.commit()
    cursor.close()
    con.close()
    return {}, 200

@app.route('/api/authenticate', methods=['POST'])
def authenticate():
    email = request.get_json()["email"]
    password = request.get_json()["password"] + PEPPER
    con = connect_to_datebase()
    cursor = con.cursor() 
    session_token = generate_session_token()
    session_token_set.add(session_token)
    cursor.execute("SELECT * FROM users WHERE email=%s", (email, ))
    record = cursor.fetchone()
    if record == None or bcrypt.checkpw(password.encode('utf-8'), record[3].encode('utf-8')) == False:
        return {}, 302
    return {"session_token": session_token}, 200
        

@app.route('/api/send_email', methods=['POST'])
def send_email():
    
    email = request.get_json()["email"]
    magic_link = "http://127.0.0.1:5000/reset?magic=" + email
    message = Mail(
        from_email='admin@belay.com',
        to_emails=email,
        subject='Reseting your Belay password',
        html_content='Please click this link to reset your password: {}!'.format(magic_link))
        
    try:
        sg = SendGridAPIClient(os.environ.get('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'))
        response = sg.send(message)
        return {}, 200
    except Exception as e:
        print(str(e))
        return {}, 302

@app.route('/api/check_email_existed', methods=['POST'])
def check_email_existed():
    email = request.get_json()["email"]
    con = connect_to_datebase()
    cursor = con.cursor() 
    cursor.execute("SELECT * FROM users WHERE email=%s", (email, ))
    record = cursor.fetchone()
    if record == None:
        return {}, 302
    return {}, 200


@app.route('/api/change_password', methods=['POST'])
def change_password():
    email = request.get_json()["email"]
    password = request.get_json()["new_password"] + PEPPER
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    con = connect_to_datebase()
    cursor = con.cursor() 
    try:
        cursor.execute("update users set password =%s where email = %s", (hashed, email))
        con.commit()
    except Exception as e:
        print(str(e))
        return {}, 302
    finally:
        cursor.close()
        con.close()
        
    return {}, 200


@app.route('/api/get_user_id', methods=['POST'])
def get_user_id():
    email = request.get_json()["email"]
    con = connect_to_datebase()
    cursor = con.cursor() 
    try:
        cursor.execute("SELECT user_id FROM users where email = %s", (email, ))
        user_id = cursor.fetchone()[0]
        #print(user_id)
        return {"user_id": user_id}, 200

    except Exception as e:
        print(str(e))
        return {}, 302
    finally:
        cursor.close()
        con.close()

@app.route('/api/create_channel', methods=['POST'])
def create_channel():
    channel_name = request.get_json()["channel_name"]
    creator = request.get_json()["creator"]
    session_token = request.get_json()["session_token"]
    con = connect_to_datebase()
    cursor = con.cursor() 
    if session_token in session_token_set:
        try:
            cursor.execute("INSERT INTO channels VALUES (%s, %s)", (channel_name, creator))
            con.commit()
            return {}, 200

        except Exception as e:
            print(str(e))
            return {}, 302
        finally:
            cursor.close()
            con.close()
    else:
        return {}, 302


@app.route('/api/get_channel_names', methods=['GET'])
def get_channel_names():
    con = connect_to_datebase()
    cursor = con.cursor() 
    session_token = request.headers.get("session_token")
    if session_token in session_token_set:
        try:
            cursor.execute("SELECT channel_name FROM channels")
            channels = cursor.fetchall()
            #print(channels)
            return jsonify(data=channels), 200

        except Exception as e:
            print(str(e))
            return {}, 302
        finally:
            cursor.close()
            con.close()
    else:
        return {}, 302

@app.route('/api/get_unread', methods=['POST'])
def get_unread():
    body = request.get_json()
    channel = body['channel']
    lastid = body['lastMessageID']
    session_token = body['session_token']
    if session_token in session_token_set:
        con = connect_to_datebase()
        cursor = con.cursor() 
        query = "SELECT COUNT(*) FROM messages WHERE channel_name = (%s) AND message_id > (%s)\
        AND reply_to IS NULL"
        try:
            cursor.execute(query, (channel, lastid))
            count = cursor.fetchone()[0]
            print(count)
            return {"count":count}
        except Exception as e:
            print(e)

        finally:
            cursor.close()
            con.close()
    else:
        return {}, 302

@app.route('/api/fetch_messages', methods=['POST'])
def get_messages():
    channel_name = request.get_json()["channel_name"]
    #print(channel_name)
    session_token = request.get_json()["session_token"]
    con = connect_to_datebase()
    cursor = con.cursor() 
    if session_token in session_token_set:
        try:
            cursor.execute("SELECT message_id, username, content FROM messages NATURAL JOIN channels NATURAL JOIN users\
                WHERE channels.channel_name = %s AND reply_to IS NULL", (channel_name,))
            messages = cursor.fetchall()
            print(messages)
            return {"messages": messages}, 200

        except Exception as e:
            print(str(e))
            return {}, 302
        finally:
            cursor.close()
            con.close()
    else:
        return {}, 302

@app.route('/api/send_messages', methods=['POST'])
def send_messages():
    channel_name = request.get_json()["channel"]
    user_id = request.get_json()["user_id"]
    content = request.get_json()["content"]
    con = connect_to_datebase()
    cursor = con.cursor() 
    session_token = request.get_json()["session_token"]
    if session_token in session_token_set:
        try:
            cursor.execute("INSERT INTO messages (user_id, channel_name, content)\
                            VALUES(%s, %s, %s)", (user_id, channel_name, content))
            con.commit()
            return {}, 200

        except Exception as e:
            print(str(e))
            return {}, 302
        finally:
            cursor.close()
            con.close()
    else:
        return {}, 302

@app.route('/api/send_reply', methods=['POST'])
def send_reply():
    channel_name = request.get_json()["channel"]
    user_id = request.get_json()["user_id"]
    content = request.get_json()["content"]
    message_id = request.get_json()["message_id"]
    con = connect_to_datebase()
    cursor = con.cursor() 
    session_token = request.get_json()["session_token"]
    if session_token in session_token_set:
        try:
            cursor.execute("INSERT INTO messages (user_id, channel_name, content, reply_to)\
                            VALUES(%s, %s, %s, %s)", (user_id, channel_name, content, message_id))
            con.commit()
            return {}, 200

        except Exception as e:
            print(str(e))
            return {}, 302
        finally:
            cursor.close()
            con.close()
    else:
        return {}, 302

@app.route('/api/get_reply_number', methods=['POST'])
def get_reply_number():
    message_id = request.get_json()["message_id"]
    con = connect_to_datebase()
    cursor = con.cursor() 
    try:
        cursor.execute("SELECT count(*) from messages where reply_to = %s", (message_id))
        count = cursor.fetchone()[0]
        return {"count": count}, 200

    except Exception as e:
        print(str(e))
        return {}, 302
    finally:
        cursor.close()
        con.close()

@app.route('/api/fetch_thread', methods=['POST'])
def fetch_thread():
    message_id = request.get_json()["message_id"]
    session_token = request.get_json()["session_token"]
    con = connect_to_datebase()
    cursor = con.cursor() 
    if session_token in session_token_set:
        try:
            cursor.execute("SELECT message_id, username, content FROM messages NATURAL JOIN users\
                WHERE reply_to = %s", (message_id, ))
            messages = cursor.fetchall()
            #print(messages)
            return {"messages": messages}, 200

        except Exception as e:
            print(str(e))
            return {}, 302
        finally:
            cursor.close()
            con.close()
    else:
        return {}, 302

def connect_to_datebase():
    con = mysql.connector.connect(user=DB_USERNAME, password=DB_PASSWORD, 
                                  host='127.0.0.1', 
                                  database=DB_NAME, 
                                  unix_socket= '/Applications/MAMP/tmp/mysql/mysql.sock')               
    return con

def generate_user_id():
    num = 0
    for i in range(5):
        num = num * 10 + random.randint(0, 9)
    return num

def generate_magic_link():
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(15))

def generate_session_token():
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(8))


