const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { Systemrobux, Emojis } = require("../DataBaseJson");
const { res } = require("../res");

async function IlusionBux(interaction) {
    const robuxStatus = Systemrobux.get('status') || false;
    
    const precoComTaxa = Systemrobux.get('preco_com_taxa') || 'Não configurado';
    const precoSemTaxa = Systemrobux.get('preco_sem_taxa') || 'Não configurado';
    const canalLogs = Systemrobux.get('canal_logs');
    
    const canalLogsTexto = canalLogs ? `<#${canalLogs}>` : '``Não configurado``';
    
    const precoTexto = precoComTaxa !== 'Não configurado' && precoSemTaxa !== 'Não configurado' 
        ? `Com Taxa: \`R$ ${precoComTaxa}\` | Sem Taxa: \`R$ ${precoSemTaxa}\``
        : '``Não configurado``';
    
    const podeAtivar = precoComTaxa !== 'Não configurado' && precoSemTaxa !== 'Não configurado' && canalLogs;
    
    let avisoConfig = '';
    if (!podeAtivar && !robuxStatus) {
        avisoConfig = '\n\n⚠️ **Atenção:** Configure todos os campos antes de ativar o sistema';
    }
    
    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltarextensoes")
            .setLabel('Voltar')
            .setEmoji(Emojis.get('_back_emoji'))
            .setStyle(2)
    );

    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("robux_toggle_status")
            .setLabel(robuxStatus ? "Desativar Sistema" : "Ativar Sistema")
            .setStyle(robuxStatus ? 4 : 3)
            .setEmoji(robuxStatus ? Emojis.get('desligado') : Emojis.get('ligado')),
        new ButtonBuilder()
            .setCustomId("robux_config_mensagem")
            .setLabel("Configurar Mensagem")
            .setStyle(2)
            .setEmoji(Emojis.get('_lapis_emoji')),
        new ButtonBuilder()
            .setCustomId("robux_alterar_precos")
            .setLabel("Alterar Preços")
            .setStyle(2)
            .setEmoji(Emojis.get('_money_emoji')),
        new ButtonBuilder()
            .setCustomId("robux_config_canais")
            .setLabel("Configurar Canal de Logs")
            .setStyle(2)
            .setEmoji(Emojis.get('logss'))
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Extensões > Ilusion Bux` },
        { type: 14 },
        { type: 10, content: `##  Sistema Ilusion Bux\n\n> Gerencie vendas de Robux de forma automatizada e segura.\n> Configure preços, canais e mensagens personalizadas para seu servidor.${avisoConfig}` },
        { type: 14 },
        { type: 10, content: `**Informações Detalhadas**\n- Sistema: ${robuxStatus ? '``🟢 Ativado``' : '``🔴 Desativado``'}\n- Preço por 1000 Robux: ${precoTexto}\n- Canal de Logs: ${canalLogsTexto}` },
        { type: 14 },
        { type: 10, content: `**Funcionalidades:**\n- Sistema de vendas automatizado de Robux\n- Configuração de preços com e sem taxa\n- Logs detalhados de todas as transações\n- Mensagens customizáveis para o canal de vendas` },
        { type: 14 }
    ).with({
        components: [rowBotoes, rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

module.exports = {
    IlusionBux
};
