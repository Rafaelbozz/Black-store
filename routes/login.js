const { Router } = require("express");
const router = Router();
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const {url, clientid, secret} = require("../DataBaseJson/configauth.json");

router.get("/auth/login", async(req, res) => {
    try {
        res.redirect(oauth.generateAuthUrl({
            clientId: clientid,
            clientSecret: secret,
            scope: ["identify", "guilds.join"],
            redirectUri: `${url}/auth/callback`
        }));
    } catch(err) {
        res.status(500).json({
            message:`${err.message}`,
            status: 500
        });
    }
});

module.exports = router;