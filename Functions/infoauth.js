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

async function infoauth(interaction, client) {

    const all = await users.all().filter(a => a.data.username);
    const uri = oauth.generateAuthUrl({
        clientId: clientid,
        clientSecret: secret,
        scope: ["identify", "guilds.join"],
        redirectUri: `${url}/auth/callback`
    });


    const embed = new EmbedBuilder().setTitle(` — Importantes eCloud`)
    .setColor("Blue")
    .setDescription(`Configure as partes mais importantes do eCloud!\nCaso voce for mudar o dominio por favor nao coloque https no formulario apenas coloque o nome que nos faremos o resto, apos voce colocar o nome vc precisa reiniciar seu bot`)
    .addFields(
        {
            name: "Client ID:",
            value: `\`${clientid}\``,
            inline: true
        },
        {
            name: "Secret:",
            value: `||${secret}||`,
            inline: true
        },
        {
            name: "ID Servidor",
            value: `\`${guild_id}\``,
            inline: true
        },
        {
            name: "Url Subdominio",
            value: `\`${url}\``,
            inline: true
        },

    );



  const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("clientid")
                .setLabel('Editar Client Id')
                .setEmoji(`1240459731584290929`)
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId("subdominio")
                .setLabel('Alterar Subdominio')
                .setEmoji(`1240459731584290929`)
                .setStyle(1),
  

            new ButtonBuilder()
                .setCustomId("secret")
                .setLabel('Editar Secret')
                .setEmoji(`1237422648598724638`)
                .setDisabled(false)
                .setStyle(1)
        )
    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltarconfigauth")
                .setLabel('Voltar')
                .setEmoji(`1178068047202893869`)
                .setStyle(2)

        )

    const row4 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("svid")
                .setLabel('Editar Id Servidor')
                .setEmoji(`1240450763595976715`)
                .setStyle(1)

        )

client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "svid") {
        await interaction.deferReply({ ephemeral: true });

        const fs = require('fs');
        const path = require('path');
        const configPath = path.join(__dirname, '..', 'DataBaseJson', 'configauth.json');

        try {
            const guildId = interaction.guildId;

            const config = require(configPath);
            config.guild_id = guildId;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

            await interaction.editReply(`**✅ ID do servidor atualizado com sucesso!**\n\`${guildId}\`\n🔔 *Talvez não apareça na embed do eCloud, tente reiniciar o bot.*`);
        } catch (error) {
            console.error("Erro ao atualizar o ID do servidor:", error);
            await interaction.editReply("**❌ Ocorreu um erro ao atualizar o ID do servidor.**");
        }
    }
});


        client.on("interactionCreate", async interaction => {
            if (!interaction.isButton()) return;
            
            if (interaction.customId === "clientid") {
                await interaction.deferReply({ ephemeral: true });
        
                await interaction.followUp("**🔄 Envie o id do BOT.**");
        
                const filter = m => m.author.id === interaction.user.id;
                const response = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
        
                if (response.size === 0) {
                    await interaction.editReply("**🔔 Tempo esgotado. Por favor, tente novamente.**");
                    return;
                }
        
                const newID = response.first().content;
        
                const fs = require('fs');
                const path = require('path');
                const configPath = path.join(__dirname, '..', 'DataBaseJson', 'configauth.json');
                
                try {
                    const config = require(configPath);
                    config.clientid = newID;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
                
                    await interaction.editReply("** ID atualizado com sucesso.**\n\`Talvez, ela não apareça na embed do seu eCloud, tente reiniciar seu bot.\`\n🔔 **Lembre-se este é o id do BOT!**");
                } catch (error) {
                    console.error("Erro ao atualizar o arquivo de id do bot:", error);
                    await interaction.editReply("** Ocorreu um erro ao atualizar o ID.**");
                }
            }
        });
        client.on("interactionCreate", async interaction => {
            if (!interaction.isButton()) return;
            
            if (interaction.customId === "secret") {
                await interaction.deferReply({ ephemeral: true });
        
                await interaction.followUp("**🔄 Envie o SECRET do BOT.**");
        
                const filter = m => m.author.id === interaction.user.id;
                const response = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
        
                if (response.size === 0) {
                    await interaction.editReply("**🔔 Tempo esgotado. Por favor, tente novamente.**");
                    return;
                }
        
                const newSecret = response.first().content;
        
                const fs = require('fs');
                const path = require('path');
                const configPath = path.join(__dirname, '..', 'DataBaseJson', 'configauth.json');
                
                try {
                    const config = require(configPath);
                    config.secret = newSecret;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
                
                    await interaction.editReply("** SECRET atualizado com sucesso.**\n\`Talvez, ele não apareça na embed do seu eCloud, tente reiniciar seu bot.\`");
                } catch (error) {
                    console.error("Erro ao atualizar o secret:", error);
                    await interaction.editReply("** Ocorreu um erro ao atualizar o SECRET.**");
                }
            }
        });
        client.on("interactionCreate", async interaction => {
            if (!interaction.isButton()) return;
            
            if (interaction.customId === "idsv") {
                await interaction.deferReply({ ephemeral: true });
        
                await interaction.followUp("**🔄 Envie o ID do SERVIDOR.**");
        
                const filter = m => m.author.id === interaction.user.id;
                const response = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
        
                if (response.size === 0) {
                    await interaction.editReply("**🔔 Tempo esgotado. Por favor, tente novamente.**");
                    return;
                }
        
                const newSV = response.first().content;
        
                const fs = require('fs');
                const path = require('path');
                const configPath = path.join(__dirname, '..', 'DataBaseJson', 'configauth.json');
                
                try {
                    const config = require(configPath);
                    config.guild_id = newSV;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
                
                    await interaction.editReply("** SERVIDOR atualizado com sucesso.**\n\`Talvez, ele não apareça na embed do seu eCloud, tente reiniciar seu bot.\`");
                } catch (error) {
                    console.error("Erro ao atualizar o id guild:", error);
                    await interaction.editReply("** Ocorreu um erro ao atualizar o SERVIDOR.**");
                }
            } 
        });  


client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "subdominio") {

        const modal = new ModalBuilder()
            .setCustomId('subdominio_modal')
            .setTitle('Setar Dominio');

        const subdominioInput = new TextInputBuilder()
            .setCustomId('subdominio_input')
            .setLabel('Digite o nome do subdomínio')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Coloque Apenas o nome, sem https://')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(subdominioInput)
        );

        await interaction.showModal(modal);
    }
});



client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'subdominio_modal') {
        const subdominio = interaction.fields.getTextInputValue('subdominio_input');

        const fs = require('fs');
        const path = require('path');
        const configPath = path.join(__dirname, '..', 'DataBaseJson', 'configauth.json');
        const squarePath = path.join(__dirname, '..', 'squarecloud.app');

        try {
            const url = `https://${subdominio}.camposcloud.app`;

            const config = require(configPath);
            config.url = url;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

            let squareContent = fs.readFileSync(squarePath, 'utf8');

            squareContent = squareContent.replace(
                /^SUBDOMAIN=.*$/m,
                `SUBDOMAIN=${subdominio}`
            );

            fs.writeFileSync(squarePath, squareContent);

            await interaction.reply({
                content: `**✅ Subdomínio atualizado com sucesso!**\nURL configurada: ${url}\nArquivo \`squarecloud.app\` também foi atualizado!`,
                ephemeral: true
            });

        } catch (error) {
            console.error("Erro ao atualizar o subdomínio:", error);
            await interaction.reply({
                content: "**❌ Ocorreu um erro ao atualizar o subdomínio ou o arquivo squarecloud.app.**",
                ephemeral: true
            });
        }
    }
});


    await interaction.update({ content: ``, embeds: [embed], ephemeral: true, components: [row2, row4, row3] })

}

module.exports = {
    infoauth
}