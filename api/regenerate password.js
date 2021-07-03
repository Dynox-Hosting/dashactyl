const fetch = require('node-fetch');

module.exports.load = async function(app, ifValidAPI, ejs) {

    app.post("/regen", async (req, res) => {
        let redirects = process.pagesettings.redirectactions.regenerate_password;

        if (!req.session.data || !req.session.data.userinfo) return res.redirect(redirects.notsignedin.path);

        let generated_password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        await fetch(
            `${process.env.pterodactyl.domain}/api/application/users/${req.session.data.dbinfo.pterodactyl_id}`,
            {
                method: "patch",
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.pterodactyl.key}`
                },
                body: JSON.stringify({
                    username: req.session.data.panelinfo.username,
                    email: req.session.data.panelinfo.email,
                    first_name: req.session.data.panelinfo.first_name,
                    last_name: req.session.data.panelinfo.last_name,
                    password: generated_password
                })
            }
        );

        req.session.variables = {
            password: generated_password
        };

        return res.redirect(redirects.success.path);
    });

};