const fetch = require('node-fetch');

module.exports.load = async function(app, ifValidAPI, ejs) {
    app.post("/update_info", async (req, res) => {
        let redirects = process.pagesettings.redirectactions.update_info;

        if (!req.session.data || !req.session.data.userinfo) return res.redirect(redirects.notsignedin.path);

        let account_info_json = await fetch(
            `${process.env.pterodactyl.domain}/api/application/users/${req.session.data.dbinfo.pterodactyl_id}?include=servers`,
            {
                method: "get",
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.pterodactyl.key}` }
            }
        );

        if (await account_info_json.statusText == "Not Found") return res.redirect(redirects.error.path);

        let account_info = (await account_info_json.json()).attributes;

        req.session.data.panelinfo = account_info;

        return res.redirect(redirects.success.path);
    });
};