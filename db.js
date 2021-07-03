const fetch = require('node-fetch');
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.database.host,
  port: process.env.database.port,
  user: process.env.database.user,
  password: process.env.database.password,
  database: process.env.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// TODO: Add code that creates the "accounts" table for you.

module.exports = {
  async createAccountOnDB(discord_id, pterodactyl_id) {
    return new Promise((resolve, reject) => {
      pool.query(
        `INSERT INTO accounts (discord_id, pterodactyl_id, coins, package, ram, disk, cpu, servers) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          discord_id,
          pterodactyl_id,
          0,
          null,
          null,
          null,
          null,
          null
        ],

        function (error, results, fields) {
          if (error) return reject(error);

          resolve(true);
        }
      );
    });
  },

  async createOrFindAccount(username, email, first_name, last_name) {
    let generated_password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    let account = await fetch(
      `${process.env.pterodactyl.domain}/api/application/users`,
      {
        method: "post",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.pterodactyl.key}`
        },
        body: JSON.stringify({
          username: username,
          email: email,
          first_name: first_name,
          last_name: last_name,
          password: process.env.pterodactyl.generate_password_on_sign_up ? generated_password : undefined
        })
      }
    ); 

    if (await account.status == 201) { // Successfully created account.

      const accountinfo = await account.json();

      await this.createAccountOnDB(username, accountinfo.attributes.id);

      accountinfo.attributes.password = generated_password;

      accountinfo.relationships = { servers: { object: "list", data: [] } };

      return accountinfo.attributes;

    } else { // Find account.

      let accountlistjson = await fetch(
        `${process.env.pterodactyl.domain}/api/application/users?include=servers&filter[email]=${encodeURIComponent(email)}`,
        {
          method: "get",
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.pterodactyl.key}`
          }
        }
      );

      const accountlist = await accountlistjson.json();
      const user = accountlist.data.filter(acc => acc.attributes.email == email);

      if (user.length == 1) {

        let userid = user[0].attributes.id;
        await this.createAccountOnDB(username, userid);

        return user[0].attributes;

      };

      return false;
    };
    
  },

  async fetchAccountPterodactylID(pterodactyl_id) {
    return new Promise((resolve, reject) => {
      pool.query(`SELECT * FROM accounts WHERE pterodactyl_id = ?`, [pterodactyl_id], function (error, results, fields) {
        if (error) return reject(error);
      
        if (results.length !== 1) return resolve(null);

        let userInfo = results[0];
    
        resolve(userInfo);
      });
    });
  },

  async fetchAccountDiscordID(discord_id) {
    return new Promise((resolve, reject) => {
      pool.query(`SELECT * FROM accounts WHERE discord_id = ?`, [discord_id], function (error, results, fields) {
        if (error) return reject(error);
      
        if (results.length !== 1) return resolve(null);

        let userInfo = results[0];
    
        resolve(userInfo);
      });
    });
  }
};