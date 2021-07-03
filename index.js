"use strict";

// Hey! Use comments for everything you do.

// Load packages.

const fs = require("fs"); // Load file manager package.
const yaml = require('js-yaml'); // Loads YAML to JSON converter package.
const express = require("express"); // Loads express (website) package.
const ejs = require("ejs"); // Loads EJS (express addon, used to add backend JS on files) package.
const session = require("express-session"); // Loads session package.

// Load settings.

const settings = yaml.load(fs.readFileSync('./settings.yml', 'utf8')); // Loads "settings.yml" and loads the yaml file as a JSON.
process.env = settings; // Makes "process.env" contain settings.

if (process.env.pterodactyl.domain.slice(-1) == "/") process.env.pterodactyl.domain = process.env.pterodactyl.domain.slice(0, -1);

// Loads database.

const db = require("./db.js");

// Loads functions.

const functions = require("./functions.js");

// Loads page settings.

process.pagesettings = yaml.load(fs.readFileSync('./frontend/pages.yml', 'utf8')); // Loads "settings.yml" and loads the yaml file as a JSON.

setInterval(
  () => {
    process.pagesettings = yaml.load(fs.readFileSync('./frontend/pages.yml', 'utf8')); // This line of code is suppose to update any new pages.yml settings every minute.
  }, 60000
);

// Makes "process.db" have the database functions.

process.db = db;

// Make "process.functions" have the custom functions..

process.functions = functions;

// Start express website.

const app = express(); // Creates express object.

app.use(express.json({ // Some settings for express.
  inflate: true,
  limit: '500kb',
  reviver: null,
  strict: true,
  type: 'application/json',
  verify: undefined
}));

const listener = app.listen(settings.website.port, function() { // Listens the website at a port.
  console.log("[WEBSITE] The application is now listening on port " + listener.address().port + "."); // Message sent when the port is successfully listening and the website is ready.

  let apifiles = fs.readdirSync('./api').filter(file => file.endsWith('.js') && file !== "pages.js"); // Gets a list of all files in the "api" folder. Doesn't add any "pages.js" to the array.
  apifiles.push("pages.js"); // Adds "pages.js" to the end of the array. (so it loads last, because it has a "*" request)

  apifiles.forEach(file => { // Loops all files in the "api" folder.
    let apifile = require(`./api/${file}`); // Loads the file.
    apifile.load(app, ifValidAPI, ejs); // Gives "app" to the file.
  });

});

app.use(session( // Starts sessions (express) addon.
  {
    secret: settings.website.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.website.secure
    }
  }
));

/*
  ifValidAPI(req, res, permission);

  req = request
  res = response
  permissions = permission from settings.yml.
*/

function ifValidAPI(req, res, permission) {
  let auth = req.headers['authorization'];

  if (auth) {
    if (auth.startsWith("Bearer ") && auth !== "Bearer ") {
      let validkeys = Object.entries(process.env.api).filter(key => key[0] == auth.slice("Bearer ".length));
      if (validkeys.length == 1) {
        let validkey = validkeys[0][1];
        if (permission) {
          if (validkey[permission]) {
            return true;
          };

          res.status(403);
          res.send({ error: process.pagesettings.apimessages.missingAPIPermissions }); // Gets missingAPIPermissions message.

          return false;
        };

        return true;
      };
    };
  };

  res.status(403);
  res.send({ error: process.pagesettings.apimessages.invalidAPIkey }); // Gets invalidAPIkey message.

  return false;
};