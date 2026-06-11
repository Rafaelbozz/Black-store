const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { BackupStorage } = require("../DataBaseJson");
const { res } = require("../res");

async function PainelBackupSystem(interaction, client) {
    const guildId = interaction.guild.id;
    
    const backupData = BackupStorage.get(`Backup_${guildId}`);
    const backupInfo = BackupStorage.get(`BackupInfo_${guildId}`) || {
        lastBackup: null,
        nextBackup: Date.now() + (60 * 60 * 1000),
        autoBackupEnabled: true,
        intervalMinutes: 60
    };

    const lastBackupTimestamp = backupInfo.lastBackup 
        ? `<t:${Math.floor(backupInfo.lastBackup / 1000)}:R>` 
        : '`Nenhum backup realizado ainda`';
    
    const systemStatus = `\`🟢 Sincronizando Todos os Dados Automaticamente\``;

    const nextBackupTimestamp = backupInfo.nextBackup
        ? `<t:${Math.floor(backupInfo.nextBackup / 1000)}:R>`
        : `<t:${Math.floor((Date.now() + 60 * 60 * 1000) / 1000)}:R>`;

    let backupStats = '\n`Nenhum backup realizado ainda`';
    if (backupData && backupData.length > 0) {
        const data = backupData[0];
        backupStats = `\n- Canais: \`${data.channels?.length || 0}\`\n- Cargos: \`${data.roles?.length || 0}\`\n- Emojis: \`${data.emojis?.length || 0}\`\n- Stickers: \`${data.stickers?.length || 0}\`\n- Mensagens: \`${data.msgs?.length || 0}\``;
    }

    const rowActions = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("backup_manual")
            .setLabel('Fazer Backup Manual')
            .setEmoji('1472812649216737302')
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("backup_restore")
            .setLabel('Restaurar Servidor')
            .setEmoji('1471592324294250689')
            .setStyle(2)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_ilusioncloud")
            .setLabel('Voltar')
            .setEmoji(`1178068047202893869`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > NexusCloud > Sistema de Backup` },
        { type: 14 },
        { type: 10, content: `## Sistema de Backup Automático\n\n> Proteja seu servidor com backups automáticos completos.\n> Todos os canais, cargos, permissões, emojis e configurações são salvos.` },
        { type: 14 },
        { type: 10, content: `**Informação do Sistema**\n- **Último Backup Realizado:** ${lastBackupTimestamp}\n- **Status do Sistema:** ${systemStatus}\n- **Próxima Execução:** ${nextBackupTimestamp}` },
        { type: 14 },
        { type: 10, content: `**Estatísticas do Último Backup:**${backupStats}` },
        { type: 14 },
        { type: 10, content: `**Informações:**\n- Backups são salvos localmente e na nuvem\n- Emojis e stickers são baixados automaticamente\n- Intervalo: A cada 60 minutos\n- Sistema sempre ativo para máxima segurança` }
    ).with({
        components: [rowActions, rowVoltar],
        flags: [64]
    });

    if (interaction.message == undefined) {
        interaction.reply(containerContent);
    } else {
        interaction.update(containerContent);
    }
}

module.exports = {
    PainelBackupSystem
};
