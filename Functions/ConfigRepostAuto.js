const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { produtos, configuracao, Emojis } = require("../DataBaseJson");
const { res } = require("../res");
const moment = require('moment-timezone');

async function AcoesRepostAutomatics(interaction, client) {
    const repostagemHora = configuracao.get(`Repostagem.Hora`) || "00:01";
    const currentStatus = configuracao.get(`Repostagem.Status`);

    const currentTime = moment.tz("America/Sao_Paulo");
    
    const [hours, minutes] = repostagemHora.split(':').map(Number);
    let nextExecutionTime = moment.tz("America/Sao_Paulo").set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    
    if (nextExecutionTime.isBefore(currentTime)) {
        nextExecutionTime.add(1, 'day');
    }
    
    const nextExecutionTimestamp = Math.floor(nextExecutionTime.valueOf() / 1000);
    const todosProdutos = await produtos.all();

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('voltarautomaticos')
            .setLabel('Voltar')
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setStyle(ButtonStyle.Secondary)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Ações Automáticas > Repostagem Automática` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get('repost_emoji')} Repostagem Automática de Produtos` },
        { type: 10, content: `> Seu ${client.user.username} vai repostar seus produtos periodicamente, apagando a mensagem antiga e enviando-a novamente, para evitar denúncias nas mensagens.\n\n> **Observação:** O sistema ajustará automaticamente o intervalo e a frequência dos reposts, considerando o fluxo de interações e a quantidade de produtos postados.` },
        { type: 14 },
        { type: 10, content: `**Configurações Atuais:**\n> **Produtos em repostagem:** \`${todosProdutos.length}\`\n> **Status:** ${currentStatus ? `${Emojis.get('ligado')} \`Ativado\`` : `${Emojis.get('desligado')} \`Desativado\``}\n> **Horário configurado:** \`${repostagemHora}\`\n> **Próxima execução:** ${currentStatus ? `\`${nextExecutionTime.format('DD/MM/YYYY HH:mm:ss')}\`` : '\`Desativado\`'}\n> **Tempo restante:** ${currentStatus ? `<t:${nextExecutionTimestamp}:R>` : '\`Desativado\`'}` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: currentStatus ? 4 : 3,
                    label: currentStatus ? "Desabilitar função" : "Habilitar função",
                    emoji: { id: Emojis.get('_settings_emoji')?.match(/:(\d+)>/)?.[1] || "1259569896472182784" },
                    custom_id: currentStatus ? "desabilityRepost" : "enableRepost"
                },
                {
                    type: 2,
                    style: 2,
                    label: "Definir horário",
                    emoji: { id: Emojis.get('relogio')?.match(/:(\d+)>/)?.[1] || "1241819612044197949" },
                    custom_id: "setTimeRepost",
                    disabled: !currentStatus
                }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else if (interaction.isStringSelectMenu()) {
        await interaction.update(containerContent);
    } else {
        await interaction.reply(containerContent);
    }
}

module.exports = {
    AcoesRepostAutomatics
}
