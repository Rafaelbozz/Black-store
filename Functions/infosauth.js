const { ApplicationCommandType, EmbedBuilder, Webhook, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");
const client = require("discord.js")
const { owner, url, clientid, secret, webhook_logs, role, guild_id } = require("../DataBaseJson/configauth.json");
const { JsonDatabase } = require("wio.db");
const users = new JsonDatabase({ databasePath: "./DataBaseJson/users.json" });
const axios = require("axios");
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();


async function infosauth(interaction, client) {

    const all = await users.all().filter(a => a.data.username);
    const uri = oauth.generateAuthUrl({
        clientId: clientid,
        clientSecret: secret,
        scope: ["identify", "guilds.join"],
        redirectUri: `${url}/auth/callback`
    });
    const embed = new EmbedBuilder().setTitle(`💨 — Painel de info`)
        .setColor("Blue")
        .setDescription(`Olá, senhor(a) ${interaction.user}, esta são as suas informações!`)
        .addFields(
            {
                name: "🔗 URL do Backup:",
                value: `\`\`\`${url}/auth/callback\`\`\``
            },
            {
                name: "💨 Link Webhook:",
                value: `\`\`\`${webhook_logs}\`\`\``
            },
            {
                name: "🎲 Link Oauth2:",
                value: `\`\`\`${uri}\`\`\``
            },
        );


        const row2 = new ActionRowBuilder()
        .addComponents(
            
            new ButtonBuilder()
                .setCustomId("voltarconfigauth")
                .setLabel('Voltar')
                .setEmoji(`1178068047202893869`)
                .setStyle(2)

        )  
    
        
    
        
    await interaction.update({ content: ``, embeds: [embed], ephemeral: true, components: [row2] })
}


module.exports = {
    infosauth
}
