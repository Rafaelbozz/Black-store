const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");
const { res } = require("../res");


async function ConfigChannels(interaction, client) {

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`selectChannelC`)
                .addOptions(
                    {
                        value: `logpedidos`,
                        label: `Definir canal de logs de pedidos`,
                        emoji: `1246953187529855037`
                    },
                    {
                        value: `eventbuy`,
                        label: `Definir canal de evento de compras`,
                        emoji: `1246953442283618334`
                    },
                    {
                        value: `systemlogs`,
                        label: `Definir canal de logs do sistema`,
                        emoji: `${Emojis.get(`_staff_emoji`)}`
                    },
                    {
                        value: `antiraidlogschannel`,
                        label: `Definir canal de logs do AntiRaid`,
                        emoji: `${Emojis.get(`_staff_emoji`)}`
                    },
                    {
                        value: `logentrada`,
                        label: `Definir canal de logs de entradas`,
                        emoji: `1246955020050759740`
                    },
                    {
                        value: `logsaida`,
                        label: `Definir canal de logs de saídas`,
                        emoji: `1246955006242983936`
                    },
                    {
                        value: `logmensagem`,
                        label: `Definir canal de logs de mensagens`,
                        emoji: `1246953149009367173`
                    },
                    {
                        value: `trafegocall`,
                        label: `Definir canal de logs de tráfego de call`,
                        emoji: `1246954972155875328`
                    },
                    {
                        value: `feedback`,
                        label: `Definir canal de logs de feedback`,
                        emoji: `1246955036433453259`
                    },
                    {
                        value: `auditoria`,
                        label: `Definir canal de auditoria`,
                        emoji: `${Emojis.get(`_staff_emoji`)}`
                    },
                    {
                        value: `logsban`,
                        label: `Definir canal de logs de ban`,
                        emoji: `1246953187529855037`
                    },
                    {
                        value: `logscomandos`,
                        label: `Definir canal de logs de comandos`,
                        emoji: `1246953149009367173`
                    }
                )
                .setPlaceholder(`Clique aqui para redefinir algum canal`)
                .setMaxValues(1)
        )

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar2")
            .setLabel('Voltar')
            .setEmoji(`1238413255886639104`)
            .setStyle(2),
         new ButtonBuilder()
            .setCustomId("criarcanaisfds")
            .setLabel('Criar Canais Automaticamente')
            .setEmoji(`${Emojis.get(`_text_emoji`)}`)
            .setStyle(2),
    )

    const containerContent = res.main(
        { type: 10, content: `**Configurar Canais**` },
        { type: 14 },
        { type: 10, content: `> **Canal de log de pedidos:** ${configuracao.get(`ConfigChannels.logpedidos`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.logpedidos`)}>`}\n> **Canal de evento de compras:** ${configuracao.get(`ConfigChannels.eventbuy`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.eventbuy`)}>`}\n> **Canal de logs do sistema:** ${configuracao.get(`ConfigChannels.systemlogs`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.systemlogs`)}>`}\n> **Canal de logs do AntiRaid:** ${configuracao.get(`ConfigChannels.antiraid`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.antiraid`)}>`}\n> **Canal de logs de entradas:** ${configuracao.get(`ConfigChannels.entradas`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.entradas`)}>`}` },
        { type: 14 },
        { type: 10, content: `> **Canal de logs de saídas:** ${configuracao.get(`ConfigChannels.saídas`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.saídas`)}>`}\n> **Canal de logs de mensagens:** ${configuracao.get(`ConfigChannels.mensagens`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.mensagens`)}>`}\n> **Canal de logs de tráfego em call:** ${configuracao.get(`ConfigChannels.tráfego`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.tráfego`)}>`}\n> **Canal de feedback:** ${configuracao.get(`ConfigChannels.feedback`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.feedback`)}>`}` },
        { type: 14 },
        { type: 10, content: `> **Canal de auditoria:** ${configuracao.get(`ConfigChannels.auditoria`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.auditoria`)}>`}\n> **Canal de logs de ban:** ${configuracao.get(`ConfigChannels.logsban`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.logsban`)}>`}\n> **Canal de logs de comandos:** ${configuracao.get(`ConfigChannels.logscomandos`) == null ? `Não definido` : `<#${configuracao.get(`ConfigChannels.logscomandos`)}>`}` }
    ).with({
        components: [row1, row2],
        flags: [64]
    });

    interaction.update(containerContent)
}


async function ConfigRoles(interaction, client) {

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`selectCargoC`)
                .addOptions(
                    {
                        value: `definircargoadm`,
                        label: `Definir cargo de Administrador`,
                        emoji: `1246954960218886146`
                    },
                    {
                        value: `definircargosup`,
                        label: `Definir cargo de Suporte`,
                        emoji: `1246955036433453259`
                    },
                    {
                        value: `roleclienteease`,
                        label: `Definir cargo de Cliente`,
                        emoji: `1256806658101870684`
                    },
                    {
                        value: `rolememberok`,
                        label: `Definir cargo de Membro`,
                        emoji: `1246955106944028774`
                    }
                )
                .setPlaceholder(`Clique aqui para redefinir algum cargo`)
                .setMaxValues(1)
        )

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar2")
            .setLabel('Voltar')
            .setEmoji(`1238413255886639104`)
            .setStyle(2),
    )

    const containerContent = res.main(
        { type: 10, content: `**Configurar Cargos**` },
        { type: 14 },
        { type: 10, content: `> **Cargo de Administrador:** ${configuracao.get(`ConfigRoles.cargoadm`) == null ? `Não definido` : `<@&${configuracao.get(`ConfigRoles.cargoadm`)}>`}\n> **Cargo de Suporte:** ${configuracao.get(`ConfigRoles.cargosup`) == null ? `Não definido` : `<@&${configuracao.get(`ConfigRoles.cargosup`)}>`}\n> **Cargo de Cliente:** ${configuracao.get(`ConfigRoles.cargoCliente`) == null ? `Não definido` : `<@&${configuracao.get(`ConfigRoles.cargoCliente`)}>`}\n> **Cargo de Membro:** ${configuracao.get(`ConfigRoles.cargomembro`) == null ? `Não definido` : `<@&${configuracao.get(`ConfigRoles.cargomembro`)}>`}` }
    ).with({
        components: [row1, row2],
        flags: [64]
    });

    interaction.update(containerContent)
}

module.exports = {
    ConfigRoles,
    ConfigChannels
}
