const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { configuracao } = require("../DataBaseJson");
const { res } = require("../res");

async function moedaConfig(interaction, client) {

    const selectMenu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`selectMoedaC`)
                .addOptions(
                    {
                        value: `realBRL`,
                        label: `Real Brasileiro`
                    },
                    {
                        value: `dolarUSD`,
                        label: `Dólar Americano (🚫)`
                    }
                )
                .setPlaceholder(`Clique aqui para selecionar a moeda`)
                .setMaxValues(1)
        )

    const containerContent = res.main(
        { type: 10, content: `Selecione a moeda que deseja utilizar no sistema:` }
    ).with({
        components: [selectMenu],
        flags: [64]
    });

    interaction.editReply(containerContent)
}

module.exports = {
    moedaConfig
}
