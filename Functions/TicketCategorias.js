const { ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { tickets } = require("../DataBaseJson")
const { res } = require("../res")
const emojis = require("../DataBaseJson/emojis.json")

const Emojis = { get: (name) => emojis[name] || "" };

async function PaginaCategorias(interaction, painelId) {
    const painel = tickets.get(`tickets.paineis.${painelId}`);
    const funcoes = painel?.funcoes || {};
    const funcoesArray = Object.keys(funcoes);

    let funcoesText = funcoesArray.length > 0
        ? funcoesArray.map(f => `> ${funcoes[f].emoji || ">"} **${funcoes[f].nome}** - ${funcoes[f].descricao?.substring(0, 30) || "Sem desc"}...`).join("\n")
        : "> *Nenhuma categoria criada*";

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ticket_gerenciar_${painelId}`).setLabel('Voltar').setEmoji(`1178068047202893869`).setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Ticket > ${painel.titulo} > Categorias` },
        { type: 14 },
        { type: 10, content: `## Categorias` },
        { type: 14 },
        { type: 10, content: `**Categorias (${funcoesArray.length}):**\n${funcoesText}` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 3, label: 'Adicionar', custom_id: `ticket_addfuncao_${painelId}`, emoji: { id: '1178067873894236311' } },
                { type: 2, style: 4, label: 'Remover', custom_id: `ticket_remfuncao_${painelId}`, emoji: { id: '1178076767567757312' }, disabled: funcoesArray.length === 0 }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    await interaction.update(containerContent);
}

async function ModalAddFuncaoTicket(interaction, painelId) {
    const modal = new ModalBuilder()
        .setCustomId(`modal_addfuncao_${painelId}`)
        .setTitle('Adicionar Funcao')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('funcao_nome').setLabel('Nome da Funcao')
                    .setPlaceholder('Ex: Suporte, Duvidas, Compras').setStyle(TextInputStyle.Short).setMaxLength(32).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('funcao_desc').setLabel('Descricao')
                    .setPlaceholder('Descricao que aparece ao abrir ticket').setStyle(TextInputStyle.Paragraph).setMaxLength(1024).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('funcao_emoji').setLabel('Emoji (opcional)')
                    .setPlaceholder('Ex: > ou <:emoji:123456>').setStyle(TextInputStyle.Short).setRequired(false)
            )
        );
    await interaction.showModal(modal);
}


async function HandleAddFuncaoTicket(interaction, painelId) {
    const nome = interaction.fields.getTextInputValue('funcao_nome');
    const desc = interaction.fields.getTextInputValue('funcao_desc');
    let emoji = interaction.fields.getTextInputValue('funcao_emoji') || ">";

    const emojiIdMatch = emoji.match(/:(\d+)>/);
    if (emojiIdMatch) {
        emoji = emojiIdMatch[1];
        console.log(`[Ticket] Salvando emoji ID: ${emoji}`);
    } else {
        console.log(`[Ticket] Salvando emoji: ${emoji}`);
    }

    const funcaoId = nome.replace(/\s+/g, '_').toLowerCase();
    
    tickets.set(`tickets.paineis.${painelId}.funcoes.${funcaoId}`, { nome, descricao: desc, emoji });

    await interaction.deferUpdate();
    
    const painel = tickets.get(`tickets.paineis.${painelId}`);
    const funcoes = painel.funcoes || {};
    const funcoesArray = Object.keys(funcoes);
    let funcoesText = funcoesArray.map(f => `> ${funcoes[f].emoji || ">"} **${funcoes[f].nome}** - ${funcoes[f].descricao?.substring(0, 30) || "Sem desc"}...`).join("\n");

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ticket_gerenciar_${painelId}`).setLabel('Voltar').setEmoji(`1178068047202893869`).setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Ticket > ${painel.titulo} > Categorias` },
        { type: 14 },
        { type: 10, content: `${Emojis.get('checker')} | Categoria **${nome}** adicionada!` },
        { type: 14 },
        { type: 10, content: `## Categorias` },
        { type: 10, content: `**Categorias (${funcoesArray.length}):**\n${funcoesText}` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 3, label: 'Adicionar', custom_id: `ticket_addfuncao_${painelId}`, emoji: { id: '1178067873894236311' } },
                { type: 2, style: 4, label: 'Remover', custom_id: `ticket_remfuncao_${painelId}`, emoji: { id: '1178076767567757312' } }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    await interaction.editReply(containerContent);
}

async function PaginaRemoverFuncao(interaction, painelId) {
    const painel = tickets.get(`tickets.paineis.${painelId}`);
    const funcoes = painel?.funcoes || {};
    const funcoesArray = Object.keys(funcoes);

    if (funcoesArray.length === 0) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Este painel nao tem categorias para remover!`, ephemeral: true });
    }

    const selectOptions = funcoesArray.map(f => ({
        label: funcoes[f].nome,
        value: `${painelId}_${f}`,
        emoji: { id: "1178163524443316285" }
    }));

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ticket_categorias_${painelId}`).setLabel('Voltar').setEmoji(`1178068047202893869`).setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Ticket > Remover Categoria` },
        { type: 14 },
        { type: 10, content: `## Remover Categoria` },
        { type: 10, content: `> Selecione a categoria que deseja remover:` },
        { type: 14 },
        { type: 1, components: [{ type: 3, custom_id: "ticket_select_remfuncao", placeholder: "Selecione uma categoria", options: selectOptions }] }
    ).with({ components: [rowVoltar], flags: [64] });

    await interaction.update(containerContent);
}


async function HandleRemoverFuncao(interaction, painelId, funcaoId) {
    tickets.delete(`tickets.paineis.${painelId}.funcoes.${funcaoId}`);
    
    await interaction.deferUpdate();
    
    const painel = tickets.get(`tickets.paineis.${painelId}`);
    const funcoes = painel.funcoes || {};
    const funcoesArray = Object.keys(funcoes);
    let funcoesText = funcoesArray.length > 0
        ? funcoesArray.map(f => `> ${funcoes[f].emoji || ">"} **${funcoes[f].nome}** - ${funcoes[f].descricao?.substring(0, 30) || "Sem desc"}...`).join("\n")
        : "> *Nenhuma categoria criada*";

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ticket_gerenciar_${painelId}`).setLabel('Voltar').setEmoji(`1178068047202893869`).setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Ticket > ${painel.titulo} > Categorias` },
        { type: 14 },
        { type: 10, content: `${Emojis.get('checker')} | Categoria removida com sucesso!` },
        { type: 14 },
        { type: 10, content: `## Categorias` },
        { type: 10, content: `**Categorias (${funcoesArray.length}):**\n${funcoesText}` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 3, label: 'Adicionar', custom_id: `ticket_addfuncao_${painelId}`, emoji: { id: '1178067873894236311' } },
                { type: 2, style: 4, label: 'Remover', custom_id: `ticket_remfuncao_${painelId}`, emoji: { id: '1178076767567757312' }, disabled: funcoesArray.length === 0 }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    await interaction.editReply(containerContent);
}

module.exports = { PaginaCategorias, ModalAddFuncaoTicket, HandleAddFuncaoTicket, PaginaRemoverFuncao, HandleRemoverFuncao };
