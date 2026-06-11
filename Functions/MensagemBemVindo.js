const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");
const { res } = require("../res");

function msgbemvindo(interaction, client) {
    const mensagem = configuracao.get("Entradas.msg");
    const tempo = configuracao.get("Entradas.tempo");
    const canais = configuracao.get("Entradas.channelid");

    let canaisFormatados = "*Nenhum canal definido*";
    if (Array.isArray(canais) && canais.length > 0) {
        canaisFormatados = canais
            .map(id => {
                const canal = interaction.guild.channels.cache.get(id);
                return canal ? `<#${canal.id}>` : `\`${id}\``;
            })
            .join(", ");
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar1")
            .setLabel("Voltar")
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Boas Vindas` },
        { type: 14 },
        { type: 10, content: `**Sistema de Boas-Vindas**\n\n> Configure mensagens automáticas para novos membros do servidor.` },
        { type: 14 },
        { type: 10, content: `**Configurações Atuais:**\n> **Mensagem:** ${mensagem ? `\`${mensagem.substring(0, 50)}${mensagem.length > 50 ? '...' : ''}\`` : "*Não definida*"}\n> **Tempo para apagar:** ${tempo && tempo !== 0 ? `\`${tempo} segundos\`` : "*Não será apagada*"}\n> **Canais:** ${canaisFormatados}` },
        { type: 14 },
        { type: 10, content: `**Variáveis Disponíveis:**\n> \`{member}\` - Menciona o usuário\n> \`{guildname}\` - Nome do servidor` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: "Editar Mensagem",
                    emoji: { id: "1376272243679563923" },
                    custom_id: "editarmensagemboasvindas"
                }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    interaction.update(containerContent);
}

module.exports = {
    msgbemvindo,
};
