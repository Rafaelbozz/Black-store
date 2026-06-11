const { ActionRowBuilder, ButtonBuilder } = require("discord.js")
const { produtos, configuracao, Emojis } = require("../DataBaseJson")
const { res } = require("../res");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const axios = require('axios');

function getEmojiObject(emojiStr) {
    if (!emojiStr || emojiStr === "") return { name: "🏷️" };
    if (/^\d+$/.test(emojiStr)) return { id: emojiStr };
    const match = emojiStr.match(/<a?:\w+:(\d+)>/);
    if (match) return { id: match[1] };
    return { name: emojiStr };
}

async function GerenciarCupom(interaction, produtoname, ggg222) {
    const isModal = interaction.isModalSubmit?.() || interaction.type === 5;
    
    if (isModal && !ggg222) {
        await interaction.deferUpdate();
    }

    const ggg = produtos.get(produtoname);

    db.set(interaction.message.id, { name: produtoname });

    let campos = '';
    if (ggg.Campos.length === 0) {
        campos = 'Nenhum campo adicionado';
    } else {
        for (let i = ggg.Campos.length - 1; i >= Math.max(0, ggg.Campos.length - 5); i--) {
            const campooo = ggg.Campos[i];
            campos += `\`${campooo.Nome}\` - Estoque: \`${campooo.estoque.length}\` - R$ \`${Number(campooo.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`\n`;
        }
        if (ggg.Campos.length > 5) {
            campos += `E mais ${ggg.Campos.length - 5}...`;
        }
    }

    let cupom = '';
    if (ggg.Cupom.length === 0) {
        cupom = 'Nenhum cupom cadastrado';
    } else {
        for (let i = ggg.Cupom.length - 1; i >= Math.max(0, ggg.Cupom.length - 3); i--) {
            const cupommmm = ggg.Cupom[i];
            cupom += `\`${cupommmm.Nome}\` - ${cupommmm.desconto}% - Usos: \`${cupommmm.usos}\`\n`;
        }
        if (ggg.Cupom.length > 3) {
            cupom += `E mais ${ggg.Cupom.length - 3}...`;
        }
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltargerenciarproduto")
            .setLabel('Voltar')
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# ${ggg.Config.name} > Gerenciar Cupons` },
        { type: 14 },
        { type: 10, content: `**Campos cadastrados**\n${campos}` },
        { type: 14 },
        { type: 10, content: `**Cupons**\n${cupom}` },
        { type: 14 },
        { type: 10, content: `**Entrega automática:** \`${ggg.Config.entrega}\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 3,
                    label: "Adicionar cupom",
                    custom_id: "addcupom",
                    emoji: getEmojiObject(Emojis.get('_add_emoji'))
                },
                {
                    type: 2,
                    style: 4,
                    label: "Remover cupom",
                    custom_id: "remcupom",
                    emoji: getEmojiObject(Emojis.get('_trash_emoji'))
                }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (ggg222 == undefined) {
        if (isModal) {
            await interaction.editReply(containerContent);
        } else {
            await interaction.update(containerContent);
        }
    } else {
        await axios.patch(`https://discord.com/api/webhooks/${ggg222.applicationid}/${ggg222.webhookID}/messages/${ggg222.msgid}`, {
            flags: 64,
            ...containerContent
        });
    }
}

module.exports = {
    GerenciarCupom
}
