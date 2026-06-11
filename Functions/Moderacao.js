const { ApplicationCommandType, EmbedBuilder, Webhook, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");
const client = require("discord.js")
const { produtos, configuracao } = require("../DataBaseJson");
const startTime = Date.now();
const maxMemory = 100;
const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
const memoryUsagePercentage = (usedMemory / maxMemory) * 100;
const roundedPercentage = Math.min(100, Math.round(memoryUsagePercentage));

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


async function Moderação(interaction, client) {

  const embed = new EmbedBuilder()
  .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
  .setTitle(`Painel De Moderação Avançada | Offline`)
  .setAuthor({ name: `Gerenciador Avançado`, iconURL: 'https://cdn.discordapp.com/emojis/1269773226960093184.png?size=2048' })
  .setDescription(`> ** ${getSaudacao()} Sr ${interaction.user}, Utilize os botões abaixo para configurar o ${client.user}.**`)
  .addFields(
    { name: `**Versão Atual**`, value: `1.0.0`, inline: true },
    { name: `**Tempo On**`, value: `<t:${Math.ceil(startTime / 1000)}:R>`, inline: true }
  )
  .setFooter(
    { text: 'Configuração geral', iconURL: 'https://cdn.discordapp.com/emojis/1278805406671437975.gif?size=2048' }
  )
  .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("ecloud")
        .setLabel('Meu eCloud')
        .setEmoji(`1249486224100556930`)
        .setStyle(1)
        .setDisabled(true),

        new ButtonBuilder()
        .setCustomId("backupsystem")
        .setLabel('Backup')
        .setEmoji(`1255233514228678840`)
        .setStyle(1)
        .setDisabled(true),

        new ButtonBuilder()
        .setCustomId("voltar1")
        .setLabel('Voltar')
        .setEmoji(`1178068047202893869`)
        .setStyle(2)
        .setDisabled(false),
    )

    interaction.update({ embeds: [embed], components: [row], content: '', ephemeral: true})


}


module.exports = {
    Moderação
}
