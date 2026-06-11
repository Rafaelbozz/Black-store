const { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { res } = require("../res");
const { sorteios } = require("../DataBaseJson");
const emojis = require("../DataBaseJson/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

function getEstatisticas() {
    const allSorteios = sorteios.valueArray() || [];
    const ativos = allSorteios.filter(s => s.status === "ativo").length;
    const realizados = allSorteios.filter(s => s.status === "finalizado").length;
    const participacoes = allSorteios.reduce((acc, s) => acc + (s.participantes?.length || 0), 0);
    return { ativos, realizados, participacoes };
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} dia${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
}

async function PainelSorteios(interaction, client) {
    const stats = getEstatisticas();
    const rowBotoes = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("criar_sorteio").setLabel('Realizar sorteio').setEmoji("<:presentes:1456162063255601162>").setStyle(3),
            new ButtonBuilder().setCustomId("gerenciar_sorteios").setLabel('Gerenciar sorteios').setEmoji(`${Emojis.get('_settings_emoji')}`).setDisabled(true).setStyle(2)
        );
    const rowVoltar = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId("voltar00").setLabel('Voltar').setEmoji(`1178068047202893869`).setStyle(2));

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Sorteios` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get('_star_emoji')} Giveaway` },
        { type: 10, content: `Gerencie todos os sorteios do seu servidor de forma intuitiva.` },
        { type: 14 },
        { type: 10, content: `> **Sorteios ativos**\n> ${Emojis.get('ligado')} \`${stats.ativos}x Ativos\`` },
        { type: 14 },
        { type: 10, content: `> **Sorteios realizados**\n> ${Emojis.get('_star_emoji')} \`${stats.realizados}x Realizados\`` },
        { type: 14 },
        { type: 10, content: `> **Participações totais**\n> ${Emojis.get('_people_emoji')} \`${stats.participacoes}x Usuários\`` }
    ).with({ components: [rowBotoes, rowVoltar], flags: [64] });

    if (interaction.message == undefined) interaction.reply(containerContent);
    else interaction.update(containerContent);
}

async function ModalCriarSorteio(interaction) {
    const modal = new ModalBuilder().setCustomId('modal_criar_sorteio').setTitle('🎁 Criar Novo Sorteio - Informações Básicas');
    const tituloInput = new TextInputBuilder().setCustomId('sorteio_titulo').setLabel('Título do Sorteio').setPlaceholder('Ex: Sorteio de 1000 Robux!').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100);
    const descricaoInput = new TextInputBuilder().setCustomId('sorteio_descricao').setLabel('Descrição do Sorteio').setPlaceholder('Descreva o que está sendo sorteado...').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000);
    const vencedoresInput = new TextInputBuilder().setCustomId('sorteio_vencedores').setLabel('Número de Vencedores').setPlaceholder('Ex: 1').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(2);
    modal.addComponents(
        new ActionRowBuilder().addComponents(tituloInput),
        new ActionRowBuilder().addComponents(descricaoInput),
        new ActionRowBuilder().addComponents(vencedoresInput)
    );
    await interaction.showModal(modal);
}

async function PaginaSetarTempo(interaction, sorteioId) {
    const sorteioData = sorteios.get(sorteioId);
    const rowBotoes = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`sorteio_tempo_manual_${sorteioId}`).setLabel('Setar manualmente').setEmoji(`${Emojis.get('_lapis_emoji')}`).setStyle(1),
            new ButtonBuilder().setCustomId(`sorteio_cancelar_${sorteioId}`).setLabel('Cancelar').setEmoji(`${Emojis.get('negative')}`).setStyle(4)
        );
    const containerContent = res.main(
        { type: 10, content: `-# Painel > Criar Sorteio > Definir Tempo` },
        { type: 14 },
        { type: 10, content: `${Emojis.get('_star_emoji')} **@${interaction.user.username}**` },
        { type: 10, content: `> Setar horário de finalização` },
        { type: 14 },
        { type: 10, content: `### ${sorteioData?.titulo || 'Sorteio'}` },
        { type: 10, content: `-# ${sorteioData?.descricao?.substring(0, 50) || ''}...` },
        { type: 14 },
        { type: 10, content: `> **Vencedores:** \`${sorteioData?.vencedores || 1}x\`` },
        { type: 10, content: `-# Etapa 2/5 - Seleção de Duração • Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}` },
        { type: 14 },
        { type: 1, components: [{ type: 3, custom_id: `sorteio_select_tempo_${sorteioId}`, placeholder: "Clique aqui para escolher um...", options: [
            { label: "1 minuto", description: "Teste rápido", value: "1m", emoji: { name: "⏱️" } },
            { label: "5 minutos", description: "Teste", value: "5m", emoji: { name: "⏱️" } },
            { label: "10 minutos", description: "Muito rápido", value: "10m", emoji: { name: "⏱️" } },
            { label: "15 minutos", description: "Rápido", value: "15m", emoji: { name: "⏱️" } },
            { label: "30 minutos", description: "Meia hora", value: "30m", emoji: { name: "⏱️" } },
            { label: "1 hora", description: "Uma hora", value: "1h", emoji: { name: "🕐" } },
            { label: "2 horas", description: "Duas horas", value: "2h", emoji: { name: "🕐" } },
            { label: "6 horas", description: "Seis horas", value: "6h", emoji: { name: "🕐" } },
            { label: "12 horas", description: "Meio dia", value: "12h", emoji: { name: "🕐" } },
            { label: "1 dia", description: "24 horas", value: "1d", emoji: { name: "📅" } },
            { label: "3 dias", description: "72 horas", value: "3d", emoji: { name: "📅" } },
            { label: "7 dias", description: "Uma semana", value: "7d", emoji: { name: "📅" } },
            { label: "14 dias", description: "Duas semanas", value: "14d", emoji: { name: "📅" } },
            { label: "30 dias", description: "Um mês", value: "30d", emoji: { name: "📅" } }
        ]}]}
    ).with({ components: [rowBotoes], flags: [64] });
    if (interaction.message == undefined) interaction.reply(containerContent);
    else interaction.update(containerContent);
}

async function PaginaEscolherCanal(interaction, sorteioId) {
    const sorteioData = sorteios.get(sorteioId);
    const duracao = formatDuration(sorteioData?.duracao || 0);
    const rowCanal = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder().setCustomId(`sorteio_select_canal_${sorteioId}`).setPlaceholder('Clique aqui para selecionar o canal...').setChannelTypes(ChannelType.GuildText)
    );
    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sorteio_voltar_tempo_${sorteioId}`).setLabel('Voltar').setEmoji(`${Emojis.get('_back_emoji')}`).setStyle(2),
        new ButtonBuilder().setCustomId(`sorteio_cancelar_${sorteioId}`).setLabel('Cancelar').setEmoji(`${Emojis.get('negative')}`).setStyle(4)
    );
    const containerContent = res.main(
        { type: 10, content: `-# Painel > Criar Sorteio > Escolher Canal` },
        { type: 14 },
        { type: 10, content: `### # Escolher canal do sorteio` },
        { type: 14 },
        { type: 10, content: `### ${sorteioData?.titulo || 'Sorteio'}` },
        { type: 10, content: `-# ${sorteioData?.descricao?.substring(0, 50) || ''}...` },
        { type: 14 },
        { type: 10, content: `> **Vencedores:** \`${sorteioData?.vencedores || 1}x\`\n> **Duração:** \`${duracao}\`` },
        { type: 10, content: `-# Etapa 3/5 - Seleção de Canal • Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}` }
    ).with({ components: [rowCanal, rowBotoes], flags: [64] });
    if (interaction.message == undefined) interaction.reply(containerContent);
    else interaction.update(containerContent);
}

async function PaginaGerenciarCargos(interaction, sorteioId) {
    const sorteioData = sorteios.get(sorteioId);
    const duracao = formatDuration(sorteioData?.duracao || 0);
    const canal = sorteioData?.canalId ? `<#${sorteioData.canalId}>` : 'Não definido';
    const rowCargosPermitidos = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId(`sorteio_cargos_permitidos_${sorteioId}`).setPlaceholder('✅ Clique aqui para selecionar cargos permitidos...').setMinValues(0).setMaxValues(10)
    );
    const rowCargosBloqueados = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId(`sorteio_cargos_bloqueados_${sorteioId}`).setPlaceholder('❌ Clique aqui para selecionar cargos não permitidos...').setMinValues(0).setMaxValues(10)
    );
    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sorteio_finalizar_${sorteioId}`).setLabel('Finalizar').setEmoji("<:presentes:1456162063255601162>").setStyle(3),
        new ButtonBuilder().setCustomId(`sorteio_voltar_canal_${sorteioId}`).setLabel('Voltar').setEmoji(`${Emojis.get('_back_emoji')}`).setStyle(2),
        new ButtonBuilder().setCustomId(`sorteio_cancelar_${sorteioId}`).setLabel('Cancelar').setEmoji(`${Emojis.get('negative')}`).setStyle(4)
    );
    const containerContent = res.main(
        { type: 10, content: `-# Painel > Criar Sorteio > Gerenciar Cargos` },
        { type: 14 },
        { type: 10, content: `### @ Gerenciar permissões de cargos` },
        { type: 14 },
        { type: 10, content: `### ${sorteioData?.titulo || 'Sorteio'}` },
        { type: 10, content: `-# ${sorteioData?.descricao?.substring(0, 50) || ''}...` },
        { type: 14 },
        { type: 10, content: `> **Canal:** ${canal}\n> **Vencedores:** \`${sorteioData?.vencedores || 1}x\`\n> **Duração:** \`${duracao}\`` },
        { type: 14 },
        { type: 10, content: `${Emojis.get('checker')} **Cargos permitidos:** Apenas usuários com estes cargos **podem participar** do sorteio.` },
        { type: 10, content: `${Emojis.get('negative')} **Cargos bloqueados:** Usuários com este(s) cargo(s) **NÃO podem** participar do sorteio.` },
        { type: 10, content: `⚠️ **Opcional:** Se não quiser gerenciar os cargos, apenas **finalize** o gerenciamento do sorteio pelo botão.` },
        { type: 14 },
        { type: 10, content: `-# Etapa 4/5 - Gerenciando cargos • Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}` }
    ).with({ components: [rowCargosPermitidos, rowCargosBloqueados, rowBotoes], flags: [64] });
    if (interaction.message == undefined) interaction.reply(containerContent);
    else interaction.update(containerContent);
}

function criarEmbedSorteio(sorteioData, finalizado = false, vencedores = []) {
    const participantes = sorteioData.participantes || [];
    const embed = new EmbedBuilder()
        .setTitle(`${Emojis.get('sorteio')} ${sorteioData.titulo}`)
        .setDescription(sorteioData.descricao)
        .setColor(finalizado ? 0x2f3136 : 0x5865F2)
        .addFields(
            { name: `${Emojis.get('tempo')} Sorteio Acaba Em`, value: finalizado ? 'Sorteio encerrado!' : `<t:${Math.floor(sorteioData.finalizaEm / 1000)}:R>`, inline: true },
            { name: `${Emojis.get('ganhador')} Vencedores`, value: `${sorteioData.vencedores}x`, inline: true },
            { name: `${Emojis.get('usuariospae')} Participantes`, value: `${participantes.length}x`, inline: true }
        )
        .setFooter({ text: `ID: ${sorteioData.id}` })
        .setTimestamp();
    
    if (finalizado && vencedores.length > 0) {
        embed.addFields({ name: `${Emojis.get('_flag_emoji')} Ganhadores`, value: vencedores.map(v => `<@${v}>`).join(', ') });
    }
    return embed;
}

async function EnviarMensagemSorteio(interaction, sorteioId, client) {
    const sorteioData = sorteios.get(sorteioId);
    if (!sorteioData || !sorteioData.canalId) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Erro ao criar sorteio!`, ephemeral: true });
    }
    const canal = await client.channels.fetch(sorteioData.canalId).catch(() => null);
    if (!canal) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Canal não encontrado!`, ephemeral: true });
    }

    const finalizaEm = Date.now() + sorteioData.duracao;
    sorteios.set(`${sorteioId}.finalizaEm`, finalizaEm);
    sorteios.set(`${sorteioId}.status`, "ativo");

    const containerSucesso = res.main(
        { type: 10, content: `-# Painel > Sorteio Criado` },
        { type: 14 },
        { type: 10, content: `${Emojis.get('checker')} **Sorteio postado com sucesso!**` },
        { type: 14 },
        { type: 10, content: `> O sorteio foi enviado com êxito em <#${canal.id}>` }
    ).with({ components: [], flags: [64] });

    await interaction.update(containerSucesso);

    const sorteioAtualizado = sorteios.get(sorteioId);
    const embed = criarEmbedSorteio(sorteioAtualizado);

    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sorteio_participar_${sorteioId}`).setLabel('Participar').setEmoji("1387981763522854982").setStyle(1),
        new ButtonBuilder().setCustomId(`sorteio_lista_${sorteioId}`).setLabel("Lista Participantes").setEmoji("1384035194020958268").setStyle(2)
    );

    const msg = await canal.send({ embeds: [embed], components: [rowBotoes] });
    
    sorteios.set(`${sorteioId}.mensagemId`, msg.id);

    agendarFinalizacao(sorteioId, sorteioData.duracao, client);
}

function agendarFinalizacao(sorteioId, duracao, client) {
    setTimeout(async () => {
        await finalizarSorteio(sorteioId, client);
    }, duracao);
}

async function finalizarSorteio(sorteioId, client) {
    const sorteioData = sorteios.get(sorteioId);
    if (!sorteioData || sorteioData.status !== "ativo") return;

    const participantes = sorteioData.participantes || [];
    const numVencedores = Math.min(sorteioData.vencedores, participantes.length);
    
    let vencedores = [];
    if (participantes.length > 0) {
        const participantesCopia = [...participantes];
        for (let i = 0; i < numVencedores; i++) {
            const index = Math.floor(Math.random() * participantesCopia.length);
            vencedores.push(participantesCopia.splice(index, 1)[0]);
        }
    }

    sorteios.set(`${sorteioId}.status`, "finalizado");
    sorteios.set(`${sorteioId}.vencedoresIds`, vencedores);

    const canal = await client.channels.fetch(sorteioData.canalId).catch(() => null);
    if (!canal) return;

    const msg = await canal.messages.fetch(sorteioData.mensagemId).catch(() => null);
    if (msg) {
        const embed = criarEmbedSorteio({ ...sorteioData, status: "finalizado" }, true, vencedores);
        const rowBotoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`sorteio_participar_${sorteioId}`).setLabel('Participar').setEmoji("1387981763522854982").setStyle(2).setDisabled(true),
            new ButtonBuilder().setCustomId(`sorteio_reroll_${sorteioId}`).setLabel('Reroll').setEmoji("1384035207598051431").setStyle(1)
        );
        await msg.edit({ embeds: [embed], components: [rowBotoes] });
    }

    if (vencedores.length > 0) {
        const mencoes = vencedores.map(v => `<@${v}>`).join(', ');
        await canal.send(`${Emojis.get('sorteio')} Parabéns! ${mencoes} Vocês ganharam o sorteio de **${sorteioData.titulo}**!`);
    } else {
        await canal.send(`😢 O sorteio **${sorteioData.titulo}** foi encerrado sem participantes!`);
    }
}

async function rerollSorteio(interaction, sorteioId, client) {
    const sorteioData = sorteios.get(sorteioId);
    if (!sorteioData || sorteioData.status !== "finalizado") {
        return interaction.reply({ content: `${Emojis.get('negative')} | Este sorteio não pode ser rerollado!`, ephemeral: true });
    }

    const participantes = sorteioData.participantes || [];
    const numVencedores = Math.min(sorteioData.vencedores, participantes.length);
    
    let vencedores = [];
    if (participantes.length > 0) {
        const participantesCopia = [...participantes];
        for (let i = 0; i < numVencedores; i++) {
            const index = Math.floor(Math.random() * participantesCopia.length);
            vencedores.push(participantesCopia.splice(index, 1)[0]);
        }
    }

    sorteios.set(`${sorteioId}.vencedoresIds`, vencedores);

    const canal = await client.channels.fetch(sorteioData.canalId).catch(() => null);
    if (!canal) return;

    const msg = await canal.messages.fetch(sorteioData.mensagemId).catch(() => null);
    if (msg) {
        const embed = criarEmbedSorteio({ ...sorteioData, status: "finalizado" }, true, vencedores);
        const rowBotoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`sorteio_participar_${sorteioId}`).setLabel('Participar').setEmoji("1387981763522854982").setStyle(2).setDisabled(true),
            new ButtonBuilder().setCustomId(`sorteio_reroll_${sorteioId}`).setLabel('Reroll').setEmoji("1384035207598051431").setStyle(1)
        );
        await msg.edit({ embeds: [embed], components: [rowBotoes] });
    }

    if (vencedores.length > 0) {
        const mencoes = vencedores.map(v => `<@${v}>`).join(', ');
        await canal.send(`${Emojis.get('sorteio')} Reroll! Parabéns! ${mencoes} Vocês ganharam o sorteio de **${sorteioData.titulo}**!`);
    }

    await interaction.reply({ content: `${Emojis.get('checker')} | Reroll realizado com sucesso!`, ephemeral: true });
}

async function gerarListaParticipantes(interaction, sorteioId, client) {
    const sorteioData = sorteios.get(sorteioId);
    if (!sorteioData) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Sorteio não encontrado!`, ephemeral: true });
    }

    const participantes = sorteioData.participantes || [];
    if (participantes.length === 0) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Nenhum participante neste sorteio ainda!`, ephemeral: true });
    }

    let lista = `Lista de Participantes - ${sorteioData.titulo}\n`;
    lista += `Total: ${participantes.length} participantes\n`;
    lista += `${'='.repeat(50)}\n\n`;

    for (let i = 0; i < participantes.length; i++) {
        const user = await client.users.fetch(participantes[i]).catch(() => null);
        const username = user ? `${user.username} (${user.id})` : participantes[i];
        lista += `${i + 1}. ${username}\n`;
    }

    const buffer = Buffer.from(lista, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `participantes_${sorteioId}.txt` });

    await interaction.reply({ content: `📋 Lista de participantes do sorteio **${sorteioData.titulo}**:`, files: [attachment], ephemeral: true });
}

async function atualizarEmbedSorteio(sorteioId, client) {
    const sorteioData = sorteios.get(sorteioId);
    if (!sorteioData || sorteioData.status !== "ativo") return;

    const canal = await client.channels.fetch(sorteioData.canalId).catch(() => null);
    if (!canal) return;

    const msg = await canal.messages.fetch(sorteioData.mensagemId).catch(() => null);
    if (msg) {
        const embed = criarEmbedSorteio(sorteioData);
        await msg.edit({ embeds: [embed] });
    }
}

async function ModalTempoPersonalizado(interaction, sorteioId) {
    const modal = new ModalBuilder().setCustomId(`modal_tempo_personalizado_${sorteioId}`).setTitle('Configurar Tempo Personalizado');
    const tempoInput = new TextInputBuilder().setCustomId('tempo_personalizado').setLabel('Duração Personalizada').setPlaceholder('Ex: 1d 2h 30m ou 5h 15m ou 90m').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20);
    modal.addComponents(new ActionRowBuilder().addComponents(tempoInput));
    await interaction.showModal(modal);
}

function parseTime(timeStr) {
    const regex = /(\d+)\s*(m|h|d)/gi;
    let totalMs = 0;
    let match;
    while ((match = regex.exec(timeStr)) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        switch (unit) {
            case 'm': totalMs += value * 60 * 1000; break;
            case 'h': totalMs += value * 60 * 60 * 1000; break;
            case 'd': totalMs += value * 24 * 60 * 60 * 1000; break;
        }
    }
    return totalMs;
}

function gerarIdSorteio() {
    return `sorteio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function PaginaGerenciarSorteios(interaction, client) {
    const allSorteios = sorteios.valueArray() || [];
    const sorteiosAtivos = allSorteios.filter(s => s.status === "ativo");

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("sistemasorteios").setLabel('Voltar').setEmoji(`${Emojis.get('_back_emoji')}`).setStyle(2)
    );

    if (sorteiosAtivos.length === 0) {
        const containerContent = res.main(
            { type: 10, content: `-# Painel > Gerenciamento de Sorteios` },
            { type: 14 },
            { type: 10, content: `${Emojis.get('negative')} | Nenhum sorteio ativo no momento.` }
        ).with({ components: [rowVoltar], flags: [64] });
        return interaction.update(containerContent);
    }

    const options = sorteiosAtivos.slice(0, 25).map(s => ({
        label: s.titulo.substring(0, 100),
        description: `${s.participantes?.length || 0} participantes`,
        value: s.id,
        emoji: { name: "🎉" }
    }));

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Gerenciamento de Sorteios` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get('_settings_emoji')} Gerenciamento de giveaway's` },
        { type: 10, content: `Selecione um dos \`${sorteiosAtivos.length}x\` sorteios ativos para gerenciar.` },
        { type: 10, content: `-# Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}` },
        { type: 14 },
        { type: 1, components: [{ type: 3, custom_id: "gerenciar_sorteio_select", placeholder: "Selecione um sorteio para gerenciar", options }] }
    ).with({ components: [rowVoltar], flags: [64] });

    interaction.update(containerContent);
}

async function PaginaGerenciarSorteioEspecifico(interaction, sorteioId, client) {
    const sorteioData = sorteios.get(sorteioId);
    if (!sorteioData) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Sorteio não encontrado!`, ephemeral: true });
    }

    const criador = await client.users.fetch(sorteioData.criador).catch(() => null);
    const participantes = sorteioData.participantes || [];
    const inicializacao = new Date(sorteioData.criadoEm);
    const finalizacao = new Date(sorteioData.finalizaEm);

    const rowBotoes1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`gerenciar_forcar_${sorteioId}`).setLabel('Forçar finalização').setEmoji("⚡").setStyle(3),
        new ButtonBuilder().setCustomId(`gerenciar_addtempo_${sorteioId}`).setLabel('Adicionar tempo').setEmoji("⏰").setStyle(1),
        new ButtonBuilder().setCustomId(`gerenciar_descontinuar_${sorteioId}`).setLabel('Descontinuar').setEmoji(`${Emojis.get('negative')}`).setStyle(4)
    );

    const rowBotoes2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`gerenciar_verparticipantes_${sorteioId}`).setLabel('Ver participantes').setEmoji("📋").setStyle(2),
        new ButtonBuilder().setCustomId("gerenciar_sorteios").setLabel('Voltar').setEmoji(`${Emojis.get('_back_emoji')}`).setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Gerenciamento > ${sorteioData.titulo}` },
        { type: 14 },
        { type: 10, content: `### ${sorteioData.titulo}` },
        { type: 10, content: `-# ${sorteioData.descricao?.substring(0, 100) || ''}` },
        { type: 14 },
        { type: 10, content: `> **Criador:** <@${sorteioData.criador}>\n> **Canal:** <#${sorteioData.canalId}>\n> **Participantes:** \`${participantes.length}x\`\n> **Vencedores:** \`${sorteioData.vencedores}x\`` },
        { type: 14 },
        { type: 10, content: `> 🆔 **ID do Sorteio**\n> -# ${sorteioId}` },
        { type: 14 },
        { type: 10, content: `> ⏰ **Inicialização**\n> -# ${inicializacao.toLocaleDateString('pt-BR')} ${inicializacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` },
        { type: 10, content: `> ⏰ **Finalização**\n> -# ${finalizacao.toLocaleDateString('pt-BR')} ${finalizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (<t:${Math.floor(sorteioData.finalizaEm / 1000)}:R>)` },
        { type: 14 },
        { type: 10, content: `-# Painel de Gerenciamento • Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}` }
    ).with({ components: [rowBotoes1, rowBotoes2], flags: [64] });

    interaction.update(containerContent);
}

async function PaginaConfirmarForcarFinalizacao(interaction, sorteioId) {
    const sorteioData = sorteios.get(sorteioId);
    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`confirmar_forcar_${sorteioId}`).setLabel('Confirmar').setEmoji("✅").setStyle(3),
        new ButtonBuilder().setCustomId(`gerenciar_sorteio_${sorteioId}`).setLabel('Cancelar').setEmoji(`${Emojis.get('negative')}`).setStyle(4)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Confirmar Forçar Finalização` },
        { type: 14 },
        { type: 10, content: `### ⚠️ Confirmar Forçar Finalização` },
        { type: 10, content: `Tem certeza que deseja forçar a finalização do sorteio **${sorteioData?.titulo}**?\n\nIsso irá sortear os vencedores imediatamente, mesmo antes do tempo acabar.` }
    ).with({ components: [rowBotoes], flags: [64] });

    interaction.update(containerContent);
}

async function PaginaConfirmarDescontinuar(interaction, sorteioId) {
    const sorteioData = sorteios.get(sorteioId);
    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`confirmar_descontinuar_${sorteioId}`).setLabel('Confirmar').setEmoji("✅").setStyle(4),
        new ButtonBuilder().setCustomId(`gerenciar_sorteio_${sorteioId}`).setLabel('Cancelar').setEmoji(`${Emojis.get('_back_emoji')}`).setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Confirmar Descontinuar Sorteio` },
        { type: 14 },
        { type: 10, content: `### ⚠️ Confirmar Descontinuar Sorteio` },
        { type: 10, content: `Tem certeza que deseja descontinuar o sorteio **${sorteioData?.titulo}**?\n\n**ATENÇÃO:** Nenhum vencedor será sorteado e o sorteio será cancelado permanentemente.` }
    ).with({ components: [rowBotoes], flags: [64] });

    interaction.update(containerContent);
}

async function ModalAdicionarTempo(interaction, sorteioId) {
    const modal = new ModalBuilder().setCustomId(`modal_addtempo_${sorteioId}`).setTitle('⏰ Adicionar Tempo ao Sorteio');
    const tempoInput = new TextInputBuilder()
        .setCustomId('tempo_adicionar')
        .setLabel('Tempo para Adicionar')
        .setPlaceholder('Ex: 30m, 1h, 2h, 1d')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(20);
    modal.addComponents(new ActionRowBuilder().addComponents(tempoInput));
    await interaction.showModal(modal);
}

async function descontinuarSorteio(interaction, sorteioId, client) {
    const sorteioData = sorteios.get(sorteioId);
    if (!sorteioData) return;

    sorteios.set(`${sorteioId}.status`, "cancelado");

    const canal = await client.channels.fetch(sorteioData.canalId).catch(() => null);
    if (canal) {
        const msg = await canal.messages.fetch(sorteioData.mensagemId).catch(() => null);
        if (msg) {
            const participantes = sorteioData.participantes || [];
            const tempoDecorrido = formatDuration(Date.now() - sorteioData.criadoEm);
            
            const embed = new EmbedBuilder()
                .setTitle(sorteioData.titulo)
                .setDescription(sorteioData.descricao)
                .setColor(0xFF0000)
                .addFields(
                    { name: '❌ Cancelado', value: `há ${tempoDecorrido}`, inline: true },
                    { name: '🏆 Vencedores', value: `${sorteioData.vencedores}x`, inline: true },
                    { name: '👥 Participantes', value: `${participantes.length}x`, inline: true }
                )
                .setFooter({ text: `teste - sorteio • Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}` });

            const rowBotoes = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`sorteio_cancelado_${sorteioId}`).setLabel('Sorteio Cancelado').setStyle(4).setDisabled(true)
            );

            await msg.edit({ embeds: [embed], components: [rowBotoes] });
        }

        await canal.send(`${Emojis.get('checker')} Sorteio cancelado com êxito.`);
    }

    await interaction.update({ content: `${Emojis.get('checker')} | Sorteio descontinuado com sucesso!`, components: [], embeds: [] });
}

async function forcarFinalizacao(interaction, sorteioId, client) {
    await interaction.update({ content: `${Emojis.get('loading')} | Finalizando sorteio...`, components: [], embeds: [] });
    await finalizarSorteio(sorteioId, client);
    await interaction.editReply({ content: `${Emojis.get('checker')} | Sorteio finalizado com sucesso!` });
}

module.exports = {
    PainelSorteios, ModalCriarSorteio, PaginaSetarTempo, PaginaEscolherCanal, PaginaGerenciarCargos,
    EnviarMensagemSorteio, ModalTempoPersonalizado, parseTime, gerarIdSorteio, formatDuration,
    rerollSorteio, gerarListaParticipantes, atualizarEmbedSorteio, finalizarSorteio, agendarFinalizacao,
    PaginaGerenciarSorteios, PaginaGerenciarSorteioEspecifico, PaginaConfirmarForcarFinalizacao,
    PaginaConfirmarDescontinuar, ModalAdicionarTempo, descontinuarSorteio, forcarFinalizacao
};
