const { ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType } = require("discord.js");
const { res } = require("../res");
const { configuracao, sugestao } = require("../DataBaseJson");
const emojis = require("../DataBaseJson/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

const sugestoesCooldown = new Map();

function gerarIdSugestao() {
    return `sug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function PainelSistemaSugestoes(interaction, client) {
    const canalSugestao = configuracao.get('sistemaSugestoes.canal');
    const cargoAvaliador = configuracao.get('sistemaSugestoes.cargoAvaliador');
    const habilitado = configuracao.get('sistemaSugestoes.habilitado') || false;

    const canalMencao = canalSugestao ? `<#${canalSugestao}>` : '`Não configurado`';
    const cargoMencao = cargoAvaliador ? `<@&${cargoAvaliador}>` : '`Não configurado`';
    const statusTexto = habilitado ? `${Emojis.get('ligado')} Habilitado` : `${Emojis.get('desligado')} Desabilitado`;

    const podeHabilitar = canalSugestao && cargoAvaliador;

    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("sugestao_config_canal")
            .setLabel('Configurar Canal')
            .setEmoji(`${Emojis.get('logss')}`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("sugestao_config_cargo")
            .setLabel('Cargo Avaliador')
            .setEmoji(`${Emojis.get('cargovery')}`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("sugestao_toggle")
            .setLabel(habilitado ? 'Desabilitar Sugestão' : 'Habilitar Sugestão')
            .setEmoji(habilitado ? `${Emojis.get('desligado')}` : `${Emojis.get('ligado')}`)
            .setStyle(habilitado ? 4 : 3)
            .setDisabled(!podeHabilitar && !habilitado)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltarautomaticos")
            .setLabel('Voltar')
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Ações Automáticas > Sistema de Sugestões` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get('sucesso')} Sistema de Sugestões` },
        { type: 10, content: `Configure o sistema de sugestões do seu servidor.` },
        { type: 14 },
        { type: 10, content: `> **Status:** ${statusTexto}\n> **Canal:** ${canalMencao}\n> **Cargo Avaliador:** ${cargoMencao}` },
        { type: 14 },
        { type: 10, content: `-# Configure o canal e o cargo para poder habilitar o sistema.` }
    ).with({ components: [rowBotoes, rowVoltar], flags: [64] });

    if (interaction.message == undefined) interaction.reply(containerContent);
    else interaction.update(containerContent);
}

async function PaginaConfigurarCanal(interaction) {
    const rowCanal = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId("sugestao_select_canal")
            .setPlaceholder('Selecione o canal de sugestões...')
            .setChannelTypes(ChannelType.GuildText)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("sugestao_voltar_painel")
            .setLabel('Voltar')
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Sugestões > Configurar Canal` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get('logss')} Configurar Canal de Sugestões` },
        { type: 10, content: `Selecione o canal onde as sugestões serão enviadas.` }
    ).with({ components: [rowCanal, rowVoltar], flags: [64] });

    interaction.update(containerContent);
}

async function PaginaConfigurarCargo(interaction) {
    const rowCargo = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
            .setCustomId("sugestao_select_cargo")
            .setPlaceholder('Selecione o cargo avaliador...')
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("sugestao_voltar_painel")
            .setLabel('Voltar')
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Sugestões > Cargo Avaliador` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get('cargovery')} Configurar Cargo Avaliador` },
        { type: 10, content: `Selecione o cargo que poderá gerenciar as sugestões.` }
    ).with({ components: [rowCargo, rowVoltar], flags: [64] });

    interaction.update(containerContent);
}

async function ToggleSugestoes(interaction, client) {
    const habilitado = configuracao.get('sistemaSugestoes.habilitado') || false;
    const canalSugestao = configuracao.get('sistemaSugestoes.canal');
    const cargoAvaliador = configuracao.get('sistemaSugestoes.cargoAvaliador');

    if (!habilitado && (!canalSugestao || !cargoAvaliador)) {
        return interaction.reply({ 
            content: `${Emojis.get('negative')} | Configure o canal e o cargo avaliador antes de habilitar!`, 
            ephemeral: true 
        });
    }

    configuracao.set('sistemaSugestoes.habilitado', !habilitado);
    
    await PainelSistemaSugestoes(interaction, client);
}

function criarContainerSugestao(sugestaoData, disabled = false) {
    const { id, autor, autorAvatar, conteudo, votosPositivos, votosNegativos, status, resultado } = sugestaoData;
    
    const positivos = votosPositivos?.length || 0;
    const negativos = votosNegativos?.length || 0;

    let statusTexto = '';
    let statusEmoji = '';
    let corBotaoResultado = 2;
    
    if (status === 'aprovada') {
        statusTexto = 'Sugestão Aprovada';
        statusEmoji = Emojis.get('checker');
        corBotaoResultado = 3;
    } else if (status === 'reprovada') {
        statusTexto = 'Sugestão Reprovada';
        statusEmoji = Emojis.get('negative');
        corBotaoResultado = 4;
    }

    const components = [];

    if (disabled && status !== 'pendente') {
        const rowResultado = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`sug_resultado_${id}`)
                .setLabel(statusTexto)
                .setEmoji(statusEmoji)
                .setStyle(corBotaoResultado)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`sug_votar_pos_${id}`)
                .setLabel(`${positivos}`)
                .setEmoji(`${Emojis.get('checker')}`)
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`sug_votar_neg_${id}`)
                .setLabel(`${negativos}`)
                .setEmoji(`${Emojis.get('negative')}`)
                .setStyle(4)
                .setDisabled(true)
        );
        components.push(rowResultado);
    } else {
        const rowBotoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`sug_votar_pos_${id}`)
                .setLabel(`${positivos}`)
                .setEmoji(`${Emojis.get('checker')}`)
                .setStyle(3),
            new ButtonBuilder()
                .setCustomId(`sug_votar_neg_${id}`)
                .setLabel(`${negativos}`)
                .setEmoji(`${Emojis.get('negative')}`)
                .setStyle(4),
            new ButtonBuilder()
                .setCustomId(`sug_gerenciar_${id}`)
                .setEmoji(`${Emojis.get('_settings_emoji')}`)
                .setStyle(2)
        );
        components.push(rowBotoes);
    }

    const conteudoFormatado = `\`\`\`\n${conteudo}\n\`\`\``;

    const container = res.main(
        { type: 10, content: `-# Discussão da sugestão de ${autor}` },
        { type: 14 },
        { 
            type: 10, 
            content: `### ${autor}\n${conteudoFormatado}`
        }
    ).with({ components });

    return container;
}

async function ProcessarSugestao(message, client) {
    const canalSugestao = configuracao.get('sistemaSugestoes.canal');
    const cargoAvaliador = configuracao.get('sistemaSugestoes.cargoAvaliador');
    const habilitado = configuracao.get('sistemaSugestoes.habilitado');

    if (!habilitado || message.channel.id !== canalSugestao) return false;
    
    if (message.author.bot) return false;

    const userId = message.author.id;
    const agora = Date.now();
    const cooldownTempo = 2 * 60 * 1000;

    if (sugestoesCooldown.has(userId)) {
        const ultimaSugestao = sugestoesCooldown.get(userId);
        const tempoRestante = cooldownTempo - (agora - ultimaSugestao);
        
        if (tempoRestante > 0) {
            await message.delete().catch(() => {});
            const tempoSegundos = Math.ceil(tempoRestante / 1000);
            const aviso = await message.channel.send({
                content: `${Emojis.get('negative')} | ${message.author}, você está enviando sugestões muito rápido! Espere **${tempoSegundos} segundos**.`
            });
            setTimeout(() => aviso.delete().catch(() => {}), 5000);
            return true;
        }
    }

    sugestoesCooldown.set(userId, agora);

    try {
        const conteudo = message.content;
        const sugestaoId = gerarIdSugestao();

        await message.delete().catch(() => {});

        const sugestaoData = {
            id: sugestaoId,
            autor: message.author.username,
            autorId: message.author.id,
            autorAvatar: message.author.displayAvatarURL({ dynamic: true }),
            conteudo: conteudo,
            votosPositivos: [],
            votosNegativos: [],
            status: 'pendente',
            criadoEm: Date.now(),
            canalId: message.channel.id,
            mensagemId: null
        };

        const container = criarContainerSugestao(sugestaoData);

        const msg = await message.channel.send(container);
        
        sugestaoData.mensagemId = msg.id;
        sugestao.set(sugestaoId, sugestaoData);

        const thread = await msg.startThread({
            name: `Discussão da sugestão de ${message.author.username}`,
            autoArchiveDuration: 1440
        });

        const rowSistema = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('msg_sistema_criado')
                .setLabel('Mensagem do Sistema')
                .setStyle(2)
                .setDisabled(true)
        );

        await thread.send({
            content: `${Emojis.get('sucesso')} <@&${cargoAvaliador}> <@${message.author.id}>, este tópico foi criado para discutir a sugestão.`,
            components: [rowSistema]
        });

        return true;
    } catch (error) {
        console.error('Erro ao processar sugestão:', error);
        return false;
    }
}

async function VotarSugestao(interaction, sugestaoId, tipo) {
    const sugestaoData = sugestao.get(sugestaoId);
    
    if (!sugestaoData) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Sugestão não encontrada!`, ephemeral: true });
    }

    if (sugestaoData.status !== 'pendente') {
        return interaction.reply({ content: `${Emojis.get('negative')} | Esta sugestão já foi finalizada!`, ephemeral: true });
    }

    const userId = interaction.user.id;
    let votosPositivos = sugestaoData.votosPositivos || [];
    let votosNegativos = sugestaoData.votosNegativos || [];

    votosPositivos = votosPositivos.filter(id => id !== userId);
    votosNegativos = votosNegativos.filter(id => id !== userId);

    if (tipo === 'positivo') {
        votosPositivos.push(userId);
    } else {
        votosNegativos.push(userId);
    }

    sugestaoData.votosPositivos = votosPositivos;
    sugestaoData.votosNegativos = votosNegativos;
    sugestao.set(sugestaoId, sugestaoData);

    const container = criarContainerSugestao(sugestaoData);
    await interaction.update(container);
}

async function GerenciarSugestao(interaction, sugestaoId) {
    const cargoAvaliador = configuracao.get('sistemaSugestoes.cargoAvaliador');
    
    if (!interaction.member.roles.cache.has(cargoAvaliador)) {
        return interaction.reply({ 
            content: `${Emojis.get('negative')} | Apenas membros com o cargo de avaliador podem gerenciar sugestões!`, 
            ephemeral: true 
        });
    }

    const sugestaoData = sugestao.get(sugestaoId);
    
    if (!sugestaoData) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Sugestão não encontrada!`, ephemeral: true });
    }

    if (sugestaoData.status !== 'pendente') {
        return interaction.reply({ content: `${Emojis.get('negative')} | Esta sugestão já foi finalizada!`, ephemeral: true });
    }

    const positivos = sugestaoData.votosPositivos?.length || 0;
    const negativos = sugestaoData.votosNegativos?.length || 0;

    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`sug_aprovar_${sugestaoId}`)
            .setLabel('Aprovar Sugestão')
            .setEmoji(`${Emojis.get('checker')}`)
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId(`sug_reprovar_${sugestaoId}`)
            .setLabel('Reprovar Sugestão')
            .setEmoji(`${Emojis.get('negative')}`)
            .setStyle(4)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`sug_cancelar_gerenciar`)
            .setLabel('Cancelar')
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Gerenciar Sugestão` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get('_settings_emoji')} Gerenciar Sugestão` },
        { type: 10, content: `**Autor:** ${sugestaoData.autor}\n**Votos:** ${Emojis.get('checker')} ${positivos} | ${Emojis.get('negative')} ${negativos}` },
        { type: 14 },
        { type: 10, content: `> ${sugestaoData.conteudo.substring(0, 200)}${sugestaoData.conteudo.length > 200 ? '...' : ''}` },
        { type: 14 },
        { type: 10, content: `-# Escolha uma ação para esta sugestão.` }
    ).with({ components: [rowBotoes, rowVoltar], flags: [64] });

    await interaction.reply(containerContent);
}

async function AprovarSugestao(interaction, sugestaoId) {
    const cargoAvaliador = configuracao.get('sistemaSugestoes.cargoAvaliador');
    
    if (!interaction.member.roles.cache.has(cargoAvaliador)) {
        return interaction.reply({ 
            content: `${Emojis.get('negative')} | Sem permissão!`, 
            ephemeral: true 
        });
    }

    const sugestaoData = sugestao.get(sugestaoId);
    
    if (!sugestaoData) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Sugestão não encontrada!`, ephemeral: true });
    }

    sugestaoData.status = 'aprovada';
    sugestaoData.avaliadoPor = interaction.user.id;
    sugestaoData.avaliadoEm = Date.now();
    sugestao.set(sugestaoId, sugestaoData);

    try {
        const canal = await interaction.client.channels.fetch(sugestaoData.canalId);
        const mensagem = await canal.messages.fetch(sugestaoData.mensagemId);
        const container = criarContainerSugestao(sugestaoData, true);
        await mensagem.edit(container);

        if (mensagem.hasThread) {
            const thread = await mensagem.thread.fetch();
            
            const rowSistema = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('msg_sistema_aprovada')
                    .setLabel('Mensagem do Sistema')
                    .setStyle(2)
                    .setDisabled(true)
            );

            await thread.send({
                content: `${Emojis.get('checker')} Sugestão aprovada pelo moderador <@${interaction.user.id}>.`,
                components: [rowSistema]
            });
            await thread.setLocked(true, 'Sugestão aprovada');
            await thread.setArchived(true, 'Sugestão aprovada');
        }
    } catch (e) {
        console.error('Erro ao editar mensagem:', e);
    }

    const containerSucesso = res.main(
        { type: 10, content: `### ${Emojis.get('checker')} Sugestão Aprovada!` },
        { type: 10, content: `A sugestão de **${sugestaoData.autor}** foi aprovada com sucesso.` }
    ).with({ flags: [64] });

    await interaction.update(containerSucesso);
}

async function ReprovarSugestao(interaction, sugestaoId) {
    const cargoAvaliador = configuracao.get('sistemaSugestoes.cargoAvaliador');
    
    if (!interaction.member.roles.cache.has(cargoAvaliador)) {
        return interaction.reply({ 
            content: `${Emojis.get('negative')} | Sem permissão!`, 
            ephemeral: true 
        });
    }

    const sugestaoData = sugestao.get(sugestaoId);
    
    if (!sugestaoData) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Sugestão não encontrada!`, ephemeral: true });
    }

    sugestaoData.status = 'reprovada';
    sugestaoData.avaliadoPor = interaction.user.id;
    sugestaoData.avaliadoEm = Date.now();
    sugestao.set(sugestaoId, sugestaoData);

    try {
        const canal = await interaction.client.channels.fetch(sugestaoData.canalId);
        const mensagem = await canal.messages.fetch(sugestaoData.mensagemId);
        const container = criarContainerSugestao(sugestaoData, true);
        await mensagem.edit(container);

        if (mensagem.hasThread) {
            const thread = await mensagem.thread.fetch();
            
            const rowSistema = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('msg_sistema_reprovada')
                    .setLabel('Mensagem do Sistema')
                    .setStyle(2)
                    .setDisabled(true)
            );

            await thread.send({
                content: `${Emojis.get('negative')} Sugestão reprovada pelo moderador <@${interaction.user.id}>.`,
                components: [rowSistema]
            });
            await thread.setLocked(true, 'Sugestão reprovada');
            await thread.setArchived(true, 'Sugestão reprovada');
        }
    } catch (e) {
        console.error('Erro ao editar mensagem:', e);
    }

    const containerSucesso = res.main(
        { type: 10, content: `### ${Emojis.get('negative')} Sugestão Reprovada!` },
        { type: 10, content: `A sugestão de **${sugestaoData.autor}** foi reprovada.` }
    ).with({ flags: [64] });

    await interaction.update(containerSucesso);
}

module.exports = {
    PainelSistemaSugestoes,
    PaginaConfigurarCanal,
    PaginaConfigurarCargo,
    ToggleSugestoes,
    ProcessarSugestao,
    VotarSugestao,
    GerenciarSugestao,
    AprovarSugestao,
    ReprovarSugestao,
    sugestoesCooldown,
    gerarIdSugestao
};
