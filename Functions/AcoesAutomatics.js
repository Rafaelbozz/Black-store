const { EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { produtos, configuracao } = require("../DataBaseJson");

async function AcoesAutomaticsConfigs(interaction, client) {

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Origins Bot`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
    .setTitle(`Moderação`)
    .setDescription(`- Olá **${interaction.user.displayName ? interaction.user.displayName : interaction.user.username}**, Você está no painel de configuração de moderação.`)
    .setFooter(
      { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null }
    )
    .setTimestamp()


  const select = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`select_AcoesAutomaticsConfigs`)
      .setPlaceholder(`Clique aqui para selecionar`)
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(`Limpar Canal`)
          .setValue(`LimpezaAutomatica`)
          .setDescription(`Limpeza Automática de Mensagens`)
          .setEmoji(`1238300628225228961`),
        new StringSelectMenuOptionBuilder()
          .setLabel(`Gerenciar Canais`)
          .setValue(`GerenciarCanais`)
          .setDescription(`Abertura e Fechamento de Canais`)
          .setEmoji(`1244438113368150061`),
        new StringSelectMenuOptionBuilder()
          .setLabel(`Nukar Canal`)
          .setValue(`SistemaNukar`)
          .setDescription(`Nukar Canal`)
          .setEmoji(`1229787813046915092`),
        new StringSelectMenuOptionBuilder()
          .setLabel(`Boas Vindas`)
          .setValue(`msgbemvindo`)
          .setDescription(`Mensagem de Boas Vindas`)
          .setEmoji(`1243254225799217172`),
        new StringSelectMenuOptionBuilder()
          .setLabel(`Anti-Fake`)
          .setValue(`SistemaAntiFake`)
          .setDescription(`Sistema Anti-Fake`)
          .setEmoji(`1286081797297279091`),
        new StringSelectMenuOptionBuilder()
          .setLabel(`Sistema de Filtro`)
          .setValue(`SistemadeFiltro`)
          .setDescription(`Sistema de Filtro`)
          .setEmoji(`1286078168855478446`),
        new StringSelectMenuOptionBuilder()
          .setLabel(`Repostagem`)
          .setValue(`automaticRepostar`)
          .setDescription(`Repostagem de Mensagens`)
          .setEmoji(`1238303687248576544`),
        new StringSelectMenuOptionBuilder()
          .setLabel(`Mensagens Automáticas`)
          .setValue(`MsgsAutoConfig`)
          .setDescription(`Mensagens Automáticas`)
          .setEmoji(`1238709839685746758`),
      )
  )


  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar1")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )

  await interaction.update({ content: `Configurações de moderação.`, components: [select, botoesvoltar], embeds: [], ephemeral: true })
}
async function SistemaAntiFake(interaction, client) {

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Origins Bot`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
    .setTitle(`Anti-Fake`)
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
    .setDescription(`- Gerencie o sistema de Anti-Fake do seu servidor.`)

  let AntiFake = configuracao.get(`AntiFake`);

  if (AntiFake) {
    embed.addFields(
      {
        name: `Sistema AntiFake`,
        value: `Dias Mínimos: \`${AntiFake?.diasminimos ? AntiFake?.diasminimos : `Não Definido`}\`\nStatus Bloqueados: \`${AntiFake?.status.length > 0 ? AntiFake?.status.join(',').replace(/\s*,\s*$/, '') : `Nenhum Salvo`}\`\nNomes Bloqueados: \`${AntiFake?.nomes.length > 0 ? AntiFake?.nomes.join(',').replace(/\s*,\s*$/, '') : `Nenhum Salvo`}\``
      },
    )
  }

  const botao = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("personalizarantifake")
      .setLabel('Anti-Fake')
      .setEmoji(`1286081797297279091`)
      .setStyle(1),
  )

  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar_AcoesAutomaticsConfigs")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )

  await interaction.update({ content: ``, components: [botao, botoesvoltar], embeds: [embed], ephemeral: true })
}
async function sistemaAntiRaid(interaction, client) {

  let AntiRaid = configuracao.get(`AutomaticSettings.sistemaAntiRaid`);
  let metodopunicao = AntiRaid?.punicao == `RemoverCargos` ? `Remover Todos os Cargos` : AntiRaid?.punicao?.charAt(0).toUpperCase() + AntiRaid?.punicao?.slice(1);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Origins Bot`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
    .setTitle(`Anti-Raid - ${AntiRaid?.status ? `HABILITADO` : `DESABILITADO`}`)
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
    .setDescription(`- Gerencie o sistema de Anti-Raid do seu servidor.`)
    .setFields(
      { name: `Canal de Logs:`, value: `${AntiRaid?.canallogs ? `<#${AntiRaid?.canallogs}>` : `\`Não Definido\``}`, inline: true },
      { name: `Proteção de Convite:`, value: `\`${AntiRaid?.convitepersonalizado ? `Sua URL está Protegida` : `Sua URL NÃO está Protegida`}\``, inline: true },
      { name: `Método de Punição:`, value: `\`${AntiRaid?.punicao ? metodopunicao : `Remover Todos os Cargos`}\``, inline: true },
    )

  if (AntiRaid?.cargos?.length > 0) {
    let cargos = "";
    AntiRaid?.cargos.forEach((cargo) => {
      cargos += `<@&${cargo}>\n`;
    });
    embed.addFields({ name: `Cargos Imunes`, value: cargos });
  }

  embed.addFields(
    { name: `Proteção de Cargos Deletados [\`${AntiRaid?.ExclusaoCargos?.status ? `🟢` : `🔴`}\`]:`, value: `- O usuário poderá excluir \`${AntiRaid?.ExclusaoCargos?.quantidadeporminuto || 0}\` Cargos por minutos e \`${AntiRaid?.ExclusaoCargos?.quantidadeporhora || 0}\` por hora.`, inline: false },
    { name: `Proteção de Canais Deletados [\`${AntiRaid?.ExclusaoCanais?.status ? `🟢` : `🔴`}\`]:`, value: `- O usuário poderá excluir \`${AntiRaid?.ExclusaoCanais?.quantidadeporminuto || 0}\` Canais por minutos e \`${AntiRaid?.ExclusaoCanais?.quantidadeporhora || 0}\` por hora.`, inline: false },
    { name: `Proteção de Banimentos [\`${AntiRaid?.Banimento?.status ? `🟢` : `🔴`}\`]:`, value: `- O usuário poderá banir \`${AntiRaid?.Banimento?.quantidadeporminuto || 0}\` membros por minutos e \`${AntiRaid?.Banimento?.quantidadeporhora || 0}\` por hora.`, inline: false },
    { name: `Proteção de Expulsões [\`${AntiRaid?.Expulsao?.status ? `🟢` : `🔴`}\`]:`, value: `- O usuário poderá expulsar \`${AntiRaid?.Expulsao?.quantidadeporminuto || 0}\` membros por minutos e \`${AntiRaid?.Expulsao?.quantidadeporhora || 0}\` por hora.`, inline: false },
  )



  const botao = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`statusantiraid`)
      .setLabel(`${AntiRaid?.status ? `Desativar` : `Ativar`} Sistema`)
      .setEmoji(`1237122940617883750`)
      .setStyle(AntiRaid?.status ? 4 : 3),
    new ButtonBuilder()
      .setCustomId(`statusconvitepersonalizado`)
      .setLabel(`${AntiRaid?.convitepersonalizado ? `Desativar` : `Ativar`} Proteção de Convite`)
      .setEmoji(`1237122940617883750`)
      .setStyle(AntiRaid?.convitepersonalizado ? 4 : 3),
  )
  const botao2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`canallogsantiraid`)
      .setLabel(`Canal de Logs`)
      .setEmoji(`1233127513178247269`)
      .setStyle(1),
    new ButtonBuilder()
      .setCustomId(`cargosimunesantiraid`)
      .setLabel(`Cargos Imunes`)
      .setEmoji(`1233127515141308416`)
      .setStyle(1),
    new ButtonBuilder()
      .setCustomId(`metodopunicao`)
      .setLabel(`Método de Punição`)
      .setEmoji(`1233103066975309984`)
      .setStyle(1),
  )

  const select = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`metodopunicaoantiraid`)
      .setPlaceholder(`Selecione um método de punição`)
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(`Exclusão de Cargos`)
          .setValue(`ExclusaoCargos`)
          .setDescription(`Puna quem ultrapassar o limite de exclusão por Minuto/Hora`)
          .setEmoji(`1232782650385629299`),
        new StringSelectMenuOptionBuilder()
          .setLabel(`Exclusão de Canais`)
          .setValue(`ExclusaoCanais`)
          .setDescription(`Puna quem ultrapassar o limite de exclusão por Minuto/Hora`)
          .setEmoji(`1232782650385629299`),
        new StringSelectMenuOptionBuilder()
          .setLabel(`Banimento`)
          .setValue(`Banimento`)
          .setDescription(`Puna quem ultrapassar o limite de banimentos por Minuto/Hora`)
          .setEmoji(`1232782650385629299`),
        new StringSelectMenuOptionBuilder()
          .setLabel(`Expulsão`)
          .setValue(`Expulsao`)
          .setDescription(`Puna quem ultrapassar o limite de expulsões por Minuto/Hora`)
          .setEmoji(`1232782650385629299`)
      )
  )

  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltarProtect")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )

  await interaction.update({ content: ``, components: [botao, botao2, select, botoesvoltar], embeds: [embed], ephemeral: true })
}
async function LimpezaAutomatica(interaction, client) {

  let canais = configuracao.get(`AutomaticSettings.LimpezaAutomatica.canais`)

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Origins Bot`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
    .setTitle(`Limpeza Automática`)
    .setDescription(`- Seu Bot realizará a limpeza automática das mensagens nos canais selecionados por você, conforme o horário estabelecido.`)
    .setFooter(
      { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null }
    )
    .setTimestamp()

  if (configuracao.get(`AutomaticSettings.LimpezaAutomatica.primeira`) && configuracao.get(`AutomaticSettings.LimpezaAutomatica.segunda`)) {
    let execucoes = configuracao.get(`AutomaticSettings.LimpezaAutomatica`);

    const toTimestamp = hora => {
      let [h, m] = hora.split(':');
      let agora = new Date();
      agora.setHours(h, m, 0, 0);

      if (agora < new Date()) {
        agora.setDate(agora.getDate() + 1);
      }

      return Math.floor(agora.getTime() / 1000);
    };

    embed.addFields({
      name: `Horários de execução (${execucoes.status ? 'Ativo' : 'Inativo'})`,
      value: `\`${execucoes.primeira}\` (Próxima execução em <t:${toTimestamp(execucoes.primeira)}:R>)\n`
        + `\`${execucoes.segunda}\` (Próxima execução em <t:${toTimestamp(execucoes.segunda)}:R>)`
    });
  }

  if (canais?.length > 0) {
    let canaismsg = "";
    canais.forEach((canal) => {
      canaismsg += `<#${canal}>\n`;
    });
    embed.addFields({ name: `Canais`, value: canaismsg });
  }


  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("configurarLimpeza")
      .setLabel('Definir Regras')
      .setEmoji(`1233103066975309984`)
      .setStyle(1),
    new ButtonBuilder()
      .setCustomId("adicionarcanal_LimpezaAutomatica")
      .setLabel('Adicionar Canal')
      .setEmoji(`1233110125330563104`)
      .setStyle(3),
    new ButtonBuilder()
      .setCustomId("removercanal_LimpezaAutomatica")
      .setLabel('Remover Canal')
      .setEmoji(`1242907028079247410`)
      .setStyle(4)
  )

  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar_AcoesAutomaticsConfigs")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )


  await interaction.update({ content: ``, components: [row1, botoesvoltar], embeds: [embed], ephemeral: true })
}
async function GerenciarCanais(interaction, client) {

  let canais = configuracao.get(`AutomaticSettings.GerenciarCanais.canais`)

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Origins Bot`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
    .setTitle(`Gerenciar Canais`)
    .setDescription(`- Aqui você pode gerenciar os canais que o bot irá atuar.`)
    .setFooter(
      { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null }
    )
    .setTimestamp()

  if (configuracao.get(`AutomaticSettings.GerenciarCanais.abertura`) && configuracao.get(`AutomaticSettings.GerenciarCanais.fechamento`)) {
    let execucoes = configuracao.get(`AutomaticSettings.GerenciarCanais`);

    const toTimestamp = hora => {
      let [h, m] = hora.split(':');
      let agora = new Date();
      agora.setHours(h, m, 0, 0);

      if (agora < new Date()) {
        agora.setDate(agora.getDate() + 1);
      }

      return Math.floor(agora.getTime() / 1000);
    };

    embed.addFields({
      name: `Horários de execução (${execucoes.status ? 'Ativo' : 'Inativo'})`,
      value: `\`${execucoes.abertura}\` (Abertura em <t:${toTimestamp(execucoes.abertura)}:R>)\n`
        + `\`${execucoes.fechamento}\` (Fechamento em <t:${toTimestamp(execucoes.fechamento)}:R>)`
    });
  }

  if (canais?.length > 0) {
    let canaismsg = "";
    canais.forEach((canal) => {
      canaismsg += `<#${canal}>\n`;
    });
    embed.addFields({ name: `Canais`, value: canaismsg });
  }

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("configurarCanais")
      .setLabel('Definir Regras')
      .setEmoji(`1233103066975309984`)
      .setStyle(1),
    new ButtonBuilder()
      .setCustomId("adicionarcanal_GerenciarCanais")
      .setLabel('Adicionar Canal')
      .setEmoji(`1233110125330563104`)
      .setStyle(3),
    new ButtonBuilder()
      .setCustomId("removercanal_GerenciarCanais")
      .setLabel('Remover Canal')
      .setEmoji(`1242907028079247410`)
      .setDisabled(canais?.length == 0)
      .setStyle(4),
  )

  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar_AcoesAutomaticsConfigs")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )

  await interaction.update({ content: ``, components: [row1, botoesvoltar], embeds: [embed], ephemeral: true })
}
async function SistemaNukar(interaction, client) {

  let canais = configuracao.get(`AutomaticSettings.SistemaNukar.canais`)

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Origins Bot`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
    .setTitle(`Nukar Canal`)
    .setDescription(`- Aqui você pode configurar o sistema de nukar.`)
    .setFooter(
      { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null }
    )
    .setTimestamp()

  if (configuracao.get(`AutomaticSettings.SistemaNukar.horario`)) {
    let execucoes = configuracao.get(`AutomaticSettings.SistemaNukar`);

    const toTimestamp = hora => {
      let [h, m] = hora.split(':');
      let agora = new Date();
      agora.setHours(h, m, 0, 0);

      if (agora < new Date()) {
        agora.setDate(agora.getDate() + 1);
      }

      return Math.floor(agora.getTime() / 1000);
    };

    embed.addFields({
      name: `Horário de execução (${execucoes.status ? 'Ativo' : 'Inativo'})`,
      value: `\`${execucoes.horario}\` (Próxima execução em <t:${toTimestamp(execucoes.horario)}:R>)`
    });
  }

  if (canais?.length > 0) {
    let canaismsg = "";
    canais.forEach((canal) => {
      canaismsg += `<#${canal}>\n`;
    });
    embed.addFields({ name: `Canais`, value: canaismsg });
  }

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("configurarNukar")
      .setLabel('Definir Regras')
      .setEmoji(`1233103066975309984`)
      .setStyle(1),
    new ButtonBuilder()
      .setCustomId("adicionarcanal_SistemaNukar")
      .setLabel('Adicionar Canal')
      .setEmoji(`1233110125330563104`)
      .setStyle(3),
    new ButtonBuilder()
      .setCustomId("removercanal_SistemaNukar")
      .setLabel('Remover Canal')
      .setEmoji(`1242907028079247410`)
      .setDisabled(canais?.length == 0)
      .setStyle(4),
  )

  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar_AcoesAutomaticsConfigs")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )

  await interaction.update({ content: ``, components: [row1, botoesvoltar], embeds: [embed], ephemeral: true })
}
async function SistemadeFiltro(interaction, client) {

  let info = configuracao.get(`AutomaticSettings.SistemadeFiltro`);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Origins Bot`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
    .setTitle(`Sistema de Filtro`)
    .setDescription(`- Aqui você pode configurar o sistema de filtro.`)
    .setFooter(
      { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null }
    )
    .setTimestamp()

  if (info) {
    const ms = require('ms');
    let tempo = info?.tempo == 'permanente' ? `Punição permantente.` : info?.tempo != undefined ? `${ms(info?.tempo)}` : `Não Definido`;
    embed.addFields(
      { name: `Regras de Execução (${info?.status ? 'Ativo' : 'Inativo'})`, value: `Punição: \`${info?.punicao ? info?.punicao?.charAt(0).toUpperCase() + info?.punicao?.slice(1) : `Sem Punição`}\`\nTempo: \`${info?.tempo == 'permanente' ? `Punição permantente.` : `${tempo}`}\`` },
    )
  }

  if (info?.cargos?.length > 0) {
    let cargos = "";
    info.cargos.forEach((cargo) => {
      cargos += `<@&${cargo}>\n`;
    });

    embed.addFields({ name: `Cargos Imunes`, value: cargos });
  }

  if (info?.categoria?.length > 0) {
    let categorias = "";
    info.categoria.forEach((categoria) => {
      categorias += `<#${categoria}>\n`;
    });

    embed.addFields({ name: `Categorias Imunes`, value: categorias });
  }

  if (info?.links?.length > 0 || info?.palavras?.length > 0) {
    let links = "";
    let palavras = "";

    info?.links.forEach((link) => {
      links += `${link.trim()}, `;
    });

    info?.palavras.forEach((palavra) => {
      palavras += `${palavra.trim()}, `;
    });

    if (links.length > 0) {
      links = links.slice(0, -2);
    }

    if (palavras.length > 0) {
      palavras = palavras.slice(0, -2);
    }

    let stringsalva = "";
    if (links.length > 0) {
      stringsalva += `Links: \`${links}\`\n`;
    }

    if (palavras.length > 0) {
      stringsalva += `Palavras: \`${palavras}\`\n`;
    }

    embed.addFields({
      name: `Informações de Filtros`,
      value: `Filtrar Convites: \`${info?.convites ? 'Ativo' : 'Inativo'}\`\n${stringsalva}`
    });

  }

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("configurarFiltro")
      .setLabel('Definir Regras')
      .setEmoji(`1233103066975309984`)
      .setStyle(3),
    new ButtonBuilder()
      .setCustomId("configuracaoexcecao")
      .setLabel('Definir Exceções')
      .setEmoji(`1234606184711979178`)
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId("adicionarFiltro")
      .setLabel('Gerenciar Filtro')
      .setEmoji(`1286078168855478446`)
      .setStyle(1),
  )

  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar_AcoesAutomaticsConfigs")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )

  await interaction.update({ content: ``, components: [row1, botoesvoltar], embeds: [embed], ephemeral: true })
}
async function msgbemvindo(interaction, client) {
  let msg = configuracao.get(`Entradas.msg`) || "Não definido";

  const mapeamentoSubstituicao = {
    "{member}": `<@${interaction.user.id}>`,
    "{guildname}": `${interaction.guild.name}`
  };

  const substituirPalavras = (match) => mapeamentoSubstituicao[match] || match;
  const stringNova = msg.replace(/{member}|{guildname}/g, substituirPalavras);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Origins Bot`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? "0cd4cc" : configuracao.get("Cores.Principal")}`)
    .setTitle("Configurar Boas vindas")
    .setDescription(`- Aqui você pode configurar a mensagem de boas vindas.`)
    .setFields(
      { name: `Mensagem`, value: `${configuracao.get("Entradas.msg") == null ? "Não definido" : stringNova}` }
    )
    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null })
    .setTimestamp();

  if (configuracao.get(`Entradas.tempo`)) {
    embed.addFields({ name: `Tempo`, value: `\`${configuracao.get(`Entradas.tempo`)} segundos\`` });
  }

  if (configuracao.get(`Entradas.canais`)?.length > 0) {
    let canais = "";
    configuracao.get(`Entradas.canais`).forEach((canal) => {
      canais += `<#${canal}>\n`;
    });
    embed.addFields({ name: `Canais`, value: canais });
  }

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("editarmensagemboasvindas").setLabel("Editar").setEmoji(`1178079212700188692`).setStyle(1),
    new ButtonBuilder().setCustomId('canaisboasvindas').setLabel('Canais').setEmoji(`1233127513178247269`).setStyle(1),
  );

  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar_AcoesAutomaticsConfigs")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )

  await interaction.update({ components: [row2, botoesvoltar], content: ``, embeds: [embed], ephemeral: true });
}
async function msgbemvindocanais(interaction, client) {
  let msg = configuracao.get(`Entradas.msg`);
  const mapeamentoSubstituicao = {
    "{member}": `<@${interaction.user.id}>`,
    "{guildname}": `${interaction.guild.name}`
  };

  const substituirPalavras = (match) => mapeamentoSubstituicao[match] || match;
  const stringNova = msg ? msg?.replace(/{member}|{guildname}/g, substituirPalavras) : "Não definido";

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Origins Bot`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? "0cd4cc" : configuracao.get("Cores.Principal")}`)
    .setTitle("Configurar Boas vindas")
    .setDescription(`- Aqui você pode configurar a mensagem de boas vindas.`)
    .setFields(
      { name: `Mensagem`, value: `${configuracao.get("Entradas.msg") == null ? "Não definido" : stringNova}` }
    )
    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null })
    .setTimestamp();

  if (configuracao.get(`Entradas.tempo`)) {
    embed.addFields({ name: `Tempo`, value: `\`${configuracao.get(`Entradas.tempo`)} segundos\`` });
  }

  if (configuracao.get(`Entradas.canais`)?.length > 0) {
    let canais = "";
    configuracao.get(`Entradas.canais`).forEach((canal) => {
      canais += `<#${canal}>\n`;
    });
    embed.addFields({ name: `Canais`, value: canais });
  }

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("adicionarcanal_msgbemvindocanais").setLabel("Adicionar Canais").setEmoji(`1233110125330563104`).setStyle(1),
    new ButtonBuilder().setCustomId("removercanalboasvindas").setLabel("Remover Canais").setEmoji(`1242907028079247410`).setStyle(1).setDisabled(configuracao.get(`Entradas.canais`)?.length == 0)
  );

  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar_msgbemvindo")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )

  await interaction.update({ content: ``, embeds: [embed], components: [row1, botoesvoltar], ephemeral: true });
}


module.exports = {
  AcoesAutomaticsConfigs,
  LimpezaAutomatica,
  msgbemvindo,
  msgbemvindocanais,
  GerenciarCanais,
  SistemaNukar,
  sistemaAntiRaid,
  SistemadeFiltro,
  SistemaAntiFake
}
