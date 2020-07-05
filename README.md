# Final Project for MPCS 52553: Belay (a Slack clone)

### How to run it?

1. install all needed packages
  `pip install -r requirements.txt`

2. create local database
- open your mysql database with `mysql -u root -p`
- run the files in `DBMigration` to create tables
- change the DB_NAME, DB_USERNAME, DB_PASSWORD to your database in secrets.cfg

3. run the following code to start the project on port 5000
`python -m flask run -p 5000`


### Features

- Belay lets users send and read real-time chat messages that are organized
  into rooms called Channels. Users see a list of all the channels on the server
  and can click one to enter that channel. Inside, they see all the messages
  posted to that channel by any user, and can post their own messages.
  All messages belong to a channel and all channels are visible to all users
- Channel names are unique strings of numbers, letters, and underscores (and no
  spaces). Any user can create a new channel, and the user who created a channel
  can delete it and all messages.
- Like Slack, messages may be threaded as Replies in response to a message in a
  channel. Messages in the channel will display how many replies they have if
  that number is greater than zero. Like in Slack, clicking will open the reply
  thread alongside the current messages in the channel, changing the screen from
  a 2-column layout to a 3-column layout. We don't support nested threads;
  messages either belong directly to a channel or are replies in a thread to a
  message that does, but replies can't have nested replies of their own.
- Like Slack, if a message contains any URLs that point to [valid image formats](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Supported_image_formats),
  display the images in the chat at the bottom of the message. Unlike Slack,
  we won't support uploading images from the user's computer.
- The channel display shows the number of unread messages in each channel (so
  somewhere you'll have to track the id of the most recent message a user has
  seen in each channel).
- Belay should use responsive styling to render reasonably in a phone browser.
  In particular, on mobile devices, when a user is not in a channel they should
  see the list of channels, and when they are in a channel or in a thread they
  should see just the messages in that channel or thread, with some menu element
  to let them return to the channel list.
- Users should have a display name and an email address, and be able to update
  either in the app. Users authenticate with their email address and a password,
  and can reset a lost password by having Belay send them a magic link. 
- Belay is a single-page web application. We serve a single HTML request on load
  and do not refresh the page. As users navigate to a channel, the application
  updates the navigation bar to reflect what channel they are in, and navigating
  to the URL for a specific channel opens the single-page application with that
  channel open. 
- Belay automatically sends non-blocking requests to the server to check for new
  channels and new messages in a channel. Like Slack, when it finds new messages
  in a channel, it displays a notification to users in that channel without
  moving the existing messages on the page. Users may click on the notification
  to load the new messages.




