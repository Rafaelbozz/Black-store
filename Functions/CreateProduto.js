const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { produtos, configuracao } = require("../DataBaseJson");
const { res } = require("../res");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

async function GerenciarProduto(interaction, status, produtoname) {
    const ggg = produtos.get(produtoname);

    const totalCampos = ggg.Campos.length;
    const totalCupons = ggg.Cupom.length;
    
    let estoqueTotal = 0;
    ggg.Campos.forEach(campo => {
        estoqueTotal += campo.estoque.length;
    });

    const dataCriacao = ggg.Config.dataCriacao || Date.now();
    const dataFormatada = `<t:${Math.floor(dataCriacao / 1000)}:R>`;

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar3")
            .setLabel("Voltar")
            .setEmoji(`1178068047202893869`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Loja > Produtos > ${ggg.Config.name}` },
        { type: 14 },
        { type: 10, content: `**Informações do produto**\n> **Nome:** \`${ggg.Config.name}\`\n> **Tipo de entrega:** \`${ggg.Config.entrega === 'Sim' ? 'Automática' : 'Manual'}\`\n> **Banner:** \`${ggg.Config.banner || 'Não configurado'}\`` },
        { type: 14 },
        { type: 10, content: `**Descrição**` },
        { type: 10, content: `\`\`\`${ggg.Config.desc || 'Sem descrição'}\`\`\`` },
        { type: 14 },
        { type: 10, content: `**Gerenciamento**\n> Criado em: ${dataFormatada}\n> **Campos:** \`${totalCampos}\` | **Estoque:** \`${estoqueTotal}\`\n> **Cupons:** \`${totalCupons}\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 2,
                    label: "Editar",
                    custom_id: "editproduto",
                    emoji: { id: "1178079212700188692" }
                },
                {
                    type: 2,
                    style: 2,
                    label: "Gerenciar Campos",
                    custom_id: "gencampos",
                    emoji: { id: "1178156643121365063" }
                },
                {
                    type: 2,
                    style: 2,
                    label: "Gerenciar Cupons",
                    custom_id: "gencupons",
                    emoji: { id: "1178156847857930282" }
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: "Publicar mensagem",
                    custom_id: "colocarvenda",
                    emoji: { id: "1178157032688336916" }
                },
                {
                    type: 2,
                    style: 2,
                    label: "Ver Preview",
                    custom_id: "verpreviewproduto",
                    emoji: { id: "1459058080766759070" }
                },
                {
                    type: 2,
                    style: 2,
                    label: "Sincronizar",
                    custom_id: "syncproduto",
                    emoji: { id: "1178077123882262628" }
                },
                {
                    type: 2,
                    style: 4,
                    label: "Apagar",
                    custom_id: "excluirproduto",
                    emoji: { id: "1178076767567757312" }
                }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (status == 1) {
        await interaction.editReply(containerContent);
        await db.set(interaction.message.id, { name: produtoname });
    } else if (status == 2) {
        await interaction.update(containerContent);
        await db.set(interaction.message.id, { name: produtoname });
    } else if (status == 3) {
        await interaction.reply({ ...containerContent, fetchReply: true, ephemeral: true });
        const message = await interaction.fetchReply();
        await db.set(message.id, { name: produtoname });
    } else if (status == 4) {
        await interaction.editReply(containerContent);
        await db.set(interaction.message.id, { name: produtoname });
    }
}

module.exports = {
    GerenciarProduto,
};
