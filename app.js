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
app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body; //Destructuring the data from the API call
  let hashedPassword = await bcrypt.hash(password, 10); //Hashing the given password
  let checkTheUsername = `
SELECT *
FROM user
WHERE username = '${username}';`;
  let userData = await db.get(checkTheUsername); //Getting the user details from the database
  if (userData === undefined) {
    //checks the condition if user is already registered or not in the database
    /*If userData is not present in the database then this condition executes*/
    let postNewUserQuery = `
INSERT INTO
user (username,name,password,gender,location)
VALUES (
'${username}',
'${name}',
'${hashedPassword}',
'${gender}',
'${location}'
);`;
    if (password.length < 5) {
      //checking the length of the password
      response.status(400);
      response.send("Password is too short");
    } else {
      /*If password length is greater than 5 then this block will execute*/
      let newUserDetails = await db.run(postNewUserQuery); //Updating data to the database
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    /*If the userData is already registered in the database then this block will execute*/
    response.status(400);
    response.send("User already exists");
  }
});

//Login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `
    SELECT * FROM user
    ORDER BY username = '${username}';`;
  const userResponse = await db.get(getUserQuery);
  if (userResponse !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userResponse.password
    );
    if (isPasswordMatched === true) {
      response.send("Login success!");
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
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getQuery = `SELECT * FROM user
    ORDER BY username = '${username}';`;
  const getResponse = await db.get(getQuery);
  if (getResponse !== undefined) {
    const isMatched = await bcrypt.compare(oldPassword, getResponse.password);
    if (isMatched === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
