const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require("discord.js");
const { EmojisHelper } = require("../DataBaseJson");
const { res } = require("../res");

const Emojis = EmojisHelper;

async function PainelIlusionCloud(interaction, client) {
    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar00")
            .setLabel('Voltar')
            .setEmoji(`1178068047202893869`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > NexusCloud` },
        { type: 14 },
        { type: 10, content: `## NexusCloud - Central de Serviços\n\n> Acesse todos os serviços e funcionalidades da NexusCloud.\n> Gerencie autenticação, backups e muito mais em um só lugar.` },
        { type: 14 },
        { type: 10, content: `**Serviços Disponíveis:**\n- **OAuth02:** Sistema de autenticação avançado\n- **Backup:** Sistema de backup automático do servidor` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "ilusioncloud_select_menu",
                placeholder: "Selecione um sistema",
                options: [
                    {
                        label: "Sistema OAuth02",
                        description: "Configurar sistema de autenticação OAuth02",
                        value: "oauth02",
                        emoji: { id: "1461201682317840476" }
                    },
                    {
                        label: "Sistema de Backup",
                        description: "Gerenciar backups do servidor",
                        value: "backup",
                        emoji: { id: "1472812384539115601" }
                    }
                ]
            }]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (interaction.message == undefined) {
        interaction.reply(containerContent);
    } else {
        interaction.update(containerContent);
    }
}

module.exports = {
    PainelIlusionCloud
};
