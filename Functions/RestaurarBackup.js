const { PermissionsBitField, ChannelType } = require('discord.js');
const { BackupStorage, EmojisHelper } = require('../DataBaseJson');
const fs = require('fs');
const path = require('path');

const Emojis = EmojisHelper;

async function RestaurarBackup(guild, backupData, user) {
    let dmChannel;
    try {
        dmChannel = await user.createDM();
    } catch (error) {
        console.error('Erro ao criar DM:', error);
        return { success: false, error: 'Não foi possível enviar mensagens na DM' };
    }

    const etapas = [
        `${Emojis.get('loading')} | Deletando Canais do servidor`,
        `${Emojis.get('loading')} | Deletando Cargos do servidor`,
        `${Emojis.get('loading')} | Deletando Stickers`,
        `${Emojis.get('loading')} | Deletando Emojis`,
        `${Emojis.get('loading')} | Recriando Cargos`,
        `${Emojis.get('loading')} | Recriando Canais`,
        `${Emojis.get('loading')} | Configurando Permissões`,
        `${Emojis.get('loading')} | Realocando Emojis`,
        `${Emojis.get('loading')} | Realocando Stickers`,
        `${Emojis.get('loading')} | Aplicando Configurações do Servidor`
    ];

    let mensagemStatus = await dmChannel.send({
        content: `**Sistema de Recriação Iniciado**\n\n${etapas.join('\n')}`
    });

    const atualizarEtapa = async (indice) => {
        const etapasAtualizadas = etapas.map((etapa, i) => {
            if (i < indice) return etapa.replace(Emojis.get('loading'), Emojis.get('checker'));
            if (i === indice) return etapa.replace(Emojis.get('loading'), Emojis.get('loading'));
            return etapa;
        });
        
        await mensagemStatus.edit({
            content: `**Sistema de Recriação Iniciado**\n\n${etapasAtualizadas.join('\n')}`
        });
    };

    try {
        const backup = backupData[0];

        await atualizarEtapa(0);
        const canaisParaManter = [];
        for (const channel of guild.channels.cache.values()) {
            if (channel.id !== guild.id) {
                try {
                    await channel.delete();
                } catch (err) {
                    console.error(`Erro ao deletar canal ${channel.name}:`, err);
                }
            }
        }

        await atualizarEtapa(1);
        for (const role of guild.roles.cache.values()) {
            if (role.id !== guild.id && !role.managed && role.position < guild.members.me.roles.highest.position) {
                try {
                    await role.delete();
                } catch (err) {
                    console.error(`Erro ao deletar cargo ${role.name}:`, err);
                }
            }
        }

        await atualizarEtapa(2);
        for (const sticker of guild.stickers.cache.values()) {
            try {
                await sticker.delete();
            } catch (err) {
                console.error(`Erro ao deletar sticker ${sticker.name}:`, err);
            }
        }

        await atualizarEtapa(3);
        for (const emoji of guild.emojis.cache.values()) {
            try {
                await emoji.delete();
            } catch (err) {
                console.error(`Erro ao deletar emoji ${emoji.name}:`, err);
            }
        }

        await atualizarEtapa(4);
        const rolesMap = new Map();
        const rolesSorted = backup.roles.sort((a, b) => b.position - a.position);
        
        for (const roleData of rolesSorted) {
            if (roleData.managed) continue;
            
            try {
                const newRole = await guild.roles.create({
                    name: roleData.name,
                    color: roleData.color,
                    hoist: roleData.hoist,
                    permissions: BigInt(roleData.permissions),
                    mentionable: roleData.mentionable
                });
                rolesMap.set(roleData.id, newRole.id);
            } catch (err) {
                console.error(`Erro ao criar cargo ${roleData.name}:`, err);
            }
        }
        
        try {
            const allRoles = Array.from(guild.roles.cache.values())
                .filter(r => r.id !== guild.id)
                .sort((a, b) => {
                    const aData = backup.roles.find(rd => rolesMap.get(rd.id) === a.id);
                    const bData = backup.roles.find(rd => rolesMap.get(rd.id) === b.id);
                    if (!aData || !bData) return 0;
                    return bData.position - aData.position;
                });
            
            await guild.roles.setPositions(
                allRoles.map((role, index) => ({
                    role: role.id,
                    position: allRoles.length - index
                }))
            );
        } catch (err) {
            console.error('Erro ao reordenar cargos:', err);
        }

        await atualizarEtapa(5);
        const channelsMap = new Map();
        
        const categorias = backup.channels.filter(c => c.type === 4).sort((a, b) => a.position - b.position);
        for (const catData of categorias) {
            try {
                const newCat = await guild.channels.create({
                    name: catData.name,
                    type: ChannelType.GuildCategory,
                    position: catData.position
                });
                channelsMap.set(catData.id, newCat.id);
            } catch (err) {
                console.error(`Erro ao criar categoria ${catData.name}:`, err);
            }
        }

        const outrosCanais = backup.channels.filter(c => c.type !== 4).sort((a, b) => a.position - b.position);
        for (const channelData of outrosCanais) {
            try {
                const createData = {
                    name: channelData.name,
                    type: channelData.type,
                    position: channelData.position,
                    parent: channelData.parentId ? channelsMap.get(channelData.parentId) : null
                };

                if (channelData.topic) createData.topic = channelData.topic;
                if (channelData.nsfw !== undefined) createData.nsfw = channelData.nsfw;
                if (channelData.rateLimitPerUser) createData.rateLimitPerUser = channelData.rateLimitPerUser;
                if (channelData.bitrate) createData.bitrate = channelData.bitrate;
                if (channelData.userLimit) createData.userLimit = channelData.userLimit;

                const newChannel = await guild.channels.create(createData);
                channelsMap.set(channelData.id, newChannel.id);
            } catch (err) {
                console.error(`Erro ao criar canal ${channelData.name}:`, err);
            }
        }

        await atualizarEtapa(6);
        for (const channelData of backup.channels) {
            const newChannelId = channelsMap.get(channelData.id);
            if (!newChannelId) continue;

            const channel = guild.channels.cache.get(newChannelId);
            if (!channel) continue;

            for (const perm of channelData.permissionOverwrites) {
                try {
                    const targetId = perm.type === 0 ? rolesMap.get(perm.id) || perm.id : perm.id;
                    
                    await channel.permissionOverwrites.create(targetId, {
                        allow: BigInt(perm.allow),
                        deny: BigInt(perm.deny)
                    });
                } catch (err) {
                    console.error(`Erro ao configurar permissões:`, err);
                }
            }
        }

        await atualizarEtapa(7);
        const backupDir = path.join(__dirname, '../Backups', guild.id, 'emojis');
        
        if (fs.existsSync(backupDir)) {
            for (const emojiData of backup.emojis) {
                if (!emojiData.localPath) continue;
                
                const emojiPath = path.join(backupDir, emojiData.localPath);
                if (!fs.existsSync(emojiPath)) continue;

                try {
                    await guild.emojis.create({
                        attachment: emojiPath,
                        name: emojiData.name
                    });
                } catch (err) {
                    console.error(`Erro ao criar emoji ${emojiData.name}:`, err);
                }
            }
        }

        await atualizarEtapa(8);
        const stickersDir = path.join(__dirname, '../Backups', guild.id, 'stickers');
        
        if (fs.existsSync(stickersDir)) {
            for (const stickerData of backup.stickers) {
                if (!stickerData.localPath) continue;
                
                const stickerPath = path.join(stickersDir, stickerData.localPath);
                if (!fs.existsSync(stickerPath)) continue;

                try {
                    await guild.stickers.create({
                        file: stickerPath,
                        name: stickerData.name,
                        tags: '⭐',
                        description: 'Restaurado do backup'
                    });
                } catch (err) {
                    console.error(`Erro ao criar sticker ${stickerData.name}:`, err);
                }
            }
        }

        await atualizarEtapa(9);
        const config = backup.config;
        if (config) {
            try {
                const editData = {};
                
                if (config.name) editData.name = config.name;
                if (config.verificationLevel !== undefined) editData.verificationLevel = config.verificationLevel;
                if (config.explicitContentFilter !== undefined) editData.explicitContentFilter = config.explicitContentFilter;
                if (config.defaultMessageNotifications !== undefined) editData.defaultMessageNotifications = config.defaultMessageNotifications;
                if (config.afkTimeout !== undefined) editData.afkTimeout = config.afkTimeout;
                if (config.preferredLocale) editData.preferredLocale = config.preferredLocale;
                if (config.description) editData.description = config.description;

                await guild.edit(editData);
            } catch (err) {
                console.error('Erro ao aplicar configurações do servidor:', err);
            }
        }

        await mensagemStatus.edit({
            content: `${Emojis.get('checker')} **Backup Recriado com Sucesso!**\n\nTodos os elementos do servidor foram restaurados com sucesso.`
        });

        return { success: true };

    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        
        await mensagemStatus.edit({
            content: `${Emojis.get('negative')} **Erro ao Recriar Backup**\n\nOcorreu um erro durante o processo de restauração: ${error.message}`
        });

        return { success: false, error: error.message };
    }
}

module.exports = {
    RestaurarBackup
};
