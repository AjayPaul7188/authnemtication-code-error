const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");

let db = null;

initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  console.log(request.body);
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `select * from user where username = ${username};`;
  const dbUser = await db.run(selectUserQuery);
  if (dbUser === undefined && password.length >= 5) {
    const createUserQuery = `
        insert into
            user(username, name, password, gender, location)
        values (
            '${username}', 
            '${name}',
            '${hashedPassword}', 
            '${gender}',
            '${location}'
        )`;
    const dbResponse = await db.run(createUserQuery);
    response.send("User created successfully");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  }
  if (dbUser === username) {
    response.status = 400;
    response.send("User already exists");
  }
});

//API2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatched === true && newPassword.length >= 5) {
    const updatePasswordQuery = `
    update
        user
    set
        password: '${newPassword}'
    where
        username=${username};`;
    await db.run(updatePasswordQuery);
    response.send("Password updated");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
