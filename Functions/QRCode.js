const { ActionRowBuilder, ButtonBuilder, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { produtos, configuracao, Emojis } = require("../DataBaseJson");
const { res } = require("../res");
const Jimp = require("jimp"); 
const QRCode = require("qrcode");
const fs = require("fs");

async function configqrcode(interaction, client) {
  const config = configuracao.get("QRCode") || {
    principal: "#000000",
    lateral: "#0A3D3E",
    brilho: "#B19CD9",
    gradient: "radial"
  };

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`qrcode-button`)
      .setLabel(`Trocar Logo Qrcode`)
      .setEmoji(`1238299494181896306`)
      .setStyle(1)
  )

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`qrcode-colors`)
      .setLabel(`Editar Cores`)
      .setEmoji(`${Emojis.get(`_pincel_emoji`)}`)
      .setStyle(1),
    new ButtonBuilder()
      .setCustomId(`qrcode-teste`)
      .setLabel(`Testar`)
      .setEmoji(`${Emojis.get(`_star_emoji`)}`)
      .setStyle(2),
  )

  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar_painel_vendas")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Sistema de Vendas > Personalizar QR Code` },
    { type: 14 },
    { type: 10, content: `## ${Emojis.get('_pincel_emoji') || '🎨'} Personalização de QR Code` },
    { type: 14 },
    { type: 10, content: `Aqui você pode personalizar a aparência dos QR Codes de pagamento da sua loja.` },
    { type: 14 },
    { type: 10, content: `### Configurações Atuais:` },
    { type: 10, content: `> **Cor Principal:** \`${config.principal}\`` },
    { type: 10, content: `> **Cor Lateral:** \`${config.lateral}\`` },
    { type: 10, content: `> **Cor de Brilho:** \`${config.brilho}\`` },
    { type: 10, content: `> **Tipo de Gradiente:** \`${config.gradient}\`` },
    { type: 14 }
  ).with({
    components: [row1, row2, botoesvoltar],
    flags: [64]
  });

  if (interaction.message) {
    await interaction.update(containerContent)
  } else {
    await interaction.reply(containerContent)
  }
}

async function editarCoresQRCode(interaction) {
  const config = configuracao.get("QRCode") || {
    principal: "#000000",
    lateral: "#0A3D3E",
    brilho: "#B19CD9",
    gradient: "radial"
  };

  const modal = new ModalBuilder()
    .setCustomId('modal_qrcode_colors')
    .setTitle('Editar Cores do QR Code');

  const corPrincipalInput = new TextInputBuilder()
    .setCustomId('cor_principal')
    .setLabel('Cor Principal (Hex)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('#000000')
    .setValue(config.principal)
    .setRequired(true)
    .setMaxLength(7)
    .setMinLength(7);

  const corLateralInput = new TextInputBuilder()
    .setCustomId('cor_lateral')
    .setLabel('Cor Lateral (Hex)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('#0A3D3E')
    .setValue(config.lateral)
    .setRequired(true)
    .setMaxLength(7)
    .setMinLength(7);

  const corBrilhoInput = new TextInputBuilder()
    .setCustomId('cor_brilho')
    .setLabel('Cor de Brilho/Gradiente (Hex)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('#B19CD9')
    .setValue(config.brilho)
    .setRequired(true)
    .setMaxLength(7)
    .setMinLength(7);

  const gradientInput = new TextInputBuilder()
    .setCustomId('gradient_type')
    .setLabel('Tipo de Gradiente')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('radial ou linear')
    .setValue(config.gradient)
    .setRequired(true)
    .setMaxLength(10);

  const row1 = new ActionRowBuilder().addComponents(corPrincipalInput);
  const row2 = new ActionRowBuilder().addComponents(corLateralInput);
  const row3 = new ActionRowBuilder().addComponents(corBrilhoInput);
  const row4 = new ActionRowBuilder().addComponents(gradientInput);

  modal.addComponents(row1, row2, row3, row4);

  await interaction.showModal(modal);
}

async function salvarCoresQRCode(interaction) {
  const corPrincipal = interaction.fields.getTextInputValue('cor_principal');
  const corLateral = interaction.fields.getTextInputValue('cor_lateral');
  const corBrilho = interaction.fields.getTextInputValue('cor_brilho');
  const gradientType = interaction.fields.getTextInputValue('gradient_type');

  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!hexRegex.test(corPrincipal) || !hexRegex.test(corLateral) || !hexRegex.test(corBrilho)) {
    return interaction.reply({
      content: `${Emojis.get('negative') || '❌'} Formato de cor inválido! Use o formato hexadecimal: #RRGGBB`,
      ephemeral: true
    });
  }

  if (!['radial', 'linear'].includes(gradientType.toLowerCase())) {
    return interaction.reply({
      content: `${Emojis.get('negative') || '❌'} Tipo de gradiente inválido! Use "radial" ou "linear".`,
      ephemeral: true
    });
  }

  configuracao.set("QRCode", {
    principal: corPrincipal,
    lateral: corLateral,
    brilho: corBrilho,
    gradient: gradientType.toLowerCase()
  });

  await interaction.reply({
    content: `${Emojis.get('positive') || '✅'} Cores do QR Code atualizadas com sucesso!\n> **Cor Principal:** \`${corPrincipal}\`\n> **Cor Lateral:** \`${corLateral}\`\n> **Cor de Brilho:** \`${corBrilho}\`\n> **Gradiente:** \`${gradientType.toLowerCase()}\``,
    ephemeral: true
  });

  setTimeout(() => {
    configqrcode(interaction, interaction.client);
  }, 1000);
}

async function TestarQRCode(interaction, client) {
  await interaction.reply({
    content: `${Emojis.get(`loading`)} Aguarde...`,
    ephemeral: true,
    components: [],
    embeds: []
  });

  const valor = 10.00;
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136teste@pix.com.br520400005303986540510.005802BR5913Nome Teste6009Sao Paulo62140510BOTDISCORD6304ABCD`;

  try {
    const qrBase64 = await QRCode.toDataURL(pixCode, {
      errorCorrectionLevel: 'H',
      width: 500
    });

    const qrImage = await Jimp.read(Buffer.from(qrBase64.split(',')[1], 'base64'));

    const logo = await Jimp.read('./Lib/aaaaa.png');
    logo.resize(100, 100);

    const x = (qrImage.bitmap.width / 2) - (logo.bitmap.width / 2);
    const y = (qrImage.bitmap.height / 2) - (logo.bitmap.height / 2);
    qrImage.composite(logo, x, y);

    const qrBuffer = await qrImage.getBufferAsync(Jimp.MIME_PNG);
    const attachment = new AttachmentBuilder(qrBuffer, { name: "qrcode.png" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("codigocopiaecola")
        .setLabel("Código copia e cola")
        .setEmoji("📋")
        .setDisabled(true)
        .setStyle(2),
      new ButtonBuilder()
        .setCustomId("cancelar_pagamento")
        .setLabel("Cancelar")
        .setDisabled(true)
        .setStyle(4)
    );

    const containerContent = res.main(
      { 
        type: 12, 
        items: [{ media: { url: "attachment://qrcode.png" }, spoiler: false }] 
      },
      { type: 14 },
      { type: 10, content: `${Emojis.get("pix_stamp_emoji")} **Pagamento via PIX simulado**` },
      { type: 14 },
      { type: 10, content: `> ${Emojis.get("money_emoji")} **Valor:** R$ ${valor.toFixed(2)}\n> ${Emojis.get("time_emoji")} **Expira em:** ⏳ 15 segundos` },
      { type: 14 },
      { type: 10, content: `> ${Emojis.get("information_emoji")} **Código Copia e Cola:**\n\`\`\`${pixCode}\`\`\`` }
    ).with({
      components: [row],
      files: [attachment],
      flags: [64]
    });

    await interaction.editReply(containerContent);

    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (err) {
        console.error("Erro ao apagar mensagem:", err);
      }
    }, 15000);

  } catch (err) {
    console.error("Erro ao gerar QR Code com logo:", err);
    return interaction.editReply({
      content: `${Emojis.get("negative")} Ocorreu um erro ao gerar o QR Code com logo.`,
      ephemeral: true
    });
  }
}

module.exports = {
  configqrcode,
  TestarQRCode,
  editarCoresQRCode,
  salvarCoresQRCode
}
