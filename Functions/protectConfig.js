const { 
    ButtonBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} = require("discord.js");

const { configuracao } = require("../DataBaseJson");
const { Painel, Gerenciar2 } = require("../Functions/Painel");
const { sistemaAntiRaid } = require("../Functions/AcoesAutomatics");

async function protectConfig(interaction, client) {

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`selectProtectBot`)
                .setOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`Anti-Raid`)
                        .setValue(`sistemaAntiRaid`)
                        .setDescription(`Sistema Anti-Raid`)
                        .setEmoji(`1286081797297279091`)
                )
                .setPlaceholder(`Clique aqui para selecionar`)
                .setMaxValues(1)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltar1")
                .setLabel("Voltar")
                .setEmoji(`1178068047202893869`)
                .setStyle(2)
        );

    await interaction.editReply({
        content: `Configurações de proteção.`,
        embeds: [],
        components: [row1, row2]
    });

    const collector = interaction.channel.createMessageComponentCollector({
        componentType: 3,
        filter: i => i.user.id === interaction.user.id,
        time: 60000
    });

    collector.on("collect", async (i) => {
        if (i.customId === "selectProtectBot" && i.values[0] === "sistemaAntiRaid") {
            await i.update({ 
                content: `🔄 Carregando...`, 
                embeds: [], 
                components: [] 
            });

            setTimeout(() => {
                console.log(`[LOG] ${i.user.tag} (${i.user.id}) abriu o sistema Anti-Raid.`);
                sistemaAntiRaid(i, client);
            }, 2000);
        }
    });
}

module.exports = {
    protectConfig
};
