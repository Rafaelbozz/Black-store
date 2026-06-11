const { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { configuracao, produtos, EmojisHelper } = require("../DataBaseJson");
const { res } = require("../res");

const Emojis = EmojisHelper;

async function PainelTermosLoja(interaction) {
    const termos = configuracao.get('TermosDeUso') || 'Não configurado';
    const temTermos = termos !== 'Não configurado' && termos !== '';

    const rowVoltar = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("painelconfigvendas")
                .setLabel('Voltar')
                .setEmoji(`1178068047202893869`)
                .setStyle(2)
        );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Vendas > Termos da Loja` },
        { type: 14 },
        { type: 10, content: `## ${Emojis.get('cargovery')} Termos da Loja` },
        { type: 14 },
        { type: 10, content: `> Configure os termos de uso que serão exibidos aos clientes.` },
        { type: 14 },
        { type: 10, content: `### Termos Atuais` },
        { type: 10, content: temTermos ? `\`\`\`\n${termos.substring(0, 500)}${termos.length > 500 ? '...' : ''}\n\`\`\`` : `> \`Nenhum termo configurado\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: 'Configurar Termos', custom_id: 'config_termos', emoji: { id: '1384035217550868493' } },
                { type: 2, style: 4, label: 'Limpar Termos', custom_id: 'limpar_termos', emoji: { id: '1384035185217110077' }, disabled: !temTermos }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

async function LimparTermos(interaction) {
    await configuracao.set('TermosDeUso', '');
    
    await PainelTermosLoja(interaction);
    
    await interaction.followUp({ 
        content: `${Emojis.get('checker')} Termos da loja limpos com sucesso!`, 
        ephemeral: true 
    });
}

async function PainelConfigAvancadas(interaction) {
    const rowVoltar = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("painelconfigvendas")
                .setLabel('Voltar')
                .setEmoji(`1178068047202893869`)
                .setStyle(2)
        );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Vendas > Configurações Avançadas` },
        { type: 14 },
        { type: 10, content: `## ⚙️ Configurações Avançadas` },
        { type: 14 },
        { type: 10, content: `> Configure aspectos avançados do seu sistema de vendas.\n> Personalize termos, botões e controle o status do comércio.` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: 'Configurar Termos', custom_id: 'config_termos', emoji: { id: '1178067873894236311' } },
                { type: 2, style: 2, label: 'Botão Dúvidas', custom_id: 'painel_botao_duvidas', emoji: { id: '1178067945855910078' } },
                { type: 2, style: 2, label: 'Status do Comércio', custom_id: 'config_status_comercio', emoji: { id: '1178086608004722689' } }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

async function ConfigurarTermos(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("modal_configurar_termos")
        .setTitle("Configurar Termos de Uso");

    const termosInput = new TextInputBuilder()
        .setCustomId("termos_texto")
        .setLabel("Termos de Uso")
        .setPlaceholder("Digite os termos de uso que serão exibidos aos clientes...")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(4000);

    const row = new ActionRowBuilder().addComponents(termosInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function ConfigurarBotaoDuvidas(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("modal_configurar_botao_duvidas")
        .setTitle("Configurar Botão de Dúvidas");

    const labelInput = new TextInputBuilder()
        .setCustomId("botao_label")
        .setLabel("Texto do Botão")
        .setPlaceholder("Ex: Dúvidas? Clique aqui!")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(80);

    const urlInput = new TextInputBuilder()
        .setCustomId("botao_url")
        .setLabel("URL do Botão")
        .setPlaceholder("Ex: https://discord.gg/seu-servidor")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(200);

    const row1 = new ActionRowBuilder().addComponents(labelInput);
    const row2 = new ActionRowBuilder().addComponents(urlInput);
    
    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
}

async function PainelBotaoDuvidas(interaction) {
    const statusAtual = configuracao.get('BotaoDuvidasAtivo') || 'false';
    const isAtivo = statusAtual === 'true';
    const statusTexto = isAtivo ? '🟢 Ativado' : '🔴 Desativado';
    
    const label = configuracao.get('BotaoDuvidasLabel') || 'Não configurado';
    const url = configuracao.get('BotaoDuvidasURL') || 'Não configurado';
    
    const estaConfigurado = label !== 'Não configurado' && url !== 'Não configurado';

    const rowVoltar = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("painelconfigvendas")
                .setLabel('Voltar')
                .setEmoji(`1178068047202893869`)
                .setStyle(2)
        );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Vendas > Botão Dúvidas` },
        { type: 14 },
        { type: 10, content: `##  Configuração do Botão de Dúvidas` },
        { type: 14 },
        { type: 10, content: `> Status atual: **${statusTexto}**` },
        { type: 14 },
        { type: 10, content: `### Configurações Atuais` },
        { type: 10, content: `> **Label:** \`${label}\`` },
        { type: 10, content: `> **URL:** \`${url}\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                { 
                    type: 2, 
                    style: isAtivo ? 4 : 3, 
                    label: isAtivo ? 'Desativar' : 'Ativar', 
                    custom_id: 'toggle_botao_duvidas', 
                    emoji: { id: isAtivo ? '1376272262780424365' : '1376272266068889751' },
                    disabled: !isAtivo && !estaConfigurado
                },
                { type: 2, style: 2, label: 'Configurar', custom_id: 'config_botao_duvidas', emoji: { id: '1376272243679563923' } }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

async function ToggleBotaoDuvidas(interaction) {
    const statusAtual = configuracao.get('BotaoDuvidasAtivo') || 'false';
    const novoStatus = statusAtual === 'true' ? 'false' : 'true';
    
    await configuracao.set('BotaoDuvidasAtivo', novoStatus);

    let produtosAtualizados = 0;
    try {
        const { UpdateMessageProduto } = require("./SenderMessagesOrUpdates.js");
        const todosProdutos = produtos.all();
        
        for (const prod of todosProdutos) {
            if (prod.value && prod.value.mensagens && prod.value.mensagens.length > 0) {
                try {
                    await UpdateMessageProduto(interaction.client, prod.ID);
                    produtosAtualizados++;
                } catch (err) {
                    console.error(`Erro ao atualizar produto ${prod.ID}:`, err);
                }
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar produtos:', error);
    }

    await PainelBotaoDuvidas(interaction);

    if (produtosAtualizados > 0) {
        await interaction.followUp({ 
            content: `${Emojis.get('checker')} ${produtosAtualizados} produto(s) atualizado(s) com sucesso!`, 
            ephemeral: true 
        });
    }
}

async function ConfigurarStatusComercio(interaction) {
    const statusAtual = configuracao.get('StatusComercio') || 'aberto';
    const statusTexto = statusAtual === 'aberto' ? '🟢 Aberto' : '🔴 Fechado';
    const novoStatus = statusAtual === 'aberto' ? 'fechado' : 'aberto';

    const rowVoltar = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("painelconfigvendas")
                .setLabel('Voltar')
                .setEmoji(`1178068047202893869`)
                .setStyle(2)
        );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Vendas > Status do Comércio` },
        { type: 14 },
        { type: 10, content: `## ⚙️ Status do Comércio` },
        { type: 14 },
        { type: 10, content: `> Status atual: **${statusTexto}**` },
        { type: 14 },
        { type: 10, content: `> Deseja alterar o status do comércio?` },
        { type: 14 },
        {
            type: 1,
            components: [
                { 
                    type: 2, 
                    style: novoStatus === 'aberto' ? 3 : 4, 
                    label: novoStatus === 'aberto' ? 'Abrir Comércio' : 'Fechar Comércio', 
                    custom_id: `alterar_status_${novoStatus}`, 
                    emoji: { id: novoStatus === 'aberto' ? '1376272266068889751' : '1376272262780424365' }
                }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

async function AlterarStatusComercio(interaction, novoStatus) {
    await configuracao.set('StatusComercio', novoStatus);

    const mensagem = novoStatus === 'aberto' 
        ? `${Emojis.get('checker')} Comércio aberto com sucesso!` 
        : `${Emojis.get('checker')} Comércio fechado com sucesso!`;

    await ConfigurarStatusComercio(interaction);
    
    await interaction.followUp({ content: mensagem, ephemeral: true });
}

async function SalvarTermos(interaction) {
    try {
        const termos = interaction.fields.getTextInputValue('termos_texto');
        
        await configuracao.set('TermosDeUso', termos);
        await interaction.reply({ content: `${Emojis.get('checker')} Termos de uso configurados com sucesso!`, ephemeral: true });
    } catch (error) {
        console.error('Erro ao salvar termos:', error);
        await interaction.reply({ content: `${Emojis.get('negative')} Erro ao salvar termos.`, ephemeral: true }).catch(() => {});
    }
}

async function SalvarBotaoDuvidas(interaction) {
    try {
        const label = interaction.fields.getTextInputValue('botao_label');
        const url = interaction.fields.getTextInputValue('botao_url');
        
        await configuracao.set('BotaoDuvidasLabel', label);
        await configuracao.set('BotaoDuvidasURL', url);
        await interaction.reply({ content: `${Emojis.get('checker')} Botão de Dúvidas configurado com sucesso!`, ephemeral: true });
    } catch (error) {
        console.error('Erro ao salvar botão de dúvidas:', error);
        await interaction.reply({ content: `${Emojis.get('negative')} Erro ao salvar configurações.`, ephemeral: true }).catch(() => {});
    }
}

module.exports = {
    PainelConfigAvancadas,
    ConfigurarTermos,
    ConfigurarBotaoDuvidas,
    PainelBotaoDuvidas,
    PainelTermosLoja,
    LimparTermos,
    ToggleBotaoDuvidas,
    ConfigurarStatusComercio,
    AlterarStatusComercio,
    SalvarTermos,
    SalvarBotaoDuvidas
};
