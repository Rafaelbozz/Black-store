const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { produtos, EmojisHelper } = require("../DataBaseJson");
const { res } = require("../res");

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

async function Painel(interaction, client) {

  const ownerId = interaction.guild.ownerId;
  const totalMembros = interaction.guild.memberCount;
  
  const ping = client.ws.ping;

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("painelconfigvendas")
      .setLabel('Gerenciar Loja')
      .setEmoji(`1384035200278728787`)
      .setStyle(3),
    new ButtonBuilder()
      .setCustomId("painelconfigticket")
      .setLabel('Sistema de Tickets')
      .setEmoji(`<:Atendimentopanel:1466878440970911815>`)
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId("sistemaauth")
      .setLabel('NexusCloud')
      .setEmoji(`1461201682317840476`)
      .setDisabled(true)
      .setStyle(1)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("eaffaawwawa")
      .setLabel('Automações')
      .setEmoji(`1384035191621812234`)
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId("painelpermissions")
      .setLabel('Gerenciar Perms')
      .setEmoji(`<:gerenciarpermsawdq:1466879504554393723>`)
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId("painelrendimentos")
      .setLabel('Rendimentos')
      .setEmoji(`1461205076185059467`)
      .setStyle(3)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("sistemasorteios")
      .setLabel('Gerenciar Sorteios')
      .setDisabled(true)
      .setEmoji(`<:hand_package_24dp_E3E3E3_FILL0_w:1466879741779906706>`)
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId("painelpersonalizar")
      .setLabel('Personalizar BOT')
      .setEmoji(`<:robuzwqd:1466879970705019073>`)
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId("gerenciarconfigs")
      .setLabel('Configuraçoes Gerais')
      .setEmoji(`<:build_24dp_E3E3E3_FILL0_wght400_:1466880256609620018>`)
      .setStyle(2)
  );

  const containerContent = res.main(
    { type: 10, content: `-# Painel Principal` },
    { type: 14 },
    { type: 10, content: `## Painel de Controle - Nexus Pro\n\n> ${getSaudacao()} **${interaction.user.username}**! Gerencie todas as funcionalidades do seu servidor através deste painel centralizado.` },
    { type: 14 },
    { type: 10, content: `**Informações**\n- Titular da Compra: <@${ownerId}>\n- Ping do Bot: \`${ping}ms\`\n- Membros no Servidor: \`${totalMembros}\`` },
    { type: 14 }
  ).with({
    components: [row1, row2, row3],
    flags: [64]
  });

  if (interaction.message == undefined) {
    interaction.reply(containerContent)
  } else {
    interaction.update(containerContent)
  }
}

async function Gerenciar2(interaction, client) {

  const ggg = produtos.valueArray();

  const rowVoltar = new ActionRowBuilder()
    .addComponents( 
      new ButtonBuilder()
        .setCustomId("voltar00")
        .setLabel('Voltar')
        .setEmoji(`1178068047202893869`)
        .setStyle(2)
    )

  const containerContent = res.main(
    { type: 10, content: `**Gerenciar Loja**` },
    { type: 14 },
    { type: 10, content: `${getSaudacao()} Senhor(a) **${interaction.user.username}**, aqui você pode configurar e gerenciar todos os produtos de sua loja!` },
    { type: 14 },
    { type: 10, content: `> ${Emojis.get('caixagrande')} **Produtos Criados:** \`${ggg.length}\`` },
    { type: 14 },
    {
      type: 1,
      components: [{
        type: 3,
        custom_id: "gerenciar_produtos_menu",
        placeholder: "Selecione uma opção",
        options: [
          {
            label: "Criar Produto",
            description: "Criar um novo produto na loja",
            value: "criarrrr",
            emoji: { id: "1178067873894236311" }
          },
          {
            label: "Gerenciar Produtos",
            description: "Gerenciar produtos existentes",
            value: "gerenciarotemae",
            emoji: { id: "1178067945855910078" }
          },
          {
            label: "Cargos Rank",
            description: "Configurar cargos de ranking",
            value: "gerenciarposicao",
            emoji: { id: "1178086608004722689" }
          },
          {
            label: "Painel de Solicitar Stock",
            description: "Configurar painel de solicitação de estoque",
            value: "painel-solicitar-stock",
            emoji: { id: "1459316241490776197" }
          },
          {
            label: "Termos da Loja",
            description: "Configurar termos de uso da loja",
            value: "painel_termos_loja",
            emoji: { id: "1462646836115407004" }
          },
          {
            label: "Personalizar QR Code",
            description: "Personalizar aparência dos QR Codes de pagamento",
            value: "personalizar_qrcode",
            emoji: { id: "1462991149764575342" }
          }
        ]
      }]
    }
  ).with({
    components: [rowVoltar],
    flags: [64]
  });

  await interaction.update(containerContent)
}

async function PainelExtensoes(interaction, client) {
  const rowVoltar = new ActionRowBuilder()
    .addComponents( 
      new ButtonBuilder()
        .setCustomId("gerenciarconfigs")
        .setLabel('Voltar')
        .setEmoji(`1178068047202893869`)
        .setStyle(2)
    )

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Extensões` },
    { type: 14 },
    { type: 10, content: `## Central de Extensões\n\n> Expanda as funcionalidades do seu bot com módulos adicionais.\n> Cada extensão adiciona novos recursos e possibilidades ao seu sistema de vendas!` },
    { type: 14 },
    { type: 10, content: `**Extensões Disponíveis**\n- Sistema Robux - Sistema completo para venda de Robux e Gamepasses` },
    { type: 14 },
    {
      type: 1,
      components: [{
        type: 3,
        custom_id: "extensoes_select_menu",
        placeholder: "Selecione uma extensão para mais informações",
        options: [
          {
            label: "Sistema Robux",
            description: "Venda de Robux e Gamepasses com pagamento automático",
            value: "robux_system",
            emoji: { id: "1350550813898178570" }
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

module.exports = {
  Painel,
  Gerenciar2,
  PainelExtensoes
}
