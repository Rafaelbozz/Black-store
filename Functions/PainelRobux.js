const { ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType } = require("discord.js")
const { Emojis } = require("../DataBaseJson")
const { res } = require("../res")
const { JsonDatabase } = require("wio.db");

const robuxConfig = new JsonDatabase({
    databasePath: "./DataBaseJson/configuracaorobux.json"
});

const mensagemRobux = new JsonDatabase({
    databasePath: "./DataBaseJson/mensagemrobux.json"
});

const MENSAGEM_PADRAO = {
    titulo: "Área de pedidos | Bot Robux",
    descricao: "> Olá! Seja bem-vindo(a) ao **Painel Oficial de Compras** do **Bot Robux**, onde você pode adquirir **Robux** e **Gamepasses** com segurança, agilidade e atendimento profissional.",
    orientacoes: "• Revise todas as informações antes de abrir um ticket.\n• Certifique-se de estar com os dados corretos de sua conta.\n• Para **Gamepasses**: desative preços regionais antes da compra.\n• Compras feitas com valores regionais incorretos **não possuem reembolso**.",
    rodape: "Escolha uma opção para solicitar o seu pedido"
};

async function painelRobux(interaction) {
    const statusRobux = robuxConfig.get(`config.status`) || false;
    const statusGamepass = robuxConfig.get(`config.statusGamepass`) || false;
    
    const valorRobux = robuxConfig.get(`config.valores.robux`) || "Não definido";
    const valorGamepass = robuxConfig.get(`config.valores.gamepass`) || "Não definido";
    
    const limiteRobux = robuxConfig.get(`config.limites.robux`) || "Não definido";
    const limiteGamepass = robuxConfig.get(`config.limites.gamepass`) || "Não definido";
    const minimoRobux = robuxConfig.get(`config.limites.minimoRobux`) || "Não definido";
    const minimoGamepass = robuxConfig.get(`config.limites.minimoGamepass`) || "Não definido";

    const canalIniciadas = robuxConfig.get(`config.canais.iniciadas`);
    const canalCanceladas = robuxConfig.get(`config.canais.canceladas`);
    const canalAprovadas = robuxConfig.get(`config.canais.aprovadas`);
    const canalPublicas = robuxConfig.get(`config.canais.publicas`);
    const categoriaCarrinhos = robuxConfig.get(`config.canais.categoriaCarrinhos`);

    const statusRobuxText = statusRobux 
        ? `${Emojis.get('checker') || '✅'} **Robux:** Ativado` 
        : `${Emojis.get('negative') || '❌'} **Robux:** Desativado`;

    const statusGamepassText = statusGamepass 
        ? `${Emojis.get('checker') || '✅'} **Gamepass:** Ativado` 
        : `${Emojis.get('negative') || '❌'} **Gamepass:** Desativado`;

    const selectOptions = [];
    
    if (statusRobux) {
        selectOptions.push({ 
            label: "Desativar Robux", 
            description: "Desativa o sistema de Robux", 
            value: "desativar_robux", 
            emoji: { id: "1387981760649756782" } 
        });
    } else {
        selectOptions.push({ 
            label: "Ativar Robux", 
            description: "Ativa o sistema de Robux", 
            value: "ativar_robux", 
            emoji: { id: "1387981762050920548" } 
        });
    }

    if (statusGamepass) {
        selectOptions.push({ 
            label: "Desativar Gamepass", 
            description: "Desativa o sistema de Gamepass", 
            value: "desativar_gamepass", 
            emoji: { id: "1387981760649756782" } 
        });
    } else {
        selectOptions.push({ 
            label: "Ativar Gamepass", 
            description: "Ativa o sistema de Gamepass", 
            value: "ativar_gamepass", 
            emoji: { id: "1387981762050920548" } 
        });
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar00")
            .setLabel('Voltar')
            .setEmoji(`${Emojis.get('_back_emoji') || '1178068047202893869'}`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema Ilusion Bux` },
        { type: 14 },
        { type: 10, content: `**Painel de Configuração do Bot**\nUse o menu abaixo para gerenciar as configurações do seu bot.` },
        { type: 14 },
        { type: 10, content: `**Status da Loja**\n\n> ${statusRobuxText}\n> ${statusGamepassText}` },
        { type: 14 },
        { type: 10, content: `**Valores Configurados (a cada 1000 Robux)**\n\n>  **Valor Robux:** \`R$ ${valorRobux}\`\n>  **Valor Gamepass:** \`R$ ${valorGamepass}\`` },
        { type: 14 },
        { type: 10, content: `**Limites Configurados**\n\n>  **Limite Robux:** \`${limiteRobux}\`\n>  **Limite Gamepass:** \`${limiteGamepass}\`\n>  **Mínimo Robux:** \`${minimoRobux}\`\n>  **Mínimo Gamepass:** \`${minimoGamepass}\`` },
        { type: 14 },
        { type: 10, content: `**Canais Configurados**\n\n>  **Compras Iniciadas:** ${canalIniciadas ? `<#${canalIniciadas}>` : `\`Não definido\``}\n>  **Compras Canceladas:** ${canalCanceladas ? `<#${canalCanceladas}>` : `\`Não definido\``}\n>  **Compras Aprovadas:** ${canalAprovadas ? `<#${canalAprovadas}>` : `\`Não definido\``}\n>  **Compras Públicas:** ${canalPublicas ? `<#${canalPublicas}>` : `\`Não definido\``}\n>  **Categoria Carrinhos:** ${categoriaCarrinhos ? `<#${categoriaCarrinhos}>` : `\`Não definido\``}` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "robux_status_select",
                placeholder: "Selecione o status da loja",
                options: selectOptions
            }]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Configurar Mensagem", emoji: { id: "1178066208835252266" }, custom_id: "robux_config_mensagem" },
                { type: 2, style: 2, label: "Configurar Valores", emoji: { id: "1178080366871973958" }, custom_id: "robux_config_valores" },
                { type: 2, style: 2, label: "Configurar Limites", emoji: { id: "1178080828933283960" }, custom_id: "robux_config_limites" }
            ]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Configurar Canais", emoji: { id: "1178086608004722689" }, custom_id: "robux_config_canais" },
                { type: 2, style: 2, label: "Personalizar Bot", emoji: { id: "1178080828933283960" }, custom_id: "robux_personalizar" }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}

async function painelConfigMensagem(interaction) {
    const mensagemCustom = mensagemRobux.get(`mensagemCustom`);
    const statusMensagem = mensagemCustom ? "Mensagem Personalizada" : "Usando Mensagem Padrão";

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_robux_painel")
            .setLabel('Voltar')
            .setEmoji(`${Emojis.get('_back_emoji') || '1178068047202893869'}`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema Ilusion Bux > Configurar Mensagem` },
        { type: 14 },
        { type: 10, content: `> **Personalização da Mensagem de Compra**` },
        { type: 10, content: `**Status:**\n> ${mensagemCustom ? `${Emojis.get('checker') || '✅'}` : `${Emojis.get('info') || 'ℹ️'}`} ${statusMensagem}` },
        { type: 10, content: `**Informações:**\n> Caso a mensagem não esteja configurada, iremos usar a **mensagem padrão** do sistema.` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 3, label: "Enviar Mensagem", emoji: { id: "1178076954029731930" }, custom_id: "robux_enviar_mensagem" },
                { type: 2, style: 2, label: "Configurar Container", emoji: { id: "1178077123882262628" }, custom_id: "robux_configurar_container" },
                { type: 2, style: 2, label: "Visualizar", emoji: { id: "1178066208835252266" }, custom_id: "robux_visualizar_mensagem" }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}

async function enviarMensagemRobux(interaction, channelId, client) {
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
        return false;
    }

    const mensagemCustom = mensagemRobux.get(`mensagemCustom`);
    const msg = mensagemCustom || MENSAGEM_PADRAO;

    const containerContent = res.main(
        { type: 10, content: `# ${Emojis.get('robux')} Área de pedidos | Bot Robux` },
        { type: 14 },
        { type: 10, content: msg.descricao },
        { type: 14 },
        { type: 10, content: `${Emojis.get('checkrobux')} **Orientações**\n${msg.orientacoes}` },
        { type: 14 },
        { type: 10, content: msg.rodape },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "robux_comprar_select",
                placeholder: "Escolha uma opção para solicitar o seu pedido",
                options: [
                    { label: "Comprar Robux", description: "Solicitar compra de Robux", value: "comprar_robux", emoji: { id: "1459388854715940968" } },
                    { label: "Comprar Gamepass", description: "Solicitar compra de Gamepass", value: "comprar_gamepass", emoji: { id: "1387981737501393058" } }
                ]
            }]
        }
    ).with({
        components: []
    });

    try {
        await channel.send(containerContent);
        return true;
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        return false;
    }
}

async function modalConfigurarContainer(interaction) {
    const mensagemCustom = mensagemRobux.get(`mensagemCustom`);
    const msg = mensagemCustom || MENSAGEM_PADRAO;

    const modal = new ModalBuilder()
        .setCustomId('robux_modal_configurar_container')
        .setTitle('Configurar Container');

    const inputTitulo = new TextInputBuilder()
        .setCustomId('container_titulo')
        .setLabel('Título')
        .setPlaceholder('Digite o título da mensagem')
        .setValue(msg.titulo || '')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    const inputDescricao = new TextInputBuilder()
        .setCustomId('container_descricao')
        .setLabel('Descrição')
        .setPlaceholder('Digite a descrição da mensagem')
        .setValue(msg.descricao || '')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

    const inputOrientacoes = new TextInputBuilder()
        .setCustomId('container_orientacoes')
        .setLabel('Orientações (use • para cada item)')
        .setPlaceholder('• Orientação 1\n• Orientação 2')
        .setValue(msg.orientacoes || '')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

    const inputRodape = new TextInputBuilder()
        .setCustomId('container_rodape')
        .setLabel('Rodapé')
        .setPlaceholder('Digite o rodapé da mensagem')
        .setValue(msg.rodape || '')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(200);

    modal.addComponents(
        new ActionRowBuilder().addComponents(inputTitulo),
        new ActionRowBuilder().addComponents(inputDescricao),
        new ActionRowBuilder().addComponents(inputOrientacoes),
        new ActionRowBuilder().addComponents(inputRodape)
    );

    await interaction.showModal(modal);
}

async function handleModalConfigurarContainer(interaction) {
    const titulo = interaction.fields.getTextInputValue('container_titulo');
    const descricao = interaction.fields.getTextInputValue('container_descricao');
    const orientacoes = interaction.fields.getTextInputValue('container_orientacoes');
    const rodape = interaction.fields.getTextInputValue('container_rodape');

    const novaMsg = {
        titulo: titulo,
        descricao: descricao,
        orientacoes: orientacoes,
        rodape: rodape || "Escolha uma opção para solicitar o seu pedido"
    };

    mensagemRobux.set(`mensagemCustom`, novaMsg);
    
    await painelConfigMensagem(interaction);
    interaction.followUp({ content: `${Emojis.get('checker') || '✅'} | Container configurado com sucesso!`, ephemeral: true });
}

async function visualizarMensagem(interaction) {
    const mensagemCustom = mensagemRobux.get(`mensagemCustom`);
    const msg = mensagemCustom || MENSAGEM_PADRAO;

    const containerContent = res.main(
        { type: 10, content: `# ${Emojis.get('robux')} Área de pedidos | Bot Robux` },
        { type: 14 },
        { type: 10, content: msg.descricao },
        { type: 14 },
        { type: 10, content: `${Emojis.get('checkrobux')} **Orientações**\n${msg.orientacoes}` },
        { type: 14 },
        { type: 10, content: msg.rodape },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "robux_preview_select",
                placeholder: "Escolha uma opção para solicitar o seu pedido",
                options: [
                    { label: "Comprar Robux", description: "Solicitar compra de Robux", value: "comprar_robux", emoji: { id: "1459388854715940968" } },
                    { label: "Comprar Gamepass", description: "Solicitar compra de Gamepass", value: "comprar_gamepass", id: { name: "1387981737501393058" } }
                ]
            }]
        }
    ).with({
        components: [],
        flags: [64]
    });

    await interaction.reply(containerContent);
}

async function configCanaisRobux(interaction) {
    const canalIniciadas = robuxConfig.get(`config.canais.iniciadas`);
    const canalCanceladas = robuxConfig.get(`config.canais.canceladas`);
    const canalAprovadas = robuxConfig.get(`config.canais.aprovadas`);
    const canalPublicas = robuxConfig.get(`config.canais.publicas`);
    const categoriaCarrinhos = robuxConfig.get(`config.canais.categoriaCarrinhos`);

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`robux_select_canal`)
                .addOptions(
                    { value: `canal_iniciadas`, label: `Canal de Compras Iniciadas`, emoji: `1246953187529855037` },
                    { value: `canal_canceladas`, label: `Canal de Compras Canceladas`, emoji: `1246953442283618334` },
                    { value: `canal_aprovadas`, label: `Canal de Compras Aprovadas`, emoji: `1246955020050759740` },
                    { value: `canal_publicas`, label: `Canal de Compras Públicas`, emoji: `1246955006242983936` },
                    { value: `categoria_carrinhos`, label: `Categoria de Carrinhos`, emoji: `1246953149009367173` }
                )
                .setPlaceholder(`Clique aqui para redefinir algum canal`)
                .setMaxValues(1)
        );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_robux_painel")
            .setLabel('Voltar')
            .setEmoji(`1238413255886639104`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema Ilusion Bux > Configurar Canais` },
        { type: 14 },
        { type: 10, content: `**Configurar Canais do Sistema de Robux**` },
        { type: 14 },
        { type: 10, content: `> **Canal de Compras Iniciadas:** ${canalIniciadas ? `<#${canalIniciadas}>` : `Não definido`}\n> **Canal de Compras Canceladas:** ${canalCanceladas ? `<#${canalCanceladas}>` : `Não definido`}\n> **Canal de Compras Aprovadas:** ${canalAprovadas ? `<#${canalAprovadas}>` : `Não definido`}\n> **Canal de Compras Públicas:** ${canalPublicas ? `<#${canalPublicas}>` : `Não definido`}\n> **Categoria de Carrinhos:** ${categoriaCarrinhos ? `<#${categoriaCarrinhos}>` : `Não definido`}` }
    ).with({
        components: [row1, row2],
        flags: [64]
    });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}

async function modalConfigValores(interaction) {
    const valorRobux = robuxConfig.get(`config.valores.robux`) || "";
    const valorGamepass = robuxConfig.get(`config.valores.gamepass`) || "";

    const modal = new ModalBuilder()
        .setCustomId('robux_modal_valores')
        .setTitle('Configuração de Valores de Robux');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('valor_robux').setLabel('Valor Do Robux (1000x Robux)').setPlaceholder('Digite o valor do Robux').setValue(valorRobux.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('valor_gamepass').setLabel('Valor Do Gamepass (1000x Robux)').setPlaceholder('Digite o valor do Gamepass').setValue(valorGamepass.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        )
    );

    await interaction.showModal(modal);
}

async function modalConfigLimites(interaction) {
    const limiteRobux = robuxConfig.get(`config.limites.robux`) || "";
    const limiteGamepass = robuxConfig.get(`config.limites.gamepass`) || "";
    const minimoRobux = robuxConfig.get(`config.limites.minimoRobux`) || "";
    const minimoGamepass = robuxConfig.get(`config.limites.minimoGamepass`) || "";

    const modal = new ModalBuilder()
        .setCustomId('robux_modal_limites')
        .setTitle('Configuração de Limites de Compras');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('limite_robux').setLabel('Limite De Robux').setPlaceholder('Digite o limite de Robux').setValue(limiteRobux.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('limite_gamepass').setLabel('Limite De Gamepass').setPlaceholder('Digite o limite de Gamepass').setValue(limiteGamepass.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('minimo_robux').setLabel('Valor Mínimo De Robux').setPlaceholder('Digite o valor mínimo de Robux').setValue(minimoRobux.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('minimo_gamepass').setLabel('Valor Mínimo De Gamepass').setPlaceholder('Digite o valor mínimo de Gamepass').setValue(minimoGamepass.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        )
    );

    await interaction.showModal(modal);
}

async function handleModalValores(interaction) {
    const valorRobux = interaction.fields.getTextInputValue('valor_robux');
    const valorGamepass = interaction.fields.getTextInputValue('valor_gamepass');

    if (valorRobux) {
        if (isNaN(valorRobux)) return interaction.reply({ content: `${Emojis.get('negative') || '❌'} | O valor do Robux deve ser um número!`, ephemeral: true });
        robuxConfig.set(`config.valores.robux`, valorRobux);
    } else {
        robuxConfig.delete(`config.valores.robux`);
    }

    if (valorGamepass) {
        if (isNaN(valorGamepass)) return interaction.reply({ content: `${Emojis.get('negative') || '❌'} | O valor do Gamepass deve ser um número!`, ephemeral: true });
        robuxConfig.set(`config.valores.gamepass`, valorGamepass);
    } else {
        robuxConfig.delete(`config.valores.gamepass`);
    }

    await painelRobux(interaction);
    interaction.followUp({ content: `${Emojis.get('checker') || '✅'} | Valores configurados com sucesso!`, ephemeral: true });
}

async function handleModalLimites(interaction) {
    const limiteRobux = interaction.fields.getTextInputValue('limite_robux');
    const limiteGamepass = interaction.fields.getTextInputValue('limite_gamepass');
    const minimoRobux = interaction.fields.getTextInputValue('minimo_robux');
    const minimoGamepass = interaction.fields.getTextInputValue('minimo_gamepass');

    const campos = [
        { valor: limiteRobux, key: 'config.limites.robux', nome: 'limite de Robux' },
        { valor: limiteGamepass, key: 'config.limites.gamepass', nome: 'limite de Gamepass' },
        { valor: minimoRobux, key: 'config.limites.minimoRobux', nome: 'valor mínimo de Robux' },
        { valor: minimoGamepass, key: 'config.limites.minimoGamepass', nome: 'valor mínimo de Gamepass' }
    ];

    for (const campo of campos) {
        if (campo.valor) {
            if (isNaN(campo.valor)) return interaction.reply({ content: `${Emojis.get('negative') || '❌'} | O ${campo.nome} deve ser um número!`, ephemeral: true });
            robuxConfig.set(campo.key, campo.valor);
        } else {
            robuxConfig.delete(campo.key);
        }
    }

    await painelRobux(interaction);
    interaction.followUp({ content: `${Emojis.get('checker') || '✅'} | Limites configurados com sucesso!`, ephemeral: true });
}

module.exports = { 
    painelRobux, 
    painelConfigMensagem,
    configCanaisRobux, 
    modalConfigValores, 
    modalConfigLimites, 
    handleModalValores, 
    handleModalLimites,
    modalConfigurarContainer,
    handleModalConfigurarContainer,
    visualizarMensagem,
    enviarMensagemRobux,
    robuxConfig,
    mensagemRobux
}
