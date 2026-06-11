const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require("discord.js");
const { res } = require("../res");

async function Gerenciar(interaction, client) {

    const rowVoltar = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltar1")
                .setLabel('Voltar')
                .setEmoji(`1178068047202893869`)
                .setStyle(2)
        )

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Configurações` },
        { type: 14 },
        { type: 10, content: `**O que precisa configurar?**` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "gerenciar_configs_menu",
                placeholder: "Selecione uma configuração",
                options: [
                    {
                        label: "Configurar Cargos",
                        description: "Configurar cargos do servidor",
                        value: "configcargos",
                        emoji: { id: "1178086257784533092" }
                    },
                    {
                        label: "Configurar Canais",
                        description: "Configurar canais do servidor",
                        value: "personalizarcanais",
                        emoji: { id: "1464426965917372466" }
                    },
                    {
                        label: "Anti-Fake",
                        description: "Configurar sistema anti-fake",
                        value: "personalizarantifake",
                        emoji: { id: "1464427480990486721" }
                    },
                    {
                        label: "Formas de Pagamento",
                        description: "Configurar métodos de pagamento",
                        value: "formasdepagamentos",
                        emoji: { id: "1464426911236358216" }
                    },
                    {
                        label: "Extensões",
                        description: "Gerenciar extensões e módulos adicionais",
                        value: "painelextensoes",
                        emoji: { id: "1384035196856303626" }
                    }
                ]
            }]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (interaction.message == undefined) {
        interaction.reply(containerContent)
    } else {
        interaction.update(containerContent)
    }
}

module.exports = {
    Gerenciar
}
