const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
app.set("view engine", "ejs");
const PORT = 8000;

/**
 * Generate a random string from 0-9, a-z and A-Z, with a length of 6.
 * @constructor
 */
const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateRandomString = function() {
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
 *
 * @constructor
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

const users = {
  userRandomID: {
    id: "user1",
    email: "example@hotmail.com",
    password: "123",
  },
  user2RandomID: {
    id: "user2",
    email: "user2@example.com",
    password: "456",
  },
};

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "asm5xK": "http://www.google.com"
// };

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },

  asm5xK: {
    longURL: "http://www.google.com",
    useID: "user2RandomID",
  },
};

app.use(express.urlencoded({ extended: true}));

// Does not seem to be needed and have no instructions of what to do with it, so instead of showing Hello, I redirect it to the TinyApp page
app.get("/", (req, res) => {
  res.redirect("/urls");
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
  console.log("urlDatabase------------------")
  console.log(urlDatabase)
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies.userID;
  const user = users[userID];
  if (user) {
    const templateVars = { user };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(403).send("Invalided Shortened URL, check again");
  }
  
  const userID = req.cookies.userID;
  const user = users[userID];
  const templateVars = {
    id: req.params.id,
    url: urlDatabase,
    shortURL: req.params.id,
    users,
    user,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const useID = req.cookies.userID;
  const user = users[useID];
  if (!user) {
    const templateVars = {user: null};
    res.render("urls_register", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const useID = req.cookies.userID;
  const user = users[useID];
  if (!user) {
    const templateVars = {user: null};
    res.render("urls_login", templateVars);
  } else {
    res.redirect("/urls");
  }
  
});

app.post("/urls", (req, res) => {
  const useID = req.cookies.userID;
  const user = users[useID];
  if (user) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      useID: useID
    };
    res.redirect(`urls/${shortURL}`);
  } else {
    return res.status(403).send("Login required to use shorten URLs");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.cookies.userID];
  if (user) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    return res.status(403).send("Login in required to delete URL");
  }
});

app.post("/urls/:id", (req, res) => {
  const user = users[req.cookies.userID];
  if (user) {
    const shortURL = req.params.id;
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    return res.status(403).send("Login in required to edit URL");
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const user = userLookUpByEmail(email);

  if (!user) {
    return res.status(403).send("E-mail does not exits");
  }
  if (user.password !== req.body.password) {
    return res.status(403).send("Password does not match");
  }
  res.cookie('userID', user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('userID');
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

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
    password,
  };

  users[userID] = newUser;
  res.cookie('userID', userID);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});