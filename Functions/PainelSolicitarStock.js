const { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder, ChannelType, EmbedBuilder } = require("discord.js");
const { res } = require("../res");
const { configuracao } = require("../DataBaseJson");
const emojis = require("../DataBaseJson/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

async function PainelSolicitarStock(interaction, client) {
    const canalLogs = configuracao.get('solicitarStock.canalLogs');
    const canalLogsMencao = canalLogs ? `<#${canalLogs}>` : '`Não configurado`';

    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("stock_definir_canal").setLabel('Definir canal de logs').setEmoji(`${Emojis.get('logss')}`).setStyle(2),
        new ButtonBuilder().setCustomId("stock_configurar_embed").setLabel('Configurar Embed').setEmoji(`${Emojis.get('_lapis_emoji')}`).setStyle(2)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("voltar3").setLabel('Voltar').setEmoji(`1178068047202893869`).setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Vendas > Solicitar Stock` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get('caixagrande')} Painel de Solicitar Stock` },
        { type: 10, content: `Configure o painel de solicitação de estoque para sua equipe.` },
        { type: 14 },
        { type: 10, content: `> **Canal de Logs:** ${canalLogsMencao}` },
        { type: 14 },
        { type: 10, content: `-# Utilize os botões abaixo para configurar o painel.` }
    ).with({ components: [rowBotoes, rowVoltar], flags: [64] });

    if (interaction.message == undefined) interaction.reply(containerContent);
    else interaction.update(containerContent);
}

async function PaginaDefinirCanalStock(interaction) {
    const rowCanal = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder().setCustomId("stock_select_canal_logs").setPlaceholder('Selecione o canal de logs...').setChannelTypes(ChannelType.GuildText)
    );
    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("stock_voltar_painel").setLabel('Voltar').setEmoji(`${Emojis.get('_back_emoji')}`).setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Solicitar Stock > Definir Canal` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get('logss')} Definir Canal de Logs` },
        { type: 10, content: `Selecione o canal onde as solicitações de estoque serão enviadas.` }
    ).with({ components: [rowCanal, rowVoltar], flags: [64] });

    interaction.update(containerContent);
}

async function PaginaConfigurarEmbed(interaction, client) {
    const embedConfig = configuracao.get('solicitarStock.embed') || {};
    const botaoConfig = configuracao.get('solicitarStock.botao') || {};

    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("stock_enviar").setLabel('Enviar').setEmoji(`${Emojis.get('_send_emoji')}`).setStyle(1),
        new ButtonBuilder().setCustomId("stock_resetar").setLabel('Resetar').setEmoji(`${Emojis.get('negative')}`).setStyle(4),
        new ButtonBuilder().setCustomId("stock_visualizar").setLabel('Visualizar').setEmoji(`${Emojis.get('lupa')}`).setStyle(2)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("stock_voltar_painel").setLabel('Voltar').setEmoji(`${Emojis.get('_back_emoji')}`).setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Solicitar Stock > Configurar Embed` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get('_lapis_emoji')} Configurar mensagem de solicitação` },
        { type: 10, content: `Aqui você pode configurar a mensagem de solicitação utilizando os botões abaixo.` },
        { type: 14 },
        { type: 10, content: `**Informações:**\n> Importe um **arquivo JSON**, [clique aqui](https://discord.com) e edite diretamente no site.` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "stock_select_embed",
                placeholder: "Selecione o elemento da embed",
                options: [
                    { label: "Título da Embed", description: "Alterar o título exibido na embed", value: "titulo", emoji: { name: "📝" } },
                    { label: "Descrição da Embed", description: "Alterar o texto de descrição na embed", value: "descricao", emoji: { name: "📄" } },
                    { label: "Cor da Embed", description: "Alterar a cor da barra lateral da embed", value: "cor", emoji: { name: "🎨" } },
                    { label: "Imagem da Embed", description: "Alterar a imagem principal exibida na embed", value: "imagem", emoji: { name: "🖼️" } },
                    { label: "Miniatura da Embed", description: "Alterar a miniatura (thumbnail) exibida na embed", value: "thumbnail", emoji: { name: "🔲" } }
                ]
            }]
        },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "stock_select_botao",
                placeholder: "Selecione o elemento do botão",
                options: [
                    { label: "Mensagem do botão", description: "Muda a mensagem do botão", value: "mensagem", emoji: { name: "💬" } },
                    { label: "Emoji do botão", description: "Muda o emoji do botão", value: "emoji", emoji: { name: "😀" } },
                    { label: "Cor do botão", description: "Muda a cor do botão", value: "cor", emoji: { name: "🎨" } }
                ]
            }]
        }
    ).with({ components: [rowBotoes, rowVoltar], flags: [64] });

    interaction.update(containerContent);
}

async function PaginaEscolherCanalPostar(interaction) {
    const rowCanal = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder().setCustomId("stock_select_canal_postar").setPlaceholder('Selecione o canal para postar...').setChannelTypes(ChannelType.GuildText)
    );
    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("stock_configurar_embed").setLabel('Voltar').setEmoji(`${Emojis.get('_back_emoji')}`).setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Solicitar Stock > Postar Painel` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get('_send_emoji')} Escolher canal para postar` },
        { type: 10, content: `Selecione o canal onde o painel de solicitação será postado.` }
    ).with({ components: [rowCanal, rowVoltar], flags: [64] });

    interaction.update(containerContent);
}

async function ModalTituloEmbed(interaction) {
    const embedConfig = configuracao.get('solicitarStock.embed') || {};
    const modal = new ModalBuilder().setCustomId('modal_stock_titulo').setTitle('Configurar Título');
    const input = new TextInputBuilder().setCustomId('valor').setLabel('Título da Embed').setPlaceholder('Ex: Solicitar Estoque').setStyle(TextInputStyle.Short).setRequired(true).setValue(embedConfig.titulo || '').setMaxLength(256);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function ModalDescricaoEmbed(interaction) {
    const embedConfig = configuracao.get('solicitarStock.embed') || {};
    const modal = new ModalBuilder().setCustomId('modal_stock_descricao').setTitle('Configurar Descrição');
    const input = new TextInputBuilder().setCustomId('valor').setLabel('Descrição da Embed').setPlaceholder('Ex: Clique no botão para solicitar estoque').setStyle(TextInputStyle.Paragraph).setRequired(true).setValue(embedConfig.descricao || '').setMaxLength(2000);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function ModalCorEmbed(interaction) {
    const embedConfig = configuracao.get('solicitarStock.embed') || {};
    const modal = new ModalBuilder().setCustomId('modal_stock_cor').setTitle('Configurar Cor');
    const input = new TextInputBuilder().setCustomId('valor').setLabel('Cor da Embed (Hex)').setPlaceholder('Ex: #5865F2').setStyle(TextInputStyle.Short).setRequired(true).setValue(embedConfig.cor || '').setMaxLength(7);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function ModalImagemEmbed(interaction) {
    const embedConfig = configuracao.get('solicitarStock.embed') || {};
    const modal = new ModalBuilder().setCustomId('modal_stock_imagem').setTitle('Configurar Imagem');
    const input = new TextInputBuilder().setCustomId('valor').setLabel('URL da Imagem').setPlaceholder('Ex: https://exemplo.com/imagem.png').setStyle(TextInputStyle.Short).setRequired(false).setValue(embedConfig.imagem || '').setMaxLength(500);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function ModalThumbnailEmbed(interaction) {
    const embedConfig = configuracao.get('solicitarStock.embed') || {};
    const modal = new ModalBuilder().setCustomId('modal_stock_thumbnail').setTitle('Configurar Miniatura');
    const input = new TextInputBuilder().setCustomId('valor').setLabel('URL da Miniatura').setPlaceholder('Ex: https://exemplo.com/thumb.png').setStyle(TextInputStyle.Short).setRequired(false).setValue(embedConfig.thumbnail || '').setMaxLength(500);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function ModalMensagemBotao(interaction) {
    const botaoConfig = configuracao.get('solicitarStock.botao') || {};
    const modal = new ModalBuilder().setCustomId('modal_stock_botao_msg').setTitle('Configurar Mensagem do Botão');
    const input = new TextInputBuilder().setCustomId('valor').setLabel('Mensagem do Botão').setPlaceholder('Ex: Solicitar Estoque').setStyle(TextInputStyle.Short).setRequired(true).setValue(botaoConfig.mensagem || 'Solicitar Estoque').setMaxLength(80);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function ModalEmojiBotao(interaction) {
    const botaoConfig = configuracao.get('solicitarStock.botao') || {};
    const modal = new ModalBuilder().setCustomId('modal_stock_botao_emoji').setTitle('Configurar Emoji do Botão');
    const input = new TextInputBuilder().setCustomId('valor').setLabel('Emoji do Botão').setPlaceholder('Ex: 📦 ou <:emoji:123456789>').setStyle(TextInputStyle.Short).setRequired(false).setValue(botaoConfig.emoji || '').setMaxLength(100);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function ModalCorBotao(interaction) {
    const botaoConfig = configuracao.get('solicitarStock.botao') || {};
    const modal = new ModalBuilder().setCustomId('modal_stock_botao_cor').setTitle('Configurar Cor do Botão');
    const input = new TextInputBuilder().setCustomId('valor').setLabel('Cor do Botão (1=Azul, 2=Cinza, 3=Verde, 4=Vermelho)').setPlaceholder('Ex: 1').setStyle(TextInputStyle.Short).setRequired(true).setValue(botaoConfig.cor?.toString() || '1').setMaxLength(1);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function VisualizarEmbed(interaction) {
    const embedConfig = configuracao.get('solicitarStock.embed') || {};
    const botaoConfig = configuracao.get('solicitarStock.botao') || {};
    
    if (!embedConfig.titulo) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Configure pelo menos o título da embed primeiro!`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(embedConfig.titulo)
        .setDescription(embedConfig.descricao || 'Sem descrição')
        .setColor(embedConfig.cor ? parseInt(embedConfig.cor.replace('#', ''), 16) : 0x5865F2);

    if (embedConfig.imagem) embed.setImage(embedConfig.imagem);
    if (embedConfig.thumbnail) embed.setThumbnail(embedConfig.thumbnail);

    const corBotao = parseInt(botaoConfig.cor) || 1;
    const rowBotao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("stock_preview_btn")
            .setLabel(botaoConfig.mensagem || 'Solicitar Estoque')
            .setEmoji(botaoConfig.emoji || `${Emojis.get('caixagrande')}`)
            .setStyle(corBotao)
            .setDisabled(true)
    );

    await interaction.reply({ content: `-# Preview do painel:`, embeds: [embed], components: [rowBotao], ephemeral: true });
}

async function PostarPainelStock(interaction, canalId, client) {
    const canalLogs = configuracao.get('solicitarStock.canalLogs');
    const embedConfig = configuracao.get('solicitarStock.embed') || {};
    const botaoConfig = configuracao.get('solicitarStock.botao') || {};

    if (!canalLogs) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Configure o canal de logs primeiro!`, ephemeral: true });
    }

    if (!embedConfig.titulo) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Configure a embed primeiro!`, ephemeral: true });
    }

    const canal = await client.channels.fetch(canalId).catch(() => null);
    if (!canal) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Canal não encontrado!`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(embedConfig.titulo)
        .setDescription(embedConfig.descricao || 'Clique no botão abaixo para solicitar estoque.')
        .setColor(embedConfig.cor ? parseInt(embedConfig.cor.replace('#', ''), 16) : 0x5865F2);

    if (embedConfig.imagem) embed.setImage(embedConfig.imagem);
    if (embedConfig.thumbnail) embed.setThumbnail(embedConfig.thumbnail);

    const corBotao = parseInt(botaoConfig.cor) || 1;
    const rowBotao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("solicitar_estoque_btn")
            .setLabel(botaoConfig.mensagem || 'Solicitar Estoque')
            .setEmoji(botaoConfig.emoji || `${Emojis.get('caixagrande')}`)
            .setStyle(corBotao)
    );

    await canal.send({ embeds: [embed], components: [rowBotao] });
    
    const containerSucesso = res.main(
        { type: 10, content: `-# Painel > Solicitar Stock` },
        { type: 14 },
        { type: 10, content: `${Emojis.get('checker')} **Painel postado com sucesso!**` },
        { type: 10, content: `> O painel foi enviado em <#${canalId}>` }
    ).with({ components: [], flags: [64] });

    await interaction.update(containerSucesso);
}

async function ResetarConfiguracoes(interaction, client) {
    configuracao.delete('solicitarStock.embed');
    configuracao.delete('solicitarStock.botao');
    await interaction.reply({ content: `${Emojis.get('checker')} | Configurações resetadas!`, ephemeral: true });
}

async function ModalSolicitarEstoque(interaction) {
    const modal = new ModalBuilder().setCustomId('modal_solicitar_estoque').setTitle('Solicitar Estoque');
    const produtoInput = new TextInputBuilder().setCustomId('stock_produto').setLabel('Nome do Produto').setPlaceholder('Ex: Nitro Gaming').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100);
    const quantidadeInput = new TextInputBuilder().setCustomId('stock_quantidade').setLabel('Quantidade').setPlaceholder('Ex: 10').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10);
    modal.addComponents(
        new ActionRowBuilder().addComponents(produtoInput),
        new ActionRowBuilder().addComponents(quantidadeInput)
    );
    await interaction.showModal(modal);
}

async function EnviarLogSolicitacao(interaction, client) {
    const canalLogsId = configuracao.get('solicitarStock.canalLogs');
    if (!canalLogsId) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Canal de logs não configurado!`, ephemeral: true });
    }

    const canal = await client.channels.fetch(canalLogsId).catch(() => null);
    if (!canal) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Canal de logs não encontrado!`, ephemeral: true });
    }

    const produto = interaction.fields.getTextInputValue('stock_produto');
    const quantidade = interaction.fields.getTextInputValue('stock_quantidade');

    const embed = new EmbedBuilder()
        .setTitle(`${Emojis.get('caixagrande')} Nova Solicitação de Estoque`)
        .setDescription(`o Usuario ${interaction.user} Solicitou Stock Utilizando o Sistema Veja os detalhes do pedido Logo Abaixo.`)
        .setColor(0x5865F2)
        .addFields(
            { name: `${Emojis.get('user')} Usuario`, value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: false },
            { name: `${Emojis.get('caixagrande')} Produto Solicitado`, value: produto, inline: true },
            { name: `${Emojis.get('caixa')} Quantidade`, value: quantidade, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Solicitado por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    await canal.send({ embeds: [embed] });
    await interaction.reply({ content: `${Emojis.get('checker')} | Solicitação enviada com sucesso!`, ephemeral: true });
}

module.exports = {
    PainelSolicitarStock, PaginaDefinirCanalStock, PaginaConfigurarEmbed, PaginaEscolherCanalPostar,
    ModalTituloEmbed, ModalDescricaoEmbed, ModalCorEmbed, ModalImagemEmbed, ModalThumbnailEmbed,
    ModalMensagemBotao, ModalEmojiBotao, ModalCorBotao, VisualizarEmbed, PostarPainelStock,
    ResetarConfiguracoes, ModalSolicitarEstoque, EnviarLogSolicitacao
};
