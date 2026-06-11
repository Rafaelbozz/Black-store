const { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, ChannelSelectMenuBuilder, EmbedBuilder, ChannelType } = require("discord.js");
const { res } = require("../res");
const { configsticket, EmojisHelper } = require("../DataBaseJson");

const Emojis = EmojisHelper;

function getSaudacao() {
  const brazilTime = new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
  const hora = new Date(brazilTime).getHours();

  if (hora < 12) {
      return 'Bom dia';
  } else if (hora < 18) {
      return 'Boa tarde';
  } else {
      return 'Boa noite';
  }
}

async function PainelTickets(interaction, client) {

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_config_aparencia")
      .setLabel('Configurar Aparencia')
      .setEmoji(`1384035217550868493`)
      .setStyle(3),
    new ButtonBuilder()
      .setCustomId("ticket_config_ilusion_ai")
      .setLabel('Configurar Ilusion Ai')
      .setEmoji(`1471591800060776531`)
      .setStyle(1),
    new ButtonBuilder()
      .setCustomId("ticket_horario_atendimento")
      .setLabel('Horario de Atendimento')
      .setEmoji(`1458667975904329768`)
      .setStyle(1)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_config_funcoes")
      .setLabel('Configurar Funçoes')
      .setEmoji(`1471592235316543560`)
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId("ticket_alterar_modo")
      .setLabel('Alterar Modo')
      .setEmoji(`1471592324294250689`)
      .setDisabled(true)
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId("ticket_resetar_configs")
      .setLabel('Resetar Configuracoes')
      .setEmoji(`1178076767567757312`)
      .setStyle(4)
  );

  const rowVoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar00")
      .setLabel('Voltar')
      .setEmoji(`1178068047202893869`)
      .setStyle(2)
  );

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Sistema de Tickets` },
    { type: 14 },
    { type: 10, content: `## Sistema de Tickets\n> ${getSaudacao()} **${interaction.user.username}**! Gerencie o sistema de atendimento do seu servidor de forma completa. Configure a aparência das mensagens, defina horários de funcionamento, crie categorias de atendimento e personalize a experiência dos seus usuários.` },
    { type: 14 },
    { type: 10, content: `**Principais Funcionalidades**\n- **Configurar Aparência:** Personalize a mensagem de abertura de tickets\n- **Ilusion AI:** Sistema de IA para atendimento automático 24/7\n- **Horário de Atendimento:** Defina quando os tickets podem ser abertos\n- **Configurar Funções:** Crie categorias de atendimento personalizadas` },
    { type: 14 }
  ).with({
    components: [row1, row2, rowVoltar],
    flags: [64]
  });

  if (interaction.message == undefined) {
    interaction.reply(containerContent)
  } else {
    interaction.update(containerContent)
  }
}

async function ConfigurarAparencia(interaction, client) {

  const modoExibicao = configsticket.get('aparencia.modoExibicao') || 'embed';
  
  let aparenciaConfigurada = false;
  if (modoExibicao === 'content') {
    aparenciaConfigurada = !!configsticket.get('aparencia.mensagem');
  } else {
    aparenciaConfigurada = !!configsticket.get('aparencia.titulo') && !!configsticket.get('aparencia.descricao');
  }

  const modoNome = modoExibicao === 'content' ? 'Content (Mensagem Simples)' : modoExibicao === 'embed' ? 'Embed' : 'Container (Component v2)';

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_editar_aparencia")
      .setLabel('Editar Aparencia')
      .setEmoji(`1384035217550868493`)
      .setStyle(3),
    new ButtonBuilder()
      .setCustomId("ticket_alterar_modo_exibicao")
      .setLabel('Alterar Modo Exibiçao')
      .setEmoji(`1471592324294250689`)
      .setStyle(2)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_ver_preview")
      .setLabel('Ver Preview')
      .setEmoji(`1471615884584816732`)
      .setStyle(1),
    new ButtonBuilder()
      .setCustomId("ticket_postar_mensagem")
      .setLabel('Postar Mensagem')
      .setEmoji(`1471615984748990545`)
      .setStyle(3)
  );

  const rowVoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("painelconfigticket")
      .setLabel('Voltar')
      .setEmoji(`1178068047202893869`)
      .setStyle(2)
  );

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Sistema de Tickets > Configurar Aparencia` },
    { type: 14 },
    { type: 10, content: `## Configurar Aparencia\n\n> ${getSaudacao()} **${interaction.user.username}**! Personalize a aparência das mensagens de ticket do seu servidor.` },
    { type: 14 },
    { type: 10, content: `**Informações do Sistema**\n- Modo De Exibição: \`\`${modoNome}\`\`\n- Aparência: \`\`${aparenciaConfigurada ? '🟢 Configurada' : '🔴 Não Configurada'}\`\`` },
    { type: 14 },
    { type: 10, content: `**Principais Funcionalidades**\n- **Editar Aparência:** Personalize título, descrição e banner\n- **Alterar Modo Exibição:** Escolha entre Content, Embed ou Container\n- **Ver Preview:** Visualize como ficará a mensagem\n- **Postar Mensagem:** Envie a mensagem configurada em um canal` },
    { type: 14 }
  ).with({
    components: [row1, row2, rowVoltar],
    flags: [64]
  });

  if (interaction.message == undefined) {
    interaction.reply(containerContent)
  } else {
    interaction.update(containerContent)
  }
}

async function ConfigurarIlusionAI(interaction, client) {
  
  const statusIA = configsticket.get('ilusionAI.ativo') || false;
  const promptAtual = configsticket.get('ilusionAI.prompt') || 'Nenhum prompt configurado';

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_toggle_ia")
      .setLabel(statusIA ? 'Desativar Ilusion AI' : 'Ativar Ilusion AI')
      .setEmoji(statusIA ? `1384035206402408518` : `1384035178749497445`)
      .setStyle(statusIA ? 4 : 3),
    new ButtonBuilder()
      .setCustomId("ticket_editar_prompt")
      .setLabel('Editar Prompt')
      .setEmoji(`1471591800060776531`)
      .setStyle(2)
  );

  const rowVoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("painelconfigticket")
      .setLabel('Voltar')
      .setEmoji(`1178068047202893869`)
      .setStyle(2)
  );

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Sistema de Tickets > Configurar Ilusion AI` },
    { type: 14 },
    { type: 10, content: `## Configurar Ilusion AI\n\n> ${getSaudacao()} **${interaction.user.username}**! A Ilusion AI é um sistema de inteligência artificial avançado que automatiza o atendimento nos tickets, respondendo dúvidas frequentes, coletando informações e direcionando para a equipe quando necessário.` },
    { type: 14 },
    { type: 10, content: `**Informações do Sistema**\n- Status da IA: \`\`${statusIA ? '🟢 Ativado' : '🔴 Desativado'}\`\`\n- Modelo: \`\`Ilusion Api\`\`` },
    { type: 14 },
    { type: 10, content: `**Como Funciona**\n- A IA responde automaticamente mensagens do usuário no ticket\n- Quando um staff envia mensagem, a IA para de responder\n- Todo histórico de conversa é salvo no banco de dados\n- Personalize o comportamento através do prompt customizado` },
    { type: 14 },
    { type: 10, content: `**Prompt Atual**\n\`\`\`${promptAtual}\`\`\`` },
    { type: 14 }
  ).with({
    components: [row1, rowVoltar],
    flags: [64]
  });

  if (interaction.message == undefined) {
    interaction.reply(containerContent)
  } else {
    interaction.update(containerContent)
  }
}

async function ModalEditarPrompt(interaction) {
  
  const promptAtual = configsticket.get('ilusionAI.prompt') || '';

  const modal = new ModalBuilder()
    .setCustomId('modal_editar_prompt_ia')
    .setTitle('Editar Prompt da Ilusion AI');

  const promptInput = new TextInputBuilder()
    .setCustomId('prompt_input')
    .setLabel('Prompt da IA')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Digite as instruções que a IA deve seguir no atendimento...')
    .setValue(promptAtual)
    .setRequired(true)
    .setMaxLength(4000);

  const row = new ActionRowBuilder().addComponents(promptInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

async function HandleEditarPrompt(interaction, client) {
  
  const novoPrompt = interaction.fields.getTextInputValue('prompt_input');
  
  configsticket.set('ilusionAI.prompt', novoPrompt);
  
  await ConfigurarIlusionAI(interaction, client);
  
  await interaction.followUp({ 
    content: `${require("../DataBaseJson/emojis.json").checker || '✅'} | Prompt da Ilusion AI atualizado com sucesso!`, 
    ephemeral: true 
  });
}

async function ToggleIlusionAI(interaction, client) {
  
  const statusAtual = configsticket.get('ilusionAI.ativo') || false;
  const novoStatus = !statusAtual;
  
  configsticket.set('ilusionAI.ativo', novoStatus);

  await ConfigurarIlusionAI(interaction, client);
  
  await interaction.followUp({ 
    content: `${require("../DataBaseJson/emojis.json").checker || '✅'} | Ilusion AI ${novoStatus ? 'ativada' : 'desativada'} com sucesso!`, 
    ephemeral: true 
  });
}

async function AlterarModoExibicao(interaction, client) {
  
  const modoAtual = configsticket.get('aparencia.modoExibicao') || 'embed';

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_select_modo_exibicao')
    .setPlaceholder('Selecione o modo de exibição')
    .addOptions([
      {
        label: 'Content (Mensagem Simples)',
        description: 'Mensagem de texto simples sem formatação especial',
        value: 'content',
        emoji: '1345629580676956253',
        default: modoAtual === 'content'
      },
      {
        label: 'Embed',
        description: 'Mensagem com embed tradicional do Discord',
        value: 'embed',
        emoji: '1345629580676956253',
        default: modoAtual === 'embed'
      },
      {
        label: 'Container (Component v2)',
        description: 'Mensagem com container moderno (Component v2)',
        value: 'container',
        emoji: '1345629580676956253',
        default: modoAtual === 'container'
      }
    ]);

  const rowVoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_config_aparencia")
      .setLabel('Voltar')
      .setEmoji(`1178068047202893869`)
      .setStyle(2)
  );

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Sistema de Tickets > Alterar Modo de Exibição` },
    { type: 14 },
    { type: 10, content: `## Alterar Modo de Exibição\n\n> ${getSaudacao()} **${interaction.user.username}**! Escolha como a mensagem de ticket será exibida no canal.` },
    { type: 14 },
    { type: 10, content: `**Modo Atual:** \`${modoAtual === 'content' ? 'Content (Mensagem Simples)' : modoAtual === 'embed' ? 'Embed' : 'Container (Component v2)'}\`` },
    { type: 14 },
    {
      type: 1,
      components: [{
        type: 3,
        custom_id: "ticket_select_modo_exibicao",
        placeholder: "Selecione o modo de exibição",
        options: [
          {
            label: 'Content (Mensagem Simples)',
            description: 'Mensagem de texto simples sem formatação especial',
            value: 'content',
            emoji: { id: '1345629580676956253' },
            default: modoAtual === 'content'
          },
          {
            label: 'Embed',
            description: 'Mensagem com embed tradicional do Discord',
            value: 'embed',
            emoji: { id: '1345629580676956253' },
            default: modoAtual === 'embed'
          },
          {
            label: 'Container (Component v2)',
            description: 'Mensagem com container moderno (Component v2)',
            value: 'container',
            emoji: { id: '1345629580676956253' },
            default: modoAtual === 'container'
          }
        ]
      }]
    }
  ).with({
    components: [rowVoltar],
    flags: [64]
  });

  if (interaction.message == undefined) {
    interaction.reply(containerContent)
  } else {
    interaction.update(containerContent)
  }
}

async function HandleSelectModoExibicao(interaction, client) {
  
  const modoSelecionado = interaction.values[0];
  
  configsticket.set('aparencia.modoExibicao', modoSelecionado);
  
  await ConfigurarAparencia(interaction, client);
  
  const modoNome = modoSelecionado === 'content' ? 'Content (Mensagem Simples)' : modoSelecionado === 'embed' ? 'Embed' : 'Container (Component v2)';
  
  await interaction.followUp({ 
    content: `${require("../DataBaseJson/emojis.json").checker || '✅'} | Modo de exibição alterado para **${modoNome}** com sucesso!`, 
    ephemeral: true 
  });
}

async function ModalEditarAparencia(interaction) {
  
  const modoExibicao = configsticket.get('aparencia.modoExibicao') || 'embed';

  const modal = new ModalBuilder()
    .setCustomId('modal_editar_aparencia_ticket')
    .setTitle('Editar Aparência do Ticket');

  if (modoExibicao === 'content') {
    const mensagemInput = new TextInputBuilder()
      .setCustomId('mensagem_input')
      .setLabel('Mensagem')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Digite a mensagem que será exibida...')
      .setValue(configsticket.get('aparencia.mensagem') || '')
      .setRequired(true)
      .setMaxLength(2000);

    modal.addComponents(new ActionRowBuilder().addComponents(mensagemInput));
  } else {
    const tituloInput = new TextInputBuilder()
      .setCustomId('titulo_input')
      .setLabel('Título')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Digite o título...')
      .setValue(configsticket.get('aparencia.titulo') || '')
      .setRequired(true)
      .setMaxLength(256);

    const descricaoInput = new TextInputBuilder()
      .setCustomId('descricao_input')
      .setLabel('Descrição')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Digite a descrição...')
      .setValue(configsticket.get('aparencia.descricao') || '')
      .setRequired(true)
      .setMaxLength(4000);

    const bannerInput = new TextInputBuilder()
      .setCustomId('banner_input')
      .setLabel('Banner (URL da Imagem - Opcional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://exemplo.com/imagem.png')
      .setValue(configsticket.get('aparencia.banner') || '')
      .setRequired(false)
      .setMaxLength(500);

    modal.addComponents(
      new ActionRowBuilder().addComponents(tituloInput),
      new ActionRowBuilder().addComponents(descricaoInput),
      new ActionRowBuilder().addComponents(bannerInput)
    );
  }

  await interaction.showModal(modal);
}

async function HandleEditarAparencia(interaction, client) {
  
  const modoExibicao = configsticket.get('aparencia.modoExibicao') || 'embed';

  if (modoExibicao === 'content') {
    const mensagem = interaction.fields.getTextInputValue('mensagem_input');
    configsticket.set('aparencia.mensagem', mensagem);
  } else {
    const titulo = interaction.fields.getTextInputValue('titulo_input');
    const descricao = interaction.fields.getTextInputValue('descricao_input');
    const banner = interaction.fields.getTextInputValue('banner_input');

    configsticket.set('aparencia.titulo', titulo);
    configsticket.set('aparencia.descricao', descricao);
    if (banner) {
      configsticket.set('aparencia.banner', banner);
    } else {
      configsticket.delete('aparencia.banner');
    }
  }
  
  await ConfigurarAparencia(interaction, client);
  
  await interaction.followUp({ 
    content: `${require("../DataBaseJson/emojis.json").checker || '✅'} | Aparência do ticket atualizada com sucesso!`, 
    ephemeral: true 
  });
}

async function ConfigurarFuncoes(interaction, client) {
  
  const funcoes = configsticket.get('funcoes') || {};
  const funcoesArray = Object.keys(funcoes);
  const totalFuncoes = funcoesArray.length;

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_adicionar_funcao")
      .setLabel('Adicionar Funçao')
      .setEmoji(`1471616706223935540`)
      .setStyle(3),
    new ButtonBuilder()
      .setCustomId("ticket_remover_funcao")
      .setLabel('Remover Funçao')
      .setEmoji(`1471616815942733844`)
      .setStyle(4)
      .setDisabled(totalFuncoes === 0)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_excluir_todas_funcoes")
      .setLabel('Excluir Todas Funçoes')
      .setEmoji(`1384035185217110077`)
      .setStyle(4)
      .setDisabled(totalFuncoes === 0),
    new ButtonBuilder()
      .setCustomId("ticket_editar_funcao")
      .setLabel('Editar Funçao')
      .setEmoji(`1384035217550868493`)
      .setStyle(2)
      .setDisabled(totalFuncoes === 0)
  );

  const rowVoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("painelconfigticket")
      .setLabel('Voltar')
      .setEmoji(`1178068047202893869`)
      .setStyle(2)
  );

  let listaFuncoes = '';
  if (totalFuncoes > 0) {
    funcoesArray.forEach((funcaoId, index) => {
      const funcao = funcoes[funcaoId];
      const emoji = funcao.emoji ? `<:e:${funcao.emoji}>` : '📋';
      listaFuncoes += `\n${index + 1}. ${emoji} **${funcao.nome}** - ${funcao.descricao?.substring(0, 50) || 'Sem descrição'}${funcao.descricao?.length > 50 ? '...' : ''}`;
    });
  } else {
    listaFuncoes = '\n*Nenhuma função cadastrada*';
  }

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Sistema de Tickets > Configurar Funçoes` },
    { type: 14 },
    { type: 10, content: `## Configurar Funçoes\n\n> ${getSaudacao()} **${interaction.user.username}**! As funções são as opções de atendimento que os usuários poderão escolher ao abrir um ticket. Configure categorias como Suporte, Dúvidas, Parcerias, etc.` },
    { type: 14 },
    { type: 10, content: `**Informações do Sistema**\n- Funções Cadastradas: \`\`${totalFuncoes}\`\`` },
    { type: 14 },
    { type: 10, content: `**Principais Funcionalidades**\n- **Adicionar Função:** Crie novas categorias de atendimento\n- **Editar Função:** Modifique nome, descrição e emoji\n- **Remover Função:** Delete funções específicas\n- **Excluir Todas:** Limpe todas as funções cadastradas` },
    { type: 14 },
    { type: 10, content: `**Lista de Funções**${listaFuncoes}` },
    { type: 14 }
  ).with({
    components: [row1, row2, rowVoltar],
    flags: [64]
  });

  if (interaction.message == undefined) {
    interaction.reply(containerContent)
  } else {
    interaction.update(containerContent)
  }
}

async function ModalAdicionarFuncao(interaction) {
  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

  const modal = new ModalBuilder()
    .setCustomId('modal_adicionar_funcao_ticket')
    .setTitle('Adicionar Função');

  const nomeInput = new TextInputBuilder()
    .setCustomId('funcao_nome')
    .setLabel('Nome da Função')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: Suporte, Dúvidas, Parcerias...')
    .setRequired(true)
    .setMaxLength(100);

  const descricaoInput = new TextInputBuilder()
    .setCustomId('funcao_descricao')
    .setLabel('Descrição da Função')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Descreva o propósito desta função...')
    .setRequired(true)
    .setMaxLength(1024);

  const emojiInput = new TextInputBuilder()
    .setCustomId('funcao_emoji')
    .setLabel('Emoji (Opcional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Cole o emoji aqui ou digite o ID')
    .setRequired(false)
    .setMaxLength(100);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nomeInput),
    new ActionRowBuilder().addComponents(descricaoInput),
    new ActionRowBuilder().addComponents(emojiInput)
  );

  await interaction.showModal(modal);
}

async function HandleAdicionarFuncao(interaction, client) {

  const nome = interaction.fields.getTextInputValue('funcao_nome');
  const descricao = interaction.fields.getTextInputValue('funcao_descricao');
  const emojiRaw = interaction.fields.getTextInputValue('funcao_emoji');

  let emojiId = null;
  if (emojiRaw) {
    const emojiMatch = emojiRaw.match(/<a?:\w+:(\d+)>/) || emojiRaw.match(/(\d{17,19})/);
    if (emojiMatch) {
      emojiId = emojiMatch[1];
    }
  }

  const funcaoId = nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const timestamp = Date.now();
  const funcaoIdUnico = `${funcaoId}_${timestamp}`;

  const funcaoData = {
    nome,
    descricao
  };

  if (emojiId) {
    funcaoData.emoji = emojiId;
  }

  configsticket.set(`funcoes.${funcaoIdUnico}`, funcaoData);

  await ConfigurarFuncoes(interaction, client);

  await interaction.followUp({
    content: `${require("../DataBaseJson/emojis.json").checker || '✅'} | Função **${nome}** adicionada com sucesso!`,
    ephemeral: true
  });
}

async function PaginaRemoverFuncao(interaction, client) {

  const funcoes = configsticket.get('funcoes') || {};
  const funcoesArray = Object.keys(funcoes);

  if (funcoesArray.length === 0) {
    return interaction.update({
      content: `${require("../DataBaseJson/emojis.json").negative || '❌'} | Não há funções cadastradas para remover!`,
      components: [],
      ephemeral: true
    });
  }

  const rows = [];
  let currentRow = new ActionRowBuilder();

  funcoesArray.forEach((funcaoId, index) => {
    const funcao = funcoes[funcaoId];
    const emoji = funcao.emoji ? funcao.emoji : '1178076767567757312';

    const button = new ButtonBuilder()
      .setCustomId(`ticket_deletar_funcao_${funcaoId}`)
      .setLabel(funcao.nome)
      .setEmoji(emoji)
      .setStyle(4);

    currentRow.addComponents(button);

    if ((index + 1) % 5 === 0 || index === funcoesArray.length - 1) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
  });

  const rowVoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_config_funcoes")
      .setLabel('Voltar')
      .setEmoji(`1178068047202893869`)
      .setStyle(2)
  );

  rows.push(rowVoltar);

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Sistema de Tickets > Remover Função` },
    { type: 14 },
    { type: 10, content: `## Remover Função\n\n> Clique na função que deseja remover:` },
    { type: 14 }
  ).with({
    components: rows,
    flags: [64]
  });

  await interaction.update(containerContent);
}

async function HandleDeletarFuncao(interaction, client, funcaoId) {

  const funcao = configsticket.get(`funcoes.${funcaoId}`);
  const nomeFuncao = funcao?.nome || 'Função';

  configsticket.delete(`funcoes.${funcaoId}`);

  await ConfigurarFuncoes(interaction, client);

  await interaction.followUp({
    content: `${require("../DataBaseJson/emojis.json").checker || '✅'} | Função **${nomeFuncao}** removida com sucesso!`,
    ephemeral: true
  });
}

async function HandleExcluirTodasFuncoes(interaction, client) {

  configsticket.delete('funcoes');

  await ConfigurarFuncoes(interaction, client);

  await interaction.followUp({
    content: `${require("../DataBaseJson/emojis.json").checker || '✅'} | Todas as funções foram excluídas com sucesso!`,
    ephemeral: true
  });
}

async function PaginaEditarFuncao(interaction, client) {

  const funcoes = configsticket.get('funcoes') || {};
  const funcoesArray = Object.keys(funcoes);

  if (funcoesArray.length === 0) {
    return interaction.update({
      content: `${require("../DataBaseJson/emojis.json").negative || '❌'} | Não há funções cadastradas para editar!`,
      components: [],
      ephemeral: true
    });
  }

  const options = funcoesArray.map(funcaoId => {
    const funcao = funcoes[funcaoId];
    return {
      label: funcao.nome,
      description: funcao.descricao?.substring(0, 100) || 'Sem descrição',
      value: funcaoId,
      emoji: funcao.emoji ? { id: funcao.emoji } : { name: '📋' }
    };
  });

  const rowVoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_config_funcoes")
      .setLabel('Voltar')
      .setEmoji(`1178068047202893869`)
      .setStyle(2)
  );

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Sistema de Tickets > Editar Função` },
    { type: 14 },
    { type: 10, content: `## Editar Função\n\n> Selecione a função que deseja editar:` },
    { type: 14 },
    {
      type: 1,
      components: [{
        type: 3,
        custom_id: "ticket_select_editar_funcao",
        placeholder: "Selecione uma função para editar",
        options: options
      }]
    }
  ).with({
    components: [rowVoltar],
    flags: [64]
  });

  await interaction.update(containerContent);
}

async function ModalEditarFuncaoEspecifica(interaction, funcaoId) {

  const funcao = configsticket.get(`funcoes.${funcaoId}`);

  if (!funcao) {
    return interaction.reply({
      content: `${require("../DataBaseJson/emojis.json").negative || '❌'} | Função não encontrada!`,
      ephemeral: true
    });
  }

  const modal = new ModalBuilder()
    .setCustomId(`modal_editar_funcao_${funcaoId}`)
    .setTitle('Editar Função');

  const nomeInput = new TextInputBuilder()
    .setCustomId('funcao_nome')
    .setLabel('Nome da Função')
    .setStyle(TextInputStyle.Short)
    .setValue(funcao.nome)
    .setRequired(true)
    .setMaxLength(100);

  const descricaoInput = new TextInputBuilder()
    .setCustomId('funcao_descricao')
    .setLabel('Descrição da Função')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(funcao.descricao)
    .setRequired(true)
    .setMaxLength(1024);

  const emojiInput = new TextInputBuilder()
    .setCustomId('funcao_emoji')
    .setLabel('Emoji (Opcional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Cole o emoji aqui ou digite o ID')
    .setValue(funcao.emoji || '')
    .setRequired(false)
    .setMaxLength(100);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nomeInput),
    new ActionRowBuilder().addComponents(descricaoInput),
    new ActionRowBuilder().addComponents(emojiInput)
  );

  await interaction.showModal(modal);
}

async function HandleEditarFuncaoEspecifica(interaction, client, funcaoId) {

  const nome = interaction.fields.getTextInputValue('funcao_nome');
  const descricao = interaction.fields.getTextInputValue('funcao_descricao');
  const emojiRaw = interaction.fields.getTextInputValue('funcao_emoji');

  let emojiId = null;
  if (emojiRaw) {
    const emojiMatch = emojiRaw.match(/<a?:\w+:(\d+)>/) || emojiRaw.match(/(\d{17,19})/);
    if (emojiMatch) {
      emojiId = emojiMatch[1];
    }
  }

  const funcaoData = {
    nome,
    descricao
  };

  if (emojiId) {
    funcaoData.emoji = emojiId;
  } else {
    const funcaoAtual = configsticket.get(`funcoes.${funcaoId}`);
    if (!emojiRaw && funcaoAtual?.emoji) {
    } else if (funcaoAtual?.emoji) {
      funcaoData.emoji = funcaoAtual.emoji;
    }
  }

  configsticket.set(`funcoes.${funcaoId}`, funcaoData);

  await ConfigurarFuncoes(interaction, client);

  await interaction.followUp({
    content: `${require("../DataBaseJson/emojis.json").checker || '✅'} | Função **${nome}** editada com sucesso!`,
    ephemeral: true
  });
}


async function PaginaPostarMensagem(interaction, client) {

  try {
    const funcoes = configsticket.get('funcoes') || {};
    const funcoesArray = Object.keys(funcoes);

    if (funcoesArray.length === 0) {
      await interaction.deferUpdate();
      return interaction.followUp({
        content: `${Emojis.get('negative')} | Você precisa configurar pelo menos uma função antes de postar a mensagem!`,
        ephemeral: true
      });
    }

    const modoExibicao = configsticket.get('aparencia.modoExibicao') || 'embed';
    let aparenciaConfigurada = false;

    if (modoExibicao === 'content') {
      aparenciaConfigurada = !!configsticket.get('aparencia.mensagem');
    } else {
      const titulo = configsticket.get('aparencia.titulo');
      const descricao = configsticket.get('aparencia.descricao');
      aparenciaConfigurada = !!titulo && !!descricao;
    }

    if (!aparenciaConfigurada) {
      await interaction.deferUpdate();
      return interaction.followUp({
        content: `${Emojis.get('negative')} | Você precisa configurar a aparência da mensagem antes de postar! Use o botão "Editar Aparencia".`,
        ephemeral: true
      });
    }

    await interaction.deferUpdate();
    
    const { ChannelSelectMenuBuilder } = require("discord.js");
    
    const selectMenu = new ChannelSelectMenuBuilder()
      .setCustomId("ticket_select_canal_postar")
      .setPlaceholder("Selecione um canal")
      .setChannelTypes([ChannelType.GuildText]);
    
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.followUp({
      content: `${Emojis.get('info') || 'ℹ️'} | Selecione o canal onde deseja postar a mensagem de ticket:`,
      components: [selectRow],
      ephemeral: true
    });

  } catch (error) {
    console.error('[ERRO PAGINA POSTAR]', error);
    
    try {
      await interaction.followUp({
        content: `${Emojis.get('negative')} | Erro ao abrir seleção de canal: ${error.message}`,
        ephemeral: true
      });
    } catch (followUpError) {
      console.error('[ERRO PAGINA POSTAR] Erro ao enviar followUp de erro:', followUpError);
    }
  }
}


async function HandlePostarMensagem(interaction, client) {
  
  try {
    const canalId = interaction.values[0];
    const canal = await client.channels.fetch(canalId);

    const modoExibicao = configsticket.get('aparencia.modoExibicao') || 'embed';
    const funcoes = configsticket.get('funcoes') || {};
    const funcoesArray = Object.keys(funcoes);

    await interaction.reply({ 
      content: `${Emojis.get('loading')} Aguarde, estou postando a mensagem...`,
      ephemeral: true
    });

    let mensagemEnviada;

    if (modoExibicao === 'content') {
      const mensagem = configsticket.get('aparencia.mensagem') || 'Abra um ticket!';
      const banner = configsticket.get('aparencia.banner');
      
      const componentesFuncoes = [];
      
      if (funcoesArray.length === 1) {
        const funcaoId = funcoesArray[0];
        const funcao = funcoes[funcaoId];
        
        const botao = new ButtonBuilder()
          .setCustomId(`abrir_ticket_${funcaoId}`)
          .setLabel(funcao.nome)
          .setStyle(3);
        
        if (funcao.emoji) {
          botao.setEmoji(funcao.emoji);
        }
        
        componentesFuncoes.push(new ActionRowBuilder().addComponents(botao));
      } else {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticket_select_funcao")
          .setPlaceholder("Selecione uma opção para abrir ticket");
        
        funcoesArray.forEach(funcaoId => {
          const funcao = funcoes[funcaoId];
          const option = {
            label: funcao.nome,
            description: funcao.descricao?.substring(0, 100) || 'Abrir ticket',
            value: funcaoId
          };
          
          if (funcao.emoji) {
            option.emoji = funcao.emoji;
          }
          
          selectMenu.addOptions(option);
        });
        
        componentesFuncoes.push(new ActionRowBuilder().addComponents(selectMenu));
      }
      
      const payload = {
        content: mensagem,
        components: componentesFuncoes
      };
      
      if (banner) {
        payload.files = [banner];
      }
      
      mensagemEnviada = await canal.send(payload);
      
    } else if (modoExibicao === 'embed') {
      const titulo = configsticket.get('aparencia.titulo') || 'Sistema de Tickets';
      const descricao = configsticket.get('aparencia.descricao') || 'Abra um ticket para atendimento!';
      const banner = configsticket.get('aparencia.banner');
      
      const embed = new EmbedBuilder()
        .setTitle(titulo)
        .setDescription(descricao)
        .setColor('#2b2d31');
      
      if (banner) {
        embed.setImage(banner);
      }
      
      const componentesFuncoes = [];
      
      if (funcoesArray.length === 1) {
        const funcaoId = funcoesArray[0];
        const funcao = funcoes[funcaoId];
        
        const botao = new ButtonBuilder()
          .setCustomId(`abrir_ticket_${funcaoId}`)
          .setLabel(funcao.nome)
          .setStyle(3);
        
        if (funcao.emoji) {
          botao.setEmoji(funcao.emoji);
        }
        
        componentesFuncoes.push(new ActionRowBuilder().addComponents(botao));
      } else {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticket_select_funcao")
          .setPlaceholder("Selecione uma opção para abrir ticket");
        
        funcoesArray.forEach(funcaoId => {
          const funcao = funcoes[funcaoId];
          const option = {
            label: funcao.nome,
            description: funcao.descricao?.substring(0, 100) || 'Abrir ticket',
            value: funcaoId
          };
          
          if (funcao.emoji) {
            option.emoji = funcao.emoji;
          }
          
          selectMenu.addOptions(option);
        });
        
        componentesFuncoes.push(new ActionRowBuilder().addComponents(selectMenu));
      }
      
      mensagemEnviada = await canal.send({
        embeds: [embed],
        components: componentesFuncoes
      });
      
    } else {
      const titulo = configsticket.get('aparencia.titulo') || 'Sistema de Tickets';
      const descricao = configsticket.get('aparencia.descricao') || 'Abra um ticket para atendimento!';
      const banner = configsticket.get('aparencia.banner');
      
      const itens = [];
      
      itens.push({ type: 10, content: `**${titulo}**` });
      itens.push({ type: 14 });
      
      itens.push({ type: 10, content: descricao });
      
      if (banner && banner.startsWith('http')) {
        itens.push({
          type: 12,
          items: [{ media: { url: banner.trim() }, spoiler: false }]
        });
      }
      
      itens.push({ type: 14 });
      
      if (funcoesArray.length === 1) {
        const funcaoId = funcoesArray[0];
        const funcao = funcoes[funcaoId];
        
        itens.push({
          type: 1,
          components: [{
            type: 2,
            style: 3,
            label: funcao.nome,
            custom_id: `abrir_ticket_${funcaoId}`,
            emoji: funcao.emoji ? { id: funcao.emoji } : undefined
          }]
        });
      } else {
        const options = funcoesArray.map(funcaoId => {
          const funcao = funcoes[funcaoId];
          return {
            label: funcao.nome,
            description: funcao.descricao?.substring(0, 100) || 'Abrir ticket',
            value: funcaoId,
            emoji: funcao.emoji ? { id: funcao.emoji } : undefined
          };
        });
        
        itens.push({
          type: 1,
          components: [{
            type: 3,
            custom_id: "ticket_select_funcao",
            placeholder: "Selecione uma opção para abrir ticket",
            options: options
          }]
        });
      }
      
      const payload = res.main(...itens).with({
        content: " "
      });
      
      mensagemEnviada = await canal.send(payload);
    }

    configsticket.set('mensagemPostada', {
      guildId: mensagemEnviada.guild.id,
      channelId: mensagemEnviada.channel.id,
      messageId: mensagemEnviada.id
    });

    const rowLink = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setURL(mensagemEnviada.url)
        .setLabel('Ir para a mensagem')
        .setStyle(5)
    );

    await interaction.editReply({
      content: `${Emojis.get('checker')} | Mensagem postada com sucesso em ${canal}!`,
      components: [rowLink]
    });

  } catch (error) {
    console.error('[ERRO POSTAR TICKET]', error);
    
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content: `${Emojis.get('negative')} | Erro ao postar mensagem: ${error.message}`,
          components: []
        });
      } else {
        await interaction.reply({
          content: `${Emojis.get('negative')} | Erro ao postar mensagem: ${error.message}`,
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('[ERRO POSTAR TICKET] Erro ao enviar mensagem de erro:', replyError);
    }
  }
}

module.exports = {
  PainelTickets,
  ConfigurarAparencia,
  ConfigurarIlusionAI,
  ModalEditarPrompt,
  HandleEditarPrompt,
  ToggleIlusionAI,
  AlterarModoExibicao,
  HandleSelectModoExibicao,
  ModalEditarAparencia,
  HandleEditarAparencia,
  ConfigurarFuncoes,
  ModalAdicionarFuncao,
  HandleAdicionarFuncao,
  PaginaRemoverFuncao,
  HandleDeletarFuncao,
  HandleExcluirTodasFuncoes,
  PaginaEditarFuncao,
  ModalEditarFuncaoEspecifica,
  HandleEditarFuncaoEspecifica,
  PaginaPostarMensagem,
  HandlePostarMensagem,
  ConfigurarHorarioAtendimento,
  ToggleHorarioAtendimento,
  ModalConfigurarHorarios,
  HandleConfigurarHorarios,
  PaginaConfigurarDiasFolga,
  HandleConfigurarDiasFolga,
  ToggleSistemaFolgas
}

async function ConfigurarHorarioAtendimento(interaction, client) {
  
  const statusHorario = configsticket.get('horarioAtendimento.ativo') || false;
  const statusFolgas = configsticket.get('horarioAtendimento.folgasAtivo') || false;
  const horarioInicio = configsticket.get('horarioAtendimento.inicio') || 'Não configurado';
  const horarioFim = configsticket.get('horarioAtendimento.fim') || 'Não configurado';
  const diasFolga = configsticket.get('horarioAtendimento.diasFolga') || [];
  const diasFolgaTexto = diasFolga.length > 0 ? diasFolga.join(', ') : 'Nenhum';

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_toggle_horario")
      .setLabel(statusHorario ? 'Desativar Horário' : 'Ativar Horário')
      .setEmoji(statusHorario ? `1384035206402408518` : `1384035178749497445`)
      .setStyle(statusHorario ? 4 : 3),
    new ButtonBuilder()
      .setCustomId("ticket_toggle_folgas")
      .setLabel(statusFolgas ? 'Desativar Folgas' : 'Ativar Folgas')
      .setEmoji(statusFolgas ? `1384035206402408518` : `1384035178749497445`)
      .setStyle(statusFolgas ? 4 : 3)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_config_horarios")
      .setLabel('Configurar Horarios')
      .setEmoji(`1458667975904329768`)
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId("ticket_config_dias_folga")
      .setLabel('Configurar Dias de Folga')
      .setEmoji(`1471617240225812581`)
      .setStyle(2)
  );

  const rowVoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("painelconfigticket")
      .setLabel('Voltar')
      .setEmoji(`1178068047202893869`)
      .setStyle(2)
  );

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Sistema de Tickets > Horário de Atendimento` },
    { type: 14 },
    { type: 10, content: `## Horário de Atendimento\n\n> ${getSaudacao()} **${interaction.user.username}**! Configure os horários e dias em que o sistema de tickets estará disponível.` },
    { type: 14 },
    { type: 10, content: `**Informações do Sistema**\n- Horário Automático: \`\`${statusHorario ? '🟢 Ativo' : '🔴 Inativo'}\`\`\n- Sistema de Folgas: \`\`${statusFolgas ? '🟢 Ativo' : '🔴 Inativo'}\`\`\n- Horário de Funcionamento: \`\`${horarioInicio} às ${horarioFim}\`\`\n- Dias de Folga: \`\`${diasFolgaTexto}\`\`` },
    { type: 14 },
    { type: 10, content: `**Como Funciona**\n- **Horário Automático:** Define o horário de funcionamento (ex: 08:00 às 18:00). Fora desse período, usuários não poderão abrir tickets.\n- **Sistema de Folgas:** Define dias da semana sem atendimento (ex: Sábado e Domingo). Nesses dias, o sistema não permitirá abertura de tickets.` },
    { type: 14 }
  ).with({
    components: [row1, row2, rowVoltar],
    flags: [64]
  });

  if (interaction.message == undefined) {
    interaction.reply(containerContent)
  } else {
    interaction.update(containerContent)
  }
}

async function ToggleHorarioAtendimento(interaction, client) {
  
  const statusAtual = configsticket.get('horarioAtendimento.ativo') || false;
  const novoStatus = !statusAtual;
  
  configsticket.set('horarioAtendimento.ativo', novoStatus);

  await ConfigurarHorarioAtendimento(interaction, client);
  
  await interaction.followUp({ 
    content: `${Emojis.get('checker')} | Horário de atendimento ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`, 
    ephemeral: true 
  });
}

async function ModalConfigurarHorarios(interaction) {

  const horarioInicio = configsticket.get('horarioAtendimento.inicio') || '';
  const horarioFim = configsticket.get('horarioAtendimento.fim') || '';

  const modal = new ModalBuilder()
    .setCustomId('modal_config_horarios_ticket')
    .setTitle('Configurar Horários');

  const inicioInput = new TextInputBuilder()
    .setCustomId('horario_inicio')
    .setLabel('Horário de Início (HH:MM)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: 08:00')
    .setValue(horarioInicio)
    .setRequired(true)
    .setMaxLength(5)
    .setMinLength(5);

  const fimInput = new TextInputBuilder()
    .setCustomId('horario_fim')
    .setLabel('Horário de Término (HH:MM)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: 18:00')
    .setValue(horarioFim)
    .setRequired(true)
    .setMaxLength(5)
    .setMinLength(5);

  modal.addComponents(
    new ActionRowBuilder().addComponents(inicioInput),
    new ActionRowBuilder().addComponents(fimInput)
  );

  await interaction.showModal(modal);
}

async function HandleConfigurarHorarios(interaction, client) {

  const horarioInicio = interaction.fields.getTextInputValue('horario_inicio');
  const horarioFim = interaction.fields.getTextInputValue('horario_fim');

  const regexHorario = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  
  if (!regexHorario.test(horarioInicio) || !regexHorario.test(horarioFim)) {
    await ConfigurarHorarioAtendimento(interaction, client);
    return interaction.followUp({
      content: `${Emojis.get('negative')} | Formato de horário inválido! Use o formato HH:MM (Ex: 08:00)`,
      ephemeral: true
    });
  }

  configsticket.set('horarioAtendimento.inicio', horarioInicio);
  configsticket.set('horarioAtendimento.fim', horarioFim);

  await ConfigurarHorarioAtendimento(interaction, client);

  await interaction.followUp({
    content: `${Emojis.get('checker')} | Horários configurados com sucesso! Funcionamento: ${horarioInicio} às ${horarioFim}`,
    ephemeral: true
  });
}

async function PaginaConfigurarDiasFolga(interaction, client) {

  const diasFolga = configsticket.get('horarioAtendimento.diasFolga') || [];

  const rowVoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_horario_atendimento")
      .setLabel('Voltar')
      .setEmoji(`1178068047202893869`)
      .setStyle(2)
  );

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Sistema de Tickets > Configurar Dias de Folga` },
    { type: 14 },
    { type: 10, content: `## Configurar Dias de Folga\n\n> ${getSaudacao()} **${interaction.user.username}**! Selecione os dias da semana em que o sistema de tickets NÃO estará disponível.` },
    { type: 14 },
    { type: 10, content: `**Dias Selecionados:** ${diasFolga.length > 0 ? diasFolga.join(', ') : 'Nenhum'}` },
    { type: 14 },
    {
      type: 1,
      components: [{
        type: 3,
        custom_id: "ticket_select_dias_folga",
        placeholder: "Selecione os dias de folga",
        min_values: 0,
        max_values: 7,
        options: [
          {
            label: 'Segunda-feira',
            value: 'Segunda-feira',
            emoji: { id: '1471617240225812581' },
            default: diasFolga.includes('Segunda-feira')
          },
          {
            label: 'Terça-feira',
            value: 'Terça-feira',
            emoji: { id: '1471617240225812581' },
            default: diasFolga.includes('Terça-feira')
          },
          {
            label: 'Quarta-feira',
            value: 'Quarta-feira',
            emoji: { id: '1471617240225812581' },
            default: diasFolga.includes('Quarta-feira')
          },
          {
            label: 'Quinta-feira',
            value: 'Quinta-feira',
            emoji: { id: '1471617240225812581' },
            default: diasFolga.includes('Quinta-feira')
          },
          {
            label: 'Sexta-feira',
            value: 'Sexta-feira',
            emoji: { id: '1471617240225812581' },
            default: diasFolga.includes('Sexta-feira')
          },
          {
            label: 'Sábado',
            value: 'Sábado',
            emoji: { id: '1471617240225812581' },
            default: diasFolga.includes('Sábado')
          },
          {
            label: 'Domingo',
            value: 'Domingo',
            emoji: { id: '1471617240225812581' },
            default: diasFolga.includes('Domingo')
          }
        ]
      }]
    }
  ).with({
    components: [rowVoltar],
    flags: [64]
  });

  await interaction.update(containerContent);
}

async function HandleConfigurarDiasFolga(interaction, client) {

  const diasSelecionados = interaction.values;

  configsticket.set('horarioAtendimento.diasFolga', diasSelecionados);

  await ConfigurarHorarioAtendimento(interaction, client);

  const mensagem = diasSelecionados.length > 0 
    ? `${Emojis.get('checker')} | Dias de folga configurados: ${diasSelecionados.join(', ')}`
    : `${Emojis.get('checker')} | Dias de folga removidos. O sistema funcionará todos os dias.`;

  await interaction.followUp({
    content: mensagem,
    ephemeral: true
  });
}

async function ToggleSistemaFolgas(interaction, client) {
  
  const statusAtual = configsticket.get('horarioAtendimento.folgasAtivo') || false;
  const novoStatus = !statusAtual;
  
  configsticket.set('horarioAtendimento.folgasAtivo', novoStatus);

  await ConfigurarHorarioAtendimento(interaction, client);
  
  await interaction.followUp({ 
    content: `${Emojis.get('checker')} | Sistema de folgas ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`, 
    ephemeral: true 
  });
}
