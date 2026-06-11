const { ActionRowBuilder, ButtonBuilder } = require("discord.js")
const { configuracao } = require("../DataBaseJson")
const { EstatisticasStorm } = require("../index.js")
const { res } = require("../res")

function Posicao1(interaction, client) {

    const aa = configuracao.get(`posicoes`)

    const pos1 = aa?.pos1
    const pos2 = aa?.pos2
    const pos3 = aa?.pos3

    const row4 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("Editarprimeiraposição")
                .setLabel('Editar primeira posição')
                .setEmoji(`1192563018547081369`)
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId("Editarsegundaposição")
                .setLabel('Editar segunda posição')
                .setEmoji(`1192563056522309672`)
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId("Editarterceiraposição")
                .setLabel('Editar terceira posição')
                .setEmoji(`1192563090726846464`)
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId("voltar3")
                .setLabel('Voltar')
                .setEmoji(`1178068047202893869`)
                .setStyle(2)
        );

    const containerContent = res.main(
        { type: 10, content: `As "posições" são cargos personalizáveis que você pode definir para que os clientes recebam quando gastam uma certa quantia no servidor.` },
        { type: 14 },
        { type: 10, content: `> **Primeira Colocação**\n> ${pos1 == undefined ? `Não configurado` : `Recebe o cargo <@&${pos1.role}> após gastar \`R$ ${Number(pos1.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`.`}` },
        { type: 14 },
        { type: 10, content: `> **Segunda Colocação**\n> ${pos2 == undefined ? `Não configurado` : `Recebe o cargo <@&${pos2.role}> após gastar \`R$ ${Number(pos2.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`.`}` },
        { type: 14 },
        { type: 10, content: `> **Terceira Colocação**\n> ${pos3 == undefined ? `Não configurado` : `Recebe o cargo <@&${pos3.role}> após gastar \`R$ ${Number(pos3.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`.`}` }
    ).with({
        components: [row4],
        flags: [64]
    });

    interaction.update(containerContent)
}


async function CheckPosition(client) {
    const aa = configuracao.get(`posicoes`)
    if (aa === null) return;
    const { pos1, pos2, pos3 } = aa ?? {};
    await Promise.all(client.guilds.cache.map(async (guild) => {
        await processPosition(pos1, guild);
        await processPosition(pos2, guild);
        await processPosition(pos3, guild);
    }));
    async function processPosition(pos, guild) {
        if (!pos) return;

        const role = guild.roles.cache.get(pos.role);
        const aa = await EstatisticasStorm.GastouMais(null, Number(pos.valor));
        try {
            const members = await guild.members.fetch({ user: aa.map(user => user.userid) });

            for (const user of aa) {
                const member = members.get(user.userid);
                if (member && !member.roles.cache.has(role.id)) {
                    await member.roles.add(role.id).catch(() => {});
                }
            }
        } catch (error) {}
    }
}

module.exports = { Posicao1, CheckPosition }
