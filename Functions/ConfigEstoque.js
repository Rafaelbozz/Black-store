const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const { res } = require("../res");
const db = new QuickDB();
const emojis = require("../DataBaseJson/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

function getEmojiObject(emojiStr) {
    if (!emojiStr || emojiStr === "") return { name: "📦" };
    if (/^\d+$/.test(emojiStr)) return { id: emojiStr };
    const match = emojiStr.match(/<a?:\w+:(\d+)>/);
    if (match) return { id: match[1] };
    return { name: emojiStr };
}

function MessageStock(interaction, stat, prod, camp, update, reply) {

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("Voltar10")
            .setLabel('Voltar')
            .setEmoji(`1178068047202893869`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# ${prod} > ${camp} > Gerenciar Estoque` },
        { type: 14 },
        { type: 10, content: `**Selecione o método de adição de estoque**\n> Escolha como deseja adicionar itens ao estoque deste campo.` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 3,
                    label: "Adicionar",
                    custom_id: "addestoque1",
                    emoji: { id: "1178076508150059019" }
                },
                {
                    type: 2,
                    style: 1,
                    label: "Enviar arquivo",
                    custom_id: "estoquearquivo",
                    emoji: { id: "1178347788501794836" }
                },
                {
                    type: 2,
                    style: 2,
                    label: "Estoque fantasma",
                    custom_id: "estoquefantasma",
                    emoji: { id: "1178347870747906131" }
                }
            ]
        },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 2,
                    label: "Ver estoque",
                    custom_id: "estoquedsadas",
                    emoji: getEmojiObject(Emojis.get('lupa'))
                },
                {
                    type: 2,
                    style: 4,
                    label: "Limpar estoque",
                    custom_id: "cleanestoquecampos",
                    emoji: getEmojiObject(Emojis.get('_trash_emoji'))
                }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (stat == 1) {
        if (update !== true) {
            interaction.reply({ ...containerContent, fetchReply: true, ephemeral: true }).then(async msg => {
                const message = await interaction.fetchReply();
                db.set(message.id, { name: prod, camposelect: camp });
            });
        } else {
            if (reply !== true) {
                interaction.update(containerContent).then(async () => {
                    db.set(interaction.message.id, { name: prod, camposelect: camp });
                });
            } else {
                interaction.reply({ ...containerContent, fetchReply: true, ephemeral: true }).then(async msg => {
                    const message = await interaction.fetchReply();
                    db.set(message.id, { name: prod, camposelect: camp });
                });
            }
        }
    } else {
        interaction.update(containerContent);
    }
}

module.exports = {
    MessageStock
};
