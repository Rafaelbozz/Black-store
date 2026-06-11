const { ActionRowBuilder, ButtonBuilder, ChannelType, EmbedBuilder } = require("discord.js");
const { configsticket, configuracao } = require("../DataBaseJson");
const emojis = require("../DataBaseJson/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

async function CreateTicket(interaction, client, funcaoId) {
  try {
    const { atendimentosAI } = require("../DataBaseJson");
    
    const todosTickets = atendimentosAI.all();
    const ticketExistente = todosTickets.find(ticket => {
      if (!ticket.data || !ticket.data.dono) return false;
      
      if (ticket.data.dono !== interaction.user.id) return false;
      
      try {
        const threadId = ticket.ID;
        const thread = interaction.guild.channels.cache.get(threadId);
        
        if (thread && !thread.archived) {
          return true;
        }
      } catch (error) {
        return false;
      }
      
      return false;
    });
    
    if (ticketExistente) {
      const threadId = ticketExistente.ID;
      const rowLink = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setURL(`https://discord.com/channels/${interaction.guild.id}/${threadId}`)
          .setLabel('Ir para o ticket')
          .setStyle(5)
      );
      
      return interaction.reply({
        content: `${Emojis.get('negative')} | Você já possui um ticket aberto! Por favor, finalize o ticket atual antes de abrir um novo.`,
        components: [rowLink],
        ephemeral: true
      });
    }
    
    const horarioAtivo = configsticket.get('horarioAtendimento.ativo') || false;
    
    if (horarioAtivo) {
      const horarioInicio = configsticket.get('horarioAtendimento.inicio');
      const horarioFim = configsticket.get('horarioAtendimento.fim');
      
      if (horarioInicio && horarioFim) {
        const agora = new Date();
        const horaAtual = agora.getHours();
        const minutoAtual = agora.getMinutes();
        
        const [horaInicio, minutoInicio] = horarioInicio.split(':').map(Number);
        const [horaFim, minutoFim] = horarioFim.split(':').map(Number);
        
        const minutosAtual = horaAtual * 60 + minutoAtual;
        const minutosInicio = horaInicio * 60 + minutoInicio;
        const minutosFim = horaFim * 60 + minutoFim;
        
        if (minutosAtual < minutosInicio || minutosAtual > minutosFim) {
          return interaction.reply({
            content: `${Emojis.get('negative')} | O atendimento está disponível apenas das **${horarioInicio}** às **${horarioFim}**. Por favor, retorne neste horário.`,
            ephemeral: true
          });
        }
      }
    }
    
    const folgasAtivo = configsticket.get('horarioAtendimento.folgasAtivo') || false;
    
    if (folgasAtivo) {
      const diasFolga = configsticket.get('horarioAtendimento.diasFolga') || [];
      
      if (diasFolga.length > 0) {
        const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const diaAtual = diasSemana[new Date().getDay()];
        
        if (diasFolga.includes(diaAtual)) {
          return interaction.reply({
            content: `${Emojis.get('negative')} | Hoje é **${diaAtual}** e não há atendimento. Nossos dias de folga são: **${diasFolga.join(', ')}**. Por favor, retorne em outro dia.`,
            ephemeral: true
          });
        }
      }
    }
    
    const funcao = configsticket.get(`funcoes.${funcaoId}`);
    
    if (!funcao) {
      return interaction.reply({
        content: `${Emojis.get('negative')} | Função de ticket não encontrada. Por favor, tente novamente.`,
        ephemeral: true
      });
    }
    
    await interaction.reply({
      content: `${Emojis.get('loading')} Aguarde, estamos criando seu atendimento...`,
      ephemeral: true
    });
    
    const thread = await interaction.channel.threads.create({
      name: `🎫・${funcao.nome}・${interaction.user.username}`,
      autoArchiveDuration: 10080,
      type: ChannelType.PrivateThread,
      reason: `Ticket aberto por ${interaction.user.tag}`
    });
    
    await thread.members.add(interaction.user.id);
    
    await thread.setArchived(false).catch(err => console.error('[TICKET] Erro ao desarquivar:', err));
    await thread.setLocked(false).catch(err => console.error('[TICKET] Erro ao desbloquear:', err));
    
    atendimentosAI.set(`${thread.id}`, {
      dono: interaction.user.id,
      donoTag: interaction.user.tag,
      donoUsername: interaction.user.username,
      funcao: funcaoId,
      funcaoNome: funcao.nome,
      criadoEm: Date.now(),
      guildId: interaction.guild.id,
      guildName: interaction.guild.name,
      assumido: false,
      assumidoPor: null,
      chat: []
    });
    
    const cargoSup = configuracao.get('ConfigRoles.cargosup');
    const cargoAdm = configuracao.get('ConfigRoles.cargoadm');
    
    let mencoes = `${interaction.user}`;
    if (cargoSup) mencoes += ` <@&${cargoSup}>`;
    if (cargoAdm) mencoes += ` <@&${cargoAdm}>`;
    
    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: `${interaction.guild.name} - Sistema de Atendimento`, 
        iconURL: interaction.guild.iconURL() || undefined 
      })
      .setDescription(`> - Olá ${interaction.user}, seu atendimento foi criado com sucesso! e nossa equipe staff ja foi mencionada por favor seja direto e explique o que voce precisa que em breve voce sera atendido.`)
      .setColor('#2b2d31')
      .setTimestamp()
      .setFooter({ text: `Ticket de ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_notificar_${thread.id}`)
        .setLabel('Notificar usuario')
        .setEmoji('1471697498656477376')
        .setStyle(2),
      new ButtonBuilder()
        .setCustomId(`ticket_renomear_${thread.id}`)
        .setLabel('Renomeiar')
        .setEmoji('1384035217550868493')
        .setStyle(2),
      new ButtonBuilder()
        .setCustomId(`ticket_deletar_salvar_${thread.id}`)
        .setLabel('Deletar e Salvar')
        .setEmoji('1384035185217110077')
        .setStyle(4)
    );
    
    await thread.send({
      content: mencoes,
      embeds: [embed],
      components: [row]
    });
    
    const rowLink = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`)
        .setLabel('Ir para o ticket')
        .setStyle(5)
    );
    
    await interaction.editReply({
      content: `${Emojis.get('checker')} | Seu ticket foi criado com sucesso! Clique no botão abaixo para acessá-lo.`,
      components: [rowLink]
    });
    
  } catch (error) {
    console.error('[ERRO CREATE TICKET]', error);
    
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content: `${Emojis.get('negative')} | Erro ao criar ticket: ${error.message}`,
          components: []
        });
      } else {
        await interaction.reply({
          content: `${Emojis.get('negative')} | Erro ao criar ticket: ${error.message}`,
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('[ERRO CREATE TICKET] Erro ao enviar mensagem de erro:', replyError);
    }
  }
}

module.exports = { CreateTicket };
