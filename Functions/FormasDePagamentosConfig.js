const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao } = require("../DataBaseJson");
const { res } = require("../res");
const emojis = require("../DataBaseJson/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

function getEmojiObject(emojiStr) {
    if (!emojiStr || emojiStr === "") return { name: "💳" };
    if (/^\d+$/.test(emojiStr)) return { id: emojiStr };
    const match = emojiStr.match(/<a?:\w+:(\d+)>/);
    if (match) return { id: match[1] };
    return { name: emojiStr };
}

async function FormasDePagamentos(interaction) {

    const rowPagamentos1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarmercadopago")
            .setLabel('Configurar Mercado Pago')
            .setEmoji(getEmojiObject(Emojis.get('_mp_emoji')))
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("config_pagamentos_efibank")
            .setLabel('Configurar Efi Bank')
            .setEmoji('1306786969652564091')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("config_pagamentos_inter")
            .setLabel('Configurar Nubank')
            .setEmoji('1474261774726463620')
            .setStyle(2)
    );

    const rowPagamentos2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarmistic")
            .setLabel('Configurar Mistic Pay')
            .setEmoji(getEmojiObject(Emojis.get('mistic')))
            .setStyle(2),
         new ButtonBuilder()
            .setCustomId("configurarilusionpay")
            .setLabel('Configurar Ilusion Pay')
            .setEmoji('1474272247790178377')
            .setDisabled(true)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("ConfigurarPagamentoManual")
            .setLabel('Configurar Pix (Semi Auto)')
            .setEmoji('1193427093158105129')
            .setStyle(2)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltaradawdwa")
            .setLabel('Voltar')
            .setEmoji(`1178068047202893869`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `**Configurar Formas de Pagamentos**` },
        { type: 14 },
        { type: 10, content: `## Central de Pagamentos\n\n> Configure e gerencie todas as formas de pagamento do seu servidor.\n> Integre diferentes gateways e ofereça mais opções aos seus clientes.` },
        { type: 14 }
    ).with({
        components: [rowPagamentos1, rowPagamentos2, rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

module.exports = {
    FormasDePagamentos
}
