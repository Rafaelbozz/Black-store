const { ApplicationCommandType, EmbedBuilder, Webhook, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
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


async function PermsAvançados24(interaction, client) {

    const embed = new EmbedBuilder()
    .setColor("Aqua")
    .setAuthor({ name: "Sistema de permissão avançada", iconURL: 'https://cdn.discordapp.com/emojis/1238672086164049930.png?size=2048' })
    .setDescription("> ** Gerencie Permissões avançadas de usuarios especificos**")
    .setFooter({ text: "Sistema de permissão avançada", iconURL: 'https://cdn.discordapp.com/emojis/1250223548019245099.gif?size=2048' })
    .setTimestamp();

const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('selectmenuperm24')
    .setPlaceholder('Configuração de permissão avançada')
    .addOptions([
        {
            label: 'Configurações De Perm de pagamento',
            description: 'Adicionar permissão para um usuario conseguir acessar a configuração de pagamento',
            emoji: '1259713258395537418',
            value: 'pagamentoperm24',
        },
        {
            label: 'Remover Permissão',
            description: 'Retirar permissão de um usuario ( Ira tirar todas as perms avançadas dele )',
            emoji: '1269773207544664084',
            value: 'removerperm24',
        },
        {
            label: 'Lista de permissões',
            description: 'Ver Todos os usuarios com permissões Avançadas',
            emoji: '1231917967441264740',
            value: 'listaperm24',
        },
    ]);

const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId("permissaoadm")
        .setLabel('Voltar')
        .setEmoji(`1264710894345130097`)
        .setStyle(2)
        .setDisabled(false)
);

const row2 = new ActionRowBuilder().addComponents(selectMenu)

await interaction.update({ embeds: [embed], content: `${getSaudacao()} Senhor ${interaction.user}`, components: [row2, row], ephemeral: true });


}


module.exports = {
    PermsAvançados24
}
