const { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const fs   = require("fs");
const path = require("path");
const { res } = require("../res");
const owner = require("../config.json");
const emojis = require("../DataBaseJson/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

async function PainelPermissions(interaction, client) {
  const permsFilePath = path.join(__dirname, "..", "DataBaseJson", "perms.json");

  if (interaction.user.id !== owner.owner) {
    const containerErro = res.main(
      { type: 10, content: `${Emojis.get('negative')} | Apenas o owner do bot pode acessar este painel.` }
    ).with({ flags: [64] });
    
    return interaction.reply(containerErro);
  }

  let perms = {};
  try {
    if (fs.existsSync(permsFilePath)) {
      delete require.cache[require.resolve(permsFilePath)];
      perms = require(permsFilePath);
    }
  } catch (err) {
    console.error("Erro ao ler perms.json:", err);
  }

  const membersWithPerms = [];
  for (const uid of Object.keys(perms)) {
    try {
      const member = await interaction.guild.members.fetch(uid);
      membersWithPerms.push(member);
    } catch {/* ignora IDs que não estão mais no servidor */}
  }

  const membersList = membersWithPerms.length
    ? membersWithPerms.map(m => `>  ${m} \`(${m.id})\``).join("\n")
    : `> ${Emojis.get('negative')} Nenhum membro foi autorizado ainda.`;

  const rowVoltar = new ActionRowBuilder()
    .addComponents( 
      new ButtonBuilder()
        .setCustomId("voltar00")
        .setLabel('Voltar')
        .setEmoji(`1178068047202893869`)
        .setStyle(2)
    )

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Permissions` },
    { type: 14 },
    { type: 10, content: `## ${Emojis.get('permissions_emoji')} Gerenciar Permissões` },
    { type: 14 },
    { type: 10, content: `**Membros Autorizados (${membersWithPerms.length})**\n${membersList}` },
    { type: 14 },
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: 'Adicionar', custom_id: 'adicionar_perm', emoji: { id: '1384035181790498967' } },
        { type: 2, style: 2, label: 'Remover', custom_id: 'remover_perm', emoji: { id: '1387981753788010497' } },
        { type: 2, style: 4, label: 'Resetar Lista', custom_id: 'resetar_perms', emoji: { id: '1384035185217110077' } }
      ]
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

async function ModalAdicionarPerm(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('modal_adicionar_perm')
    .setTitle('Adicionar Permissão')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('user_id_perm')
          .setLabel('ID DO USUÁRIO')
          .setPlaceholder('Cole o ID do usuário aqui')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

  await interaction.showModal(modal);
}

async function ModalRemoverPerm(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('modal_remover_perm')
    .setTitle('Remover Permissão')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('user_id_perm')
          .setLabel('ID DO USUÁRIO')
          .setPlaceholder('Cole o ID do usuário para remover')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

  await interaction.showModal(modal);
}

async function HandleAdicionarPerm(interaction, client) {
  const permsFilePath = path.join(__dirname, "..", "DataBaseJson", "perms.json");
  const userId = interaction.fields.getTextInputValue('user_id_perm').trim();

  if (!/^\d{17,19}$/.test(userId)) {
    const containerErro = res.main(
      { type: 10, content: `${Emojis.get('negative')} | ID inválido! Insira um ID de usuário válido.` }
    ).with({ flags: [64] });
    
    return interaction.reply(containerErro);
  }

  let perms = {};
  if (fs.existsSync(permsFilePath)) {
    perms = JSON.parse(fs.readFileSync(permsFilePath, 'utf8'));
  }

  if (perms[userId]) {
    const containerErro = res.main(
      { type: 10, content: `${Emojis.get('negative')} | Este usuário já possui permissão!` }
    ).with({ flags: [64] });
    
    return interaction.reply(containerErro);
  }

  perms[userId] = userId;
  fs.writeFileSync(permsFilePath, JSON.stringify(perms, null, 2));

  await interaction.deferUpdate();
  await MostrarPainelPermissionsAtualizado(interaction, client, `${Emojis.get('checker')} | Permissão adicionada com sucesso!`);
}

async function HandleRemoverPerm(interaction, client) {
  const permsFilePath = path.join(__dirname, "..", "DataBaseJson", "perms.json");
  const userId = interaction.fields.getTextInputValue('user_id_perm').trim();

  let perms = {};
  if (fs.existsSync(permsFilePath)) {
    perms = JSON.parse(fs.readFileSync(permsFilePath, 'utf8'));
  }

  if (!perms[userId]) {
    const containerErro = res.main(
      { type: 10, content: `${Emojis.get('negative')} | Este usuário não possui permissão!` }
    ).with({ flags: [64] });
    
    return interaction.reply(containerErro);
  }

  if (userId === owner.owner) {
    const containerErro = res.main(
      { type: 10, content: `${Emojis.get('negative')} | Você não pode remover o owner do bot!` }
    ).with({ flags: [64] });
    
    return interaction.reply(containerErro);
  }

  delete perms[userId];
  fs.writeFileSync(permsFilePath, JSON.stringify(perms, null, 2));

  await interaction.deferUpdate();
  await MostrarPainelPermissionsAtualizado(interaction, client, `${Emojis.get('checker')} | Permissão removida com sucesso!`);
}

async function HandleResetarPerms(interaction, client) {
  const permsFilePath = path.join(__dirname, "..", "DataBaseJson", "perms.json");

  const perms = {
    [owner.owner]: owner.owner
  };

  fs.writeFileSync(permsFilePath, JSON.stringify(perms, null, 2));

  await interaction.deferUpdate();
  await MostrarPainelPermissionsAtualizado(interaction, client, `${Emojis.get('checker')} | Lista de permissões resetada! Apenas o owner permanece.`);
}

async function MostrarPainelPermissionsAtualizado(interaction, client, mensagemSucesso) {
  const permsFilePath = path.join(__dirname, "..", "DataBaseJson", "perms.json");

  let perms = {};
  try {
    if (fs.existsSync(permsFilePath)) {
      delete require.cache[require.resolve(permsFilePath)];
      perms = JSON.parse(fs.readFileSync(permsFilePath, 'utf8'));
    }
  } catch (err) {
    console.error("Erro ao ler perms.json:", err);
  }

  const membersWithPerms = [];
  for (const uid of Object.keys(perms)) {
    try {
      const member = await interaction.guild.members.fetch(uid);
      membersWithPerms.push(member);
    } catch {/* ignora IDs que não estão mais no servidor */}
  }

  const membersList = membersWithPerms.length
    ? membersWithPerms.map(m => `>  ${m} \`(${m.id})\``).join("\n")
    : `> ${Emojis.get('negative')} Nenhum membro foi autorizado ainda.`;

  const rowVoltar = new ActionRowBuilder()
    .addComponents( 
      new ButtonBuilder()
        .setCustomId("voltar00")
        .setLabel('Voltar')
        .setEmoji(`1178068047202893869`)
        .setStyle(2)
    )

  const containerContent = res.main(
    { type: 10, content: `-# Painel > Permissions` },
    { type: 14 },
    { type: 10, content: mensagemSucesso },
    { type: 14 },
    { type: 10, content: `## ${Emojis.get('permissions_emoji')} Gerenciar Permissões` },
    { type: 14 },
    { type: 10, content: `**Membros Autorizados (${membersWithPerms.length})**\n${membersList}` },
    { type: 14 },
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: 'Adicionar', custom_id: 'adicionar_perm', emoji: { id: '1384035181790498967' } },
        { type: 2, style: 2, label: 'Remover', custom_id: 'remover_perm', emoji: { id: '1387981753788010497' } },
        { type: 2, style: 4, label: 'Resetar Lista', custom_id: 'resetar_perms', emoji: { id: '1384035185217110077' } }
      ]
    }
  ).with({
    components: [rowVoltar],
    flags: [64]
  });

  await interaction.editReply(containerContent);
}

module.exports = { 
  PainelPermissions, 
  ModalAdicionarPerm, 
  ModalRemoverPerm, 
  HandleAdicionarPerm, 
  HandleRemoverPerm, 
  HandleResetarPerms 
};
