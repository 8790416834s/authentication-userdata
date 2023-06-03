const express = require("express");
const app = express();
module.exports = app;
app.use(express.json());
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at 3000 port....");
    });
  } catch (e) {
    console.log(`Error Msg: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//Register
app.post("/register/", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const getUserQuery = `
    SELECT 
        * 
    FROM 
     user
    WHERE username = '${username}';`;
  const userResponse = await db.get(getUserQuery);
  if (userResponse === undefined) {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    }
    const insertQuery = `
        INSERT INTO user (username, name, password, gender, location)
        VALUES ('${username}', '${name}', '${password}', '${gender}', '${location}');`;
    const dbResponse = await db.run(insertQuery);
    response.send("User created successfully");
    response.status(200);
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Login
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `
    SELECT * FROM user
    WHERE username = '${username}';`;
  const userResponse = await db.get(getUserQuery);
  if (userResponse !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userResponse.password
    );
    if (isPasswordMatched === true) {
      response.send("Login success");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//Change Password
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedCode = await bcrypt.hash(oldPassword, 10);
  const getQuery = `SELECT * FROM user
    WHERE username = '${username}';`;
  const getResponse = await db.get(getQuery);
  if (getResponse !== undefined) {
    const isMatched = await bcrypt.compare(
      oldPassword,
      getResponse.oldPassword
    );
    if (isMatched === true) {
      console.log("correct password");
    } else {
      response.send("Invalid current password");
      response.status(400);
    }
  }
});
