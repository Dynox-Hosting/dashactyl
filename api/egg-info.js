const fetch = require('node-fetch')

module.exports.load = async function(app, ifValidAPI, ejs) {
    app.get(`/api/egg-info`, async (req, res) => {
      let nest_id = req.query.nest_id;
      let egg_id = req.query.egg_id;

      if (!nest_id && !egg_id) res.send("Missing nest_id and egg_id.");
      if (!nest_id) return res.send("Missing nest_id.");
      if (!egg_id) return res.send("Missing egg_id.");

      let egginfo_raw = await fetch(`${process.env.pterodactyl.domain}/api/application/nests/${nest_id}/eggs/${egg_id}`, {
        "method": "GET",
        "headers": {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.pterodactyl.key}`
        }
      });

      return res.send(await egginfo_raw.json())
    });
};