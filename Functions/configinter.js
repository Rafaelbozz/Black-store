const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");
const { res } = require("../res");

async function imapConfigs(interaction) {
    const user = configuracao.get(`pagamentos.imap.user`) || "Não configurado";
    const status = configuracao.get(`pagamentos.imap.status`) ?? false;
    const chavePix = configuracao.get(`pagamentos.imap.chavepiximap`) || "Não configurada";

    const rowActions = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("setImapCreds")
            .setLabel('Editar Credenciais')
            .setEmoji(Emojis.get('_lapis_emoji') ? Emojis.get('_lapis_emoji').match(/\d+/)?.[0] : '✏️')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("toggleImapStatus")
            .setLabel(status ? "Desativar IMAP" : "Ativar IMAP")
            .setEmoji(Emojis.get('_change_emoji') ? Emojis.get('_change_emoji').match(/\d+/)?.[0] : '🔄')
            .setStyle(status ? 4 : 3)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("formasdepagamentos")
            .setLabel('Voltar')
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setStyle(ButtonStyle.Secondary)
    );

    const containerContent = res.main(
        { type: 10, content: `**${Emojis.get('banco')} Monitoramento via IMAP (E-mail) - Nubank**` },
        { type: 14 },
        { type: 10, content: `Configure o bot para ler notificações de Pix do seu e-mail do Nubank.\n\n**Como funciona:** O bot fica lendo sua caixa de entrada e aprova a venda assim que o e-mail do Nubank chegar.` },
        { type: 14 },
        { type: 10, content: `> ${Emojis.get('email')} **E-mail:** \`${user}\`\n> ${Emojis.get('banco')} **Banco:** \`💜 Nubank\`\n> ${Emojis.get('_fixe_emoji')} **Status:** \`${status ? "Sistema Ativo!" : "Sistema Desativado"}\`\n> ${Emojis.get('pix')} **Chave Pix:** \`${chavePix}\`` },
        { type: 14 },
        { type: 10, content: `-# Use 'Senhas de App' se usar Gmail ou Outlook!` }
    ).with({
        components: [rowActions, rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

module.exports = { imapConfigs };
