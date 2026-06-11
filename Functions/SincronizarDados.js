const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require('discord.js');
const { configuracao, BackupStorage } = require('../DataBaseJson');
const emojis = require("../DataBaseJson/emojis.json");
const fs = require('fs');
const path = require('path');


const Emojis = {
    get: (name) => emojis[name] || ""
};

async function SincronizarDados(client) {

    let channel_logs = await client.channels.fetch(configuracao.get('ConfigChannels.systemlogs')).catch(() => null);
    if (!channel_logs) return;
    let guild = await client.guilds.fetch(channel_logs.guild.id);

    let guilds = BackupStorage.get(`Backup_${guild.id}`) || [];

    let guildIndex = guilds.findIndex(g => g.id == guild.id);

    if (guildIndex == -1) {
        guilds.push({
            id: guild.id,
            name: guild.name,
            channels: [],
            roles: [],
            emojis: [],
            stickers: [],
            msgs: [],
            config: {}
        });
        guildIndex = guilds.length - 1;
    } else {
        guilds[guildIndex] = {
            id: guild.id,
            name: guild.name,
            channels: [],
            roles: [],
            emojis: [],
            stickers: [],
            msgs: [],
            config: {}
        };
    }

    guild.channels.cache.forEach(channel => {
        const channelData = {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            position: channel.position,
            parentId: channel.parentId,
            parentName: channel.parent ? channel.parent.name : null,
            permissionOverwrites: channel.permissionOverwrites?.cache ? channel.permissionOverwrites.cache.map(perm => ({
                id: perm.id,
                type: perm.type,
                allow: perm.allow.bitfield,
                deny: perm.deny.bitfield
            })) : []
        };

        if (channel.isTextBased()) {
            channelData.topic = channel.topic;
            channelData.nsfw = channel.nsfw;
            channelData.rateLimitPerUser = channel.rateLimitPerUser;
            channelData.defaultAutoArchiveDuration = channel.defaultAutoArchiveDuration;
        }

        if (channel.isVoiceBased()) {
            channelData.bitrate = channel.bitrate;
            channelData.userLimit = channel.userLimit;
            channelData.rtcRegion = channel.rtcRegion;
            channelData.videoQualityMode = channel.videoQualityMode;
        }

        if (channel.type === 11 || channel.type === 12) {
            channelData.archived = channel.archived;
            channelData.autoArchiveDuration = channel.autoArchiveDuration;
            channelData.locked = channel.locked;
            channelData.invitable = channel.invitable;
        }

        if (channel.type === 15) {
            channelData.availableTags = channel.availableTags;
            channelData.defaultReactionEmoji = channel.defaultReactionEmoji;
            channelData.defaultSortOrder = channel.defaultSortOrder;
            channelData.defaultForumLayout = channel.defaultForumLayout;
        }

        guilds[guildIndex].channels.push(channelData);
    });

    const backupDir = path.join(__dirname, '../Backups', guild.id, 'emojis');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    await Promise.all(
        guild.emojis.cache.map(async emoji => {
            try {
                const ext = emoji.animated ? 'gif' : 'png';
                const filename = `${emoji.id}_${emoji.name}.${ext}`;
                const filePath = path.join(backupDir, filename);
                
                if (!fs.existsSync(filePath)) {
                    const response = await fetch(emoji.imageURL());
                    const buffer = await response.arrayBuffer();
                    fs.writeFileSync(filePath, Buffer.from(buffer));
                }
                
                guilds[guildIndex].emojis.push({
                    id: emoji.id,
                    name: emoji.name,
                    url: emoji.imageURL(),
                    localPath: filename,
                    animated: emoji.animated
                });
            } catch (err) {
                console.error(`Erro ao salvar emoji ${emoji.name}:`, err);
                guilds[guildIndex].emojis.push({
                    id: emoji.id,
                    name: emoji.name,
                    url: emoji.imageURL(),
                    localPath: null,
                    animated: emoji.animated
                });
            }
        })
    );

    const stickersDir = path.join(__dirname, '../Backups', guild.id, 'stickers');
    if (!fs.existsSync(stickersDir)) {
        fs.mkdirSync(stickersDir, { recursive: true });
    }

    await Promise.all(
        guild.stickers.cache.map(async sticker => {
            try {
                const filename = `${sticker.id}_${sticker.name}.png`;
                const filePath = path.join(stickersDir, filename);
                
                if (!fs.existsSync(filePath)) {
                    const response = await fetch(sticker.url);
                    const buffer = await response.arrayBuffer();
                    fs.writeFileSync(filePath, Buffer.from(buffer));
                }
                
                guilds[guildIndex].stickers.push({
                    id: sticker.id,
                    name: sticker.name,
                    url: sticker.url,
                    localPath: filename
                });
            } catch (err) {
                console.error(`Erro ao salvar sticker ${sticker.name}:`, err);
                guilds[guildIndex].stickers.push({
                    id: sticker.id,
                    name: sticker.name,
                    url: sticker.url,
                    localPath: null
                });
            }
        })
    );


    
    
    

    guild.roles.cache.forEach(role => {
        if (role.id === guild.id) return;
        
        guilds[guildIndex].roles.push({
            id: role.id,
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions.bitfield,
            managed: role.managed,
            mentionable: role.mentionable,
            icon: role.icon,
            unicodeEmoji: role.unicodeEmoji,
            tags: role.tags ? {
                botId: role.tags.botId,
                integrationId: role.tags.integrationId,
                premiumSubscriberRole: role.tags.premiumSubscriberRole,
                availableForPurchase: role.tags.availableForPurchase,
                guildConnections: role.tags.guildConnections
            } : null
        });
    });

    await Promise.all(
        guild.channels.cache.map(async channel => {
            if (channel.isTextBased() && channel.messages && channel.type !== 11 && channel.type !== 12) {
                try {
                    const messages = await channel.messages.fetch({ limit: 100 });
                    messages.forEach(message => {
                        guilds[guildIndex].msgs.push({
                            channelId: channel.id,
                            channelName: channel.name,
                            messageId: message.id,
                            content: message.content,
                            author: {
                                id: message.author.id,
                                username: message.author.username,
                                bot: message.author.bot
                            },
                            embeds: message.embeds.map(e => e.toJSON()),
                            attachments: message.attachments.map(a => ({
                                id: a.id,
                                name: a.name,
                                url: a.url,
                                proxyURL: a.proxyURL,
                                size: a.size,
                                contentType: a.contentType
                            })),
                            components: message.components.map(c => c.toJSON()),
                            createdTimestamp: message.createdTimestamp,
                            editedTimestamp: message.editedTimestamp,
                            pinned: message.pinned,
                            reactions: message.reactions.cache.map(r => ({
                                emoji: r.emoji.name,
                                count: r.count
                            }))
                        });
                    });
                } catch (err) {
                    console.error(`Erro ao buscar mensagens no canal ${channel.name}:`, err);
                }
            }
        })
    );

    guilds[guildIndex].config = {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL({ size: 4096 }),
        banner: guild.bannerURL({ size: 4096 }),
        splash: guild.splashURL({ size: 4096 }),
        discoverySplash: guild.discoverySplashURL({ size: 4096 }),
        ownerId: guild.ownerId,
        verificationLevel: guild.verificationLevel,
        explicitContentFilter: guild.explicitContentFilter,
        defaultMessageNotifications: guild.defaultMessageNotifications,
        mfaLevel: guild.mfaLevel,
        systemChannelId: guild.systemChannelId,
        systemChannelFlags: guild.systemChannelFlags.bitfield,
        afkChannelId: guild.afkChannelId,
        afkTimeout: guild.afkTimeout,
        widgetEnabled: guild.widgetEnabled,
        widgetChannelId: guild.widgetChannelId,
        rulesChannelId: guild.rulesChannelId,
        publicUpdatesChannelId: guild.publicUpdatesChannelId,
        safetyAlertsChannelId: guild.safetyAlertsChannelId,
        preferredLocale: guild.preferredLocale,
        vanityURLCode: guild.vanityURLCode,
        description: guild.description,
        features: guild.features,
        premiumTier: guild.premiumTier,
        premiumSubscriptionCount: guild.premiumSubscriptionCount,
        premiumProgressBarEnabled: guild.premiumProgressBarEnabled,
        nsfwLevel: guild.nsfwLevel,
        maxMembers: guild.maximumMembers,
        maxPresences: guild.maximumPresences,
        maxVideoChannelUsers: guild.maximumVideoChannelUsers,
        maxStageVideoChannelUsers: guild.maxStageVideoChannelUsers,
        approximateMemberCount: guild.approximateMemberCount,
        approximatePresenceCount: guild.approximatePresenceCount,
        memberCount: guild.memberCount,
        welcomeScreen: guild.welcomeScreen ? {
            enabled: true,
            description: guild.welcomeScreen.description,
            welcomeChannels: guild.welcomeScreen.welcomeChannels.map(wc => ({
                channelId: wc.channelId,
                description: wc.description,
                emojiId: wc.emojiId,
                emojiName: wc.emojiName
            }))
        } : null
    };

    await BackupStorage.set(
        `Backup_${guild.id}`,
        JSON.parse(
            JSON.stringify(guilds, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            )
        )
    );

    const backupInfo = BackupStorage.get(`BackupInfo_${guild.id}`) || {
        autoBackupEnabled: false,
        intervalMinutes: 60
    };
    
    backupInfo.lastBackup = Date.now();
    
    if (backupInfo.autoBackupEnabled) {
        backupInfo.nextBackup = Date.now() + (backupInfo.intervalMinutes * 60 * 1000);
    }
    
    BackupStorage.set(`BackupInfo_${guild.id}`, backupInfo);

    SendLogs(client, channel_logs);

}
async function SalvarTemplate(client) {

    let channel_logs = await client.channels.fetch(configuracao.get('ConfigChannels.systemlogs'));
    if (!channel_logs) return;

    let guild = await client.guilds.fetch(channel_logs.guild.id);

    let guilds = BackupStorage.get(`Template_${guild.id}`) || [];

    let guildIndex = guilds.findIndex(g => g.id == guild.id);

    if (guildIndex == -1) {
        guilds.push({
            id: guild.id,
            name: guild.name,
            channels: [],
            roles: [],
            perms: [],
        });
        guildIndex = guilds.length - 1;
    } else {
        guilds[guildIndex] = {
            id: guild.id,
            name: guild.name,
            channels: [],
            roles: [],
            perms: [],
        };
    }

    guild.channels.cache.forEach(channel => {
        guilds[guildIndex].channels.push({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            categoria: channel.parent ? channel.parent.name : null,
            topic: (channel.type == 12 || channel.type == 11) ?
                { topic: channel.topic, parentChannelName: channel.parent?.name || channel.name } :
                null,
        });
    });

    guild.roles.cache.forEach(role => {
        guilds[guildIndex].roles.push({
            id: role.id,
            name: role.name,
            color: role.color,
            permissions: role.permissions.bitfield
        });
    });

    guild.roles.cache.forEach(role => {
        Object.entries(PermissionsBitField.Flags).forEach(([key, flag]) => {
            if (role.permissions.has(flag)) {
                guilds[guildIndex].perms.push({
                    id: role.id,
                    role: role.name,
                    perm: key
                });
            }
        });
    });

    await BackupStorage.set(
        `Template_${guild.id}`,
        JSON.parse(
            JSON.stringify(guilds, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            )
        )
    );

    SendLogs(client, channel_logs);
}
async function SendLogs(client, channel_logs) {
    const { res } = require('../res');
    
    try {
        const backupArray = BackupStorage.get(`Backup_${channel_logs.guild.id}`);
        
        if (!backupArray || !Array.isArray(backupArray) || backupArray.length === 0) {
            console.error('Backup não encontrado ou vazio');
            return;
        }
        
        const backupData = backupArray[0];
        const autoBackup = configuracao.get('BackupAutomatico') ? 'Sim' : 'Não';

    } catch (error) {
        console.error('Erro ao enviar log de backup:', error);
    }
}

module.exports = {
    SincronizarDados,
    SalvarTemplate
}