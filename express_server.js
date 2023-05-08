const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
app.set("view engine", "ejs");
const PORT = 8000;

const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateRandomString = function() {
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    randomString += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  return randomString;
};

const userLookUpByEmail = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "example@hotmail.com",
    password: "123",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "456",
  },
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true}));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.userID],
  };
  // user NOT set because have NOT loggedin!
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", users);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    users,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/urls", (req, res) => {
  const userID = generateRandomString();
  urlDatabase[userID] = req.body.longURL;
  res.redirect(`urls/${userID}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const user = userLookUpByEmail(email);
  res.cookie('userID', user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('userID');
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Please provide an Email and password");
  }

  if (userLookUpByEmail(email)) {
    return res.status(400).send("Email already registed");
  }

  const userID = generateRandomString();
  const newUser = {
    id: userID,
    email,
    password,
  };

  users[userID] = newUser;
  // console.log("updated UsersList: ");
  // console.log(users);
  res.cookie('userID', userID);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});