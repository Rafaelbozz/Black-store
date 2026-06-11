const { Router } = require("express");
const router = Router();
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const requestIp = require("request-ip");
const axios = require("axios");
const { JsonDatabase } = require("wio.db");
const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const users = new JsonDatabase({ databasePath: "./DataBaseJson/users.json" });
const configAuth02Path = path.join(__dirname, "..", "DataBaseJson", "configauth02api.json");
const configGeralPath = path.join(__dirname, "..", "DataBaseJson", "configauth.json");


router.get("/auth02/verify", async (req, res) => {
    const ip = requestIp.getClientIp(req);
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Código de autenticação ausente.");
    }

    try {
        if (!fs.existsSync(configAuth02Path)) {
            return res.status(500).send("Configuração do Bot Auth02 não encontrada.");
        }
        const authData = JSON.parse(fs.readFileSync(configAuth02Path, "utf-8"));
        
        const configGeral = JSON.parse(fs.readFileSync(configGeralPath, "utf-8"));

        res.redirect(`https://ilusionsoluctions.com.br/sucesso`); // Mude para sua página de sucesso

        const tokenResponse = await axios.post(
            'https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: authData.bot_id,
                client_secret: authData.secret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `https://ilusionsoluctions.com.br/auth02/verify`,
                scope: 'identify guilds.join'
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const tokenData = tokenResponse.data;

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });

        const user = userResponse.data;
        const dataCriacao = getCreationDate(user.id);
        const idadeConta = getTempoDesdeCriacao(dataCriacao);
        const userAgent = req.get('User-Agent') || "";
        const dispositivo = parseUserAgent(userAgent);

        await users.set(user.id, {
            username: user.username,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            date: new Date().toISOString()
        });

        try {
            await axios.put(
                `https://discord.com/api/v10/guilds/${configGeral.guild_id}/members/${user.id}/roles/${configGeral.role}`,
                {},
                { headers: { Authorization: `Bot ${authData.token}` } }
            );
        } catch (roleErr) {
            console.error("Erro ao adicionar cargo:", roleErr.response?.data || roleErr.message);
        }

        if (configGeral.webhook_logs) {
            const embed = {
                title: "✅ | Usuário Verificado (Auth02)",
                color: 0x0cd4cc,
                fields: [
                    { name: "👥 Usuário", value: `<@${user.id}> (\`${user.id}\`)`, inline: true },
                    { name: "🪐 IP", value: `||${ip}||`, inline: true },
                    { name: "📆 Conta Criada", value: `\`há ${idadeConta}\``, inline: true },
                    { name: "💻 Dispositivo", value: `\`${dispositivo}\``, inline: false }
                ],
                timestamp: new Date()
            };

            await axios.post(configGeral.webhook_logs, {
                content: `🔔 Novo usuário autenticado: <@${user.id}>`,
                embeds: [embed]
            });
        }

    } catch (err) {
        console.error("Erro no callback Auth02:", err.response?.data || err.message);
    }
});

module.exports = router;