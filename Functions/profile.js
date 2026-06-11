const { EmbedBuilder } = require("discord.js")
const { EstatisticasStorm } = require("../index.js")
const { configuracao } = require("../DataBaseJson/index.js")

async function profileuser(interaction, userID = null) {

    if (!userID) userID = interaction.user.id

    const PrimeiraCompra = await EstatisticasStorm.FirstOrder(userID)
    const UltimaCompra = await EstatisticasStorm.LastOrder(userID)
    const rendimento = await EstatisticasStorm.Ranking(10, 'valorTotal', userID)

    if (PrimeiraCompra == null) return interaction.reply({ content: `❗ Sem dados salvos`, ephemeral: true })


    const embed = new EmbedBuilder()
        .setColor(`${configuracao.get(`Cores.Principal`) == null ? '635b44': configuracao.get('Cores.Principal')}`)
        .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}` })
        .setTitle(`Perfil`)
        .addFields(
            { name: `**Valor total gasto**`, value: `\`R$ ${Number(rendimento.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true },
            { name: `**Pedidos aprovados**`, value: `\`${rendimento.qtdCompraTotal}\``, inline: true },
            { name: `**Posição no rank**`, value: `\`${rendimento.posicao}\``, inline: true },
            { name: `**Primeira compra**`, value: `<t:${Math.ceil(PrimeiraCompra.data.data / 1000)}:R>`, inline: true },
            { name: `**Última compra**`, value: `<t:${Math.ceil(UltimaCompra.data.data / 1000)}:R>`, inline: true },
        )
        .setAuthor({ name: `${interaction.user.username}` })
        .setTimestamp()
        .setFooter({ text: `${interaction.user.username}` })

    interaction.reply({ embeds: [embed], ephemeral: true })

}

module.exports = {
    profileuser
}