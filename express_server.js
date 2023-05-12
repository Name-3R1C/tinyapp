const cookieSession = require("cookie-session");
const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
app.use(cookieSession({
  name: 'session',
  keys: ['LHL', 'WebDevFlex'],
  maxAge: 24 * 60 * 60 * 1000
}));
app.set("view engine", "ejs");
const PORT = 8000;
app.use(express.urlencoded({ extended: true}));

/**
 * @description generate a string 6 random characters from a-z, A-Z and 0-9.
 * @returns string of 6 random characters
 */
const generateRandomString = function() {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    randomString += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  // ShortURL must start with a letter because urlDatabase is an object
  if (isNaN(randomString.charAt(0))) {
    randomString[0] = 'a';
  }
  return randomString;
};

/**
 * @description check if an given email exits
 * @param {string} email - an email address
 */
const userLookUpByEmail = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
};

/**
 * @description get all urls that belong to specific user
 * @param {*} id user ID
 * @returns url(s)
 */
const urlsForUser = function(id) {
  const userUrl = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrl[url] = urlDatabase[url];
    }
  }
  return userUrl;
};

const users = {};
const urlDatabase = {};

// Does not seem to be needed and have no instructions of what to do with it, so instead of showing Hello, I redirect it to the TinyApp page
app.get("/", (req, res) => {
  // res.send("Hello!");
  res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  if (!userID) {
    return res.status(403).send(`
    <div> 
      <h2>Login to use this feature</h2>
      <a href = "/login">Login</a>
    </div>
  `);
  }
  const templateVars = {
    urls: urlsForUser(userID),
    user: users[userID],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;
  if (!userID) {
    return res.status(403).send(`
    <div> 
      <h2>Login to use this feature</h2>
      <a href = "/login">Login</a>
    </div>
  `);
  }
  const user = users[userID];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.session.userID;
  if (!userID) {
    return res.status(403).send(`
    <div> 
      <h2>Login to use this feature</h2>
      <a href = "/login">Login</a>
    </div>
  `);
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(403).send("Invalided Shortened URL, check again");
  }

  if (urlDatabase[req.params.id].userID !== userID) {
    return res.status(401).send("Unauthorized access request, url does no belongs to this user");
  }
  
  const templateVars = {
    id: req.params.id,
    url: urlDatabase,
    shortURL: req.params.id,
    user: users[userID],
    users,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const userID = req.session.userID;
  const user = users[userID];

  if (!user) {
    const templateVars = {user: null};
    res.render("urls_register", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const userID = req.session.userID;
  const user = users[userID];

  if (!user) {
    const templateVars = {user: null};
    res.render("urls_login", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  const userID = req.session.userID;

  if (!userID) {
    return res.status(403).send("Login required to use shorten URLs");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userID
  };
  res.redirect(`urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(403).send("Invalided URL, check again");
  }

  const user = users[req.session.userID];

  if (!user) {
    return res.status(403).send("Login in required to delete URL");
  }

  if (user.id !== urlDatabase[req.params.id].userID) {
    return res.status(401).send("Unauthorized delete request, url does no belongs to this user");
  }
  
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const user = users[req.session.userID];
  
  if (!user) {
    return res.status(403).send("Login in required to edit URL");
  }

  if (user.id !== urlDatabase[req.params.id].userID) {
    return res.status(401).send("Unauthorized edit request, url does no belongs to this user");
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const user = userLookUpByEmail(email);

  if (!user) {
    return res.status(403).send("E-mail does not exits");
  }
  if(!bcrypt.compareSync(req.body.password, user.hashedPassword)) {
    return res.status(403).send("Password does not match");
  }

  req.session.userID = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send("Please provide an E-mail and password");
  }
  if (userLookUpByEmail(email)) {
    return res.status(400).send("E-mail already registed");
  }

  const userID = generateRandomString();
  const newUser = {
    id: userID,
    email,
    hashedPassword,
  };

  users[userID] = newUser;
  req.session.userID = userID;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});