const { EmbedBuilder, ApplicationCommandType, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, InteractionType } = require("discord.js");
const fs = require("fs");
const path = require("path");
const client = require("discord.js")
const Discord = require("discord.js")
const { Emojis } = require("../DataBaseJson");

async function configauth(interaction, client) {


    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("cargoauth")
                .setLabel('Definir Cargo de Verificado')
                .setStyle(2),
            new ButtonBuilder()
             .setCustomId("infosauth")
             .setLabel('Minhas Informações')
             .setStyle(2),
            new ButtonBuilder()
             .setCustomId("infoauth")
             .setLabel('Definir Configuraçoes Obrigatorias')
             .setStyle(2),


        )

    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltarauth")
                .setLabel('Voltar')
                .setStyle(2)
        )

client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "cargoauth") {
        await interaction.deferReply({ ephemeral: true });

        const roles = interaction.guild.roles.cache
            .filter(role => role.id !== interaction.guild.id && !role.managed)
            .sort((a, b) => b.position - a.position)
            .first(25);

        const options = roles.map(role => ({
            label: role.name.length > 100 ? role.name.slice(0, 97) + "..." : role.name,
            value: role.id,
            description: `Cargo ID: ${role.id}`,
            emoji: { id: "1295594879266852895" }
        }));

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_role')
                .setPlaceholder('🔐 Selecione o cargo de verificado')
                .addOptions(options)
        );

        await interaction.followUp({
            content: `${Emojis.get(`info`)} Selecione o Cargo de **Verificado** Clicando no Select Menu Abaixo`,
            components: [row]
        });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'select_role') {
        const selectedRoleID = interaction.values[0];
        const configPath = path.join(__dirname, '..', 'DataBaseJson', 'configauth.json');

        try {
            const config = require(configPath);
            config.role = selectedRoleID;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

            await interaction.update({
                content: `${Emojis.get(`checker`)} Cargo Definido com Sucesso! Lembre-se que o cargo do bot precisa esta acima do cargo escolhido!`,
                components: [],
            });
        } catch (error) {
            console.error("Erro ao atualizar o cargo:", error);
            await interaction.update({
                content: `${Emojis.get(`negative`)} Ocorreu um Erro.`,
                components: [],
            });
        }
    }
});


    if (interaction.message == undefined) {
        interaction.reply({ embeds: [], components: [row1, row3], content: `Oque deseja configurar?` })
    } else {
        interaction.update({ embeds: [], components: [row1, row3], content: `Oque deseja configurar?` })
    }

}


module.exports = {
    configauth
}
