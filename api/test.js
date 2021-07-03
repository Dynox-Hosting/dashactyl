module.exports.load = async function(app, ifValidAPI, ejs) {

    app.post("/api/admin/some_path", async (req, res) => {
        if (ifValidAPI(req, res, 'some permission')) {
            res.send({error: "none", success: "test"});
        };
    });

};