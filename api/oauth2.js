const fetch = require('node-fetch');

module.exports.load = async function(app, ifValidAPI, ejs) {

  app.get("/login", async (req, res) => {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.discord.id}&redirect_uri=${encodeURIComponent(process.env.discord.callbackpath)}&response_type=code&scope=identify%20email${!process.env.discord.prompt ? "&prompt=none" : (req.query.prompt ? (req.query.prompt == "none" ? "&prompt=none" : "") : "")}`);
  });

  app.get("/logout", (req, res) => {
    req.session.destroy(() => {
      return res.redirect(process.pagesettings.redirectactions.logout.path);
    });
  });

  app.get("/callback", async (req, res) => {
    let redirects = process.pagesettings.redirectactions.oauth2;

    if (req.query.error && req.query.error_description)
      if (req.query.error == "access_denied" && req.query.error_description == "The resource owner or authorization server denied the request")
        return res.redirect(redirects.cancelledloginaction.path);

    if (!req.query.code) return res.redirect(redirects.missingcode.path);

    let oauth2Token = await fetch(
      'https://discord.com/api/oauth2/token',
      {
        method: "post",
        body: `client_id=${process.env.discord.id}&client_secret=${process.env.discord.secret}&grant_type=authorization_code&code=${encodeURIComponent(req.query.code)}&redirect_uri=${encodeURIComponent(process.env.discord.callbackpath)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    if (!oauth2Token.ok) return res.redirect(redirects.invalidcode.path);

    let tokenInfo = JSON.parse(await oauth2Token.text());
    let scopes = tokenInfo.scope;
    
    if (scopes !== 'identify email') return res.redirect(redirects.badscopes.path);

    let userinfo_raw = await fetch(
      'https://discord.com/api/users/@me',
      {
        method: "get",
        headers: {
          "Authorization": `Bearer ${tokenInfo.access_token}`
        }
      }
    );

    let userinfo = JSON.parse(await userinfo_raw.text());

    if (!userinfo.verified) return res.redirect(redirects.unverified.path);

    let dbinfo = await process.db.fetchAccountDiscordID(userinfo.id);
    let panel_id;
    let panelinfo;
    let generated_password = null;

    if (!dbinfo) {
      // Create account.

      panelinfo = await process.db.createOrFindAccount(userinfo.id, userinfo.email, userinfo.username, `#${userinfo.discriminator}`);

      if (!panelinfo) return res.redirect(redirects.anotheraccount.path);

      panel_id = panelinfo.id;

      if (panelinfo.password) generated_password = panelinfo.password;
    } else {
      // Fetch account information.

      panel_id = dbinfo.pterodactyl_id;

      let panelinfo_raw = await fetch(
        `${process.env.pterodactyl.domain}/api/application/users/${panel_id}?include=servers`,
        {
          method: "get",
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.pterodactyl.key}` }
        }
      );

      if (await panelinfo_raw.statusText == "Not Found") return res.redirect(redirects.cannotgetinfo.path);

      panelinfo = (await panelinfo_raw.json()).attributes;
    };

    req.session.data = {
      dbinfo: dbinfo,
      userinfo: userinfo,
      panelinfo: panelinfo
    };

    if (generated_password) req.session.variables = {
      password: generated_password
    };

    res.redirect(redirects.success.path);

  });

};