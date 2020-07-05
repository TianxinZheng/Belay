var cur_pathname = window.location.pathname;
var cur_url = window.location.href;
var registration_form =  document.getElementById("registration_form");
var login_form =  document.getElementById("login_form");
var main_page = document.getElementById("main_page");
var ask_to_reset_page = document.getElementById("ask_to_reset_password");
var reset_page = document.getElementById("reset_page");

if (cur_pathname == "/") {
  main_page.style.display = "none";
  console.log(main_page.style.display);
  login_form.style.display = "block";
}else if (cur_pathname == "/register") {
  main_page.style.display = "none";
  registration_form.style.display = "block";
}else if (cur_pathname == "/ask_to_reset_password") {
  main_page.style.display = "none";
  ask_to_reset_page.style.display = "block";
} else if (cur_pathname == "/reset") {
  main_page.style.display = "none";
  var url = new URL(cur_url);
  var email = url.searchParams.get("magic");
  reset_page.style.display = "block";
  var email_address =  document.getElementById("email_to_reset");
  email_address.innerHTML = "Reset password for " + email;
} else if (cur_pathname == "/main_page") {
  main_page.style.display = "block";

}
function create_account() {
  var username =  document.getElementsByName("new_username")[0].value;
  var password =  document.getElementsByName("new_password")[0].value;
  var retyped_password = document.getElementsByName("retype_password")[0].value;
  var email =  document.getElementsByName("new_email")[0].value;
  if (password != retyped_password) {
    alert("passwords do not match");
    return;
  }
  fetch('/api/create_account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username,
      password: password,
      email: email
    })
  }).then((response) => {
    if (response.status === 200) {
      alert("You have successfully created a Belay account!");
      registration_form.style.display = null;
      window.history.pushState(null, null, url="/");
      login_form.style.display = "block";
    } else if (response.status === 302) {
      return response.json().then(data => {
        alert("A user with email " + data["email"] + " already exists.");
      });
    }
  })
}
function login() {
  var email =  document.getElementsByName("email")[0].value;
  var password =  document.getElementsByName("password")[0].value;
  var sidebar = document.getElementById("sidebar");
  var chat_area = document.getElementById("chat_area");
  var thread = document.getElementById("thread");
  fetch('/api/authenticate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password: password,
      email: email
    })
  }).then((response) => {
    if (response.status === 200) {
      return response.json().then(data => {
        //console.log("data user id " + data["user_id"]);
        console.log(data);
        console.log("get "+data["session_token"]);
        localStorage.setItem("session_token", data["session_token"]);

        login_form.style.display = null;
        window.history.pushState(null, null, url="/main_page");
        main_page.style.display = "flex";
        set_user_id(email);
        //console.log("my cur id " + localStorage.getItem("user_id"));
        get_channels();

        if (window.matchMedia('(max-width: 1000px)').matches) {
        //...
          console.log("narrow");

          sidebar.style.display = null;

        }
      })
    } else {
      alert("Incorrect username or password");
    }
  })
}

function set_user_id(email) {
  fetch('/api/get_user_id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email
    })
  }).then((response) => {
    if (response.status === 200) {
      return response.json().then(data => {
        //console.log("data user id " + data["user_id"]);
        localStorage.setItem("user_id", data["user_id"]);
      });
    }
  })
}

function reset_password() {
  var email =  document.getElementsByName("reset_email")[0].value;
  fetch('/api/check_email_existed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email
    })
  }).then((response) => {
    if (response.status === 302) {
      alert("This email hasn't registered.")
    }
  })
  fetch('/api/send_email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email
    })
  }).then((response) => {
    if (response.status === 200) {
      alert("Email sent successfully!")
      login_form.style.display = "block";
      ask_to_reset_page.style.display = null;
      window.history.pushState(null, null, url="/");
    } else {
      alert("Can't send email to this address.")
    }
  })
}
function change_password() {
  var cur_url = window.location.href;
  var url = new URL(cur_url);
  var email = url.searchParams.get("magic");
  var password =  document.getElementsByName("reset_password")[0].value;
  var retyped_password = document.getElementsByName("retype_reset_password")[0].value;
  if (password != retyped_password) {
    alert("passwords do not match");
    return;
  }
  fetch('/api/change_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      new_password: password
    })
  }).then((response) => {
    if (response.status === 200) {
      alert("Your password has been reset.")
      login_form.style.display = "block";
      reset_page.style.display = null;
      window.history.pushState(null, null, url="/");
    } else {
      alert("can't reset password.")
    }
  })
}
function create_channel() {
  var channel_name = prompt("provide a channel name: ");
  var user_id = localStorage.getItem("user_id");
  //console.log("id from localStorage");
  fetch('/api/create_channel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel_name: channel_name,
      creator: user_id,
      session_token: localStorage.getItem("session_token")
    })
  }).then((response) => {
    if (response.status === 200) {
      alert("Channel created!");
    } else {
      alert("can't create channel")
    }
  })
}

var last_read_message_dict = {};
function get_channels() {
  var channels = document.getElementById("channels");
  setInterval(function() {
    fetch('/api/get_channel_names',{
      headers: {
        'session_token': localStorage.getItem("session_token"),
      }
    })
  .then((response) => {
    if (response.status === 200) {
      return response.json().then(data => {
        while (channels.firstChild) {
          channels.removeChild(channels.firstChild);
        }
        //console.log(data);
        //console.log(data.data);

        for (var i = 0; i < data.data.length; i++) {
          var cha_name = data.data[i][0];
          //console.log(cha_name);

          var oneChannel = document.createElement('div');
          var name = document.createElement('p');
          name.style = "display:inline-block";
          name.innerText = cha_name + "     ";
          name.setAttribute("class", "names");
          name.onclick = function() {
            show_channel(this.innerText);
          }
          var numUnread = document.createElement('p');
          numUnread.style = "display:inline-block";
          //fetching num unread messages
          if (last_read_message_dict[cha_name] != undefined){
             count_unread(numUnread, cha_name, last_read_message_dict[cha_name]);
          }
          else{
            count_unread(numUnread, cha_name, -1);
          }
          numUnread.style.fontSize="small";
          oneChannel.append(name);
          oneChannel.append(numUnread);
          channels.append(oneChannel);
        }
      })
    } else {
      alert("can't fetch channels")
    }
  })},
  500);
}


function count_unread(numUnread, cha_name, lastMessageID) {
  fetch("/api/get_unread", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          channel: cha_name,
          lastMessageID:lastMessageID,
          session_token: window.localStorage.getItem("session_token")
        })})
            .then((response) => {
              if(response.status == 200) {
                response.json().then((data) => {
                count = data["count"];
                console.log(data["count"])
                numUnread.innerText=count;
              });
            }
  });}

var cur_get_message;
function show_channel(name) {
  history.pushState(null, null, "/channels/" + name);
  var title = document.getElementById("channel_title");
  title.textContent = name;
  var cur_channel = document.createElement("div");
  clearInterval(cur_get_message);
  var chat_history = document.getElementById("chat_history");
  console.log(localStorage.getItem("session_token"));
  cur_get_message = setInterval(function(){fetch("/api/fetch_messages", {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channel_name: name,
      session_token: localStorage.getItem("session_token")
    })
  }).then((response) => {
    if (response.status == 200) {
        return response.json().then(data => {
          while (chat_history.firstChild) {
             chat_history.removeChild(chat_history.firstChild);
          }
          while (cur_channel.firstChild) {
            cur_channel.removeChild(cur_channel.firstChild);
          }
          //console.log(data.messages);
          for (var i = 0; i < data.messages.length; i++) {
            var username = document.createElement('p');
            username.setAttribute("class", "usernames");
            username.textContent = data.messages[i][1];
            //console.log(data.messages[i][1]);
            var message = document.createElement('p');
            message.setAttribute("id", data.messages[i][0]);
            message.textContent = data.messages[i][2];
            cur_channel.append(username);
            cur_channel.append(message);
            cur_channel.setAttribute("class", "channel_content");
            //show_reply_number(cur_channel, data.messages[i][0]);
            if (last_read_message_dict[name]==undefined ||
              data.messages[i][0] > last_read_message_dict[name]){
              last_read_message_dict[name] = data.messages[i][0];
            }
            message.onclick = function() {
              show_thread(this.id);
            }
          }
          chat_history.append(cur_channel);
          cur_channel.style.display="block";
        })
    } else {
      alert("can't fetch messages from channel " + name);
    }
  })}, 500);
}

var cur_get_thread;
function show_thread(id) {
  var thread_area = document.getElementById("thread");
  var reply_history = document.getElementById("reply_history");
  thread_area.style.display = "block";
  var cur_path = window.location.pathname.split("/");
  var cur_channel = cur_path[2];
  document.getElementById('close_button').addEventListener('click', function(e) {
    e.preventDefault();
    this.parentNode.style.display = 'none';
  }, false);
  history.pushState(null, null, "/channels/" + cur_channel + "/" + id);
  var cur_message_thread = document.createElement("div");
  clearInterval(cur_get_thread);
  cur_get_thread = setInterval(function(){fetch("/api/fetch_thread", {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message_id: id,
      session_token: localStorage.getItem("session_token")
    })
  }).then((response) => {
    if (response.status == 200) {
        return response.json().then(data => {
          while (reply_history.firstChild) {
             reply_history.removeChild(reply_history.firstChild);
          }
          while (cur_message_thread.firstChild) {
            cur_message_thread.removeChild(cur_message_thread.firstChild);
          }
          //console.log(data.messages);
          for (var i = 0; i < data.messages.length; i++) {
            var username = document.createElement('p');
            username.textContent = data.messages[i][1];
            //console.log(data.messages[i][1]);
            username.setAttribute("class", "usernames");
            var message = document.createElement('p');
            message.setAttribute("id", data.messages[i][0]);
            message.textContent = data.messages[i][2];
            cur_message_thread.append(username);
            cur_message_thread.append(message);
            //cur_message.setAttribute("class", "thread_content");
            //show_reply_number(cur_channel, data.messages[i][0]);
          }
          reply_history.append(cur_message_thread);
          //cur_message_thread.style.display="block";
          //thread_area.style.display = "block";
        })
    } else {
      alert("can't fetch thread from channel " + name);
    }
  })}, 500);
}
/*
function show_reply_number(cur_channel, id) {
  fetch('/api/show_reply_number', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message_id: id
    })
  }).then((response) => {
    if (response.status === 200) {
      return response.json().then(data => {
        console.log(data);
        var count = document.createElement("p");
        count.textContent = data + " replies";
        cur_channel.append(count);
      })
    } else {
      alert("can't get reply count");
    }
  })
}
*/
function post_message() {
  var user_input = document.getElementById("input");
  var user_id = localStorage.getItem("user_id");
  console.log("user_id " + user_id);
  var cur_channel = window.location.pathname.slice(10);
    fetch('/api/send_messages', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user_id,
        content: user_input.value,
        channel: cur_channel,
        session_token: localStorage.getItem("session_token")
      })
    }).then((response) => {
      if (response.status == 200) {
      } else {
        alert("can't post message");
      }
      user_input.value = "";
    })
}

function post_reply() {
  var user_input = document.getElementById("reply_input");
  var user_id = localStorage.getItem("user_id");
  console.log("user_id " + user_id);
  var cur_path = window.location.pathname.split("/");
  var cur_channel = cur_path[2];
  var id = cur_path[3];
  //alert(cur_channel);
  //alert(id);
    fetch('/api/send_reply', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user_id,
        content: user_input.value,
        channel: cur_channel,
        message_id: id,
        session_token: localStorage.getItem("session_token")
      })
    }).then((response) => {
      if (response.status == 200) {
        //alert("send");
      } else {
        alert("can't post reply");
      }
      user_input.value = "";
    })
}
