const fetch = require('node-fetch');

module.exports = {
    /*
    async get_ptero_eggs(endpoint, clean_responce) {
        let temp = []
        if (endpoint) return "Failed"; // welcome to javascript
        if (clean_responce) let final_clean_responce = false;


        let nest_data = await fetch(`${process.env.pterodactyl.domain}/api/application/nests`, {
            "method": "GET",
            "headers": {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.pterodactyl.key}`
            }
        });
        let nests = nest_data['meta']['total']


        for (const type of nests) {
            let eggdata = await fetch(`${process.env.pterodactyl.domain}/api/application/nests/${type}/eggs`, {
                "method": "GET",
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.pterodactyl.key}`
                }
            });
            temp.push(eggdata['data']['attributes']['id']) 
        };
        return await temp;
    }
    */
};
