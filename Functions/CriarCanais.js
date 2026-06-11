const { ChannelType } = require('discord.js');
const fs = require('fs').promises;
const { Emojis } = require("../DataBaseJson")
const path = require('path');

module.exports = {
    async criarCanais(interaction) {
        const filePath = path.join(__dirname, '..', 'DataBaseJson', 'configuracao.json');

        try {
            try {
                await fs.access(filePath);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.log('Arquivo de configuração não encontrado, criando...');
                    const defaultConfig = {
                        ConfigChannels: {}
                    };
                    await fs.writeFile(filePath, JSON.stringify(defaultConfig, null, 4));
                    console.log('Arquivo de configuração criado com sucesso.');
                } else {
                    throw error;
                }
            }

            const data = await fs.readFile(filePath, 'utf8');
            let configFile;
            try {
                configFile = JSON.parse(data);
            } catch (e) {
                console.error('Erro ao fazer parse do JSON:', e);
                return interaction.reply({ content: `Erro no arquivo de configuração.`, ephemeral: true });
            }

            const requiredKeys = ['logpedidos', 'eventbuy', 'systemlogs', 'entradas', 'saídas', 'mensagens', 'tráfego', 'feedback', 'logsticket', 'antiraid', 'boasvindascoole', 'auditoria', 'logsban', 'logscomandos'];
            let channelsValid = true;

            for (const key of requiredKeys) {
                const channelId = configFile.ConfigChannels && configFile.ConfigChannels[key];
                if (!channelId || channelId.trim() === '' || !interaction.guild.channels.cache.get(channelId)) {
                    channelsValid = false;
                    break;
                }
            }

            if (channelsValid) {
                return interaction.update({ content: `${Emojis.get(`warn_emoji`)} Os canais já foram criados e estão válidos!\n-# Caso queira recriar os canais, é preciso apagar todos os canais antigos.`, embeds: [], components: [] });
            }

            interaction.update({ content: `${Emojis.get(`loading`)} Estou Criando os Canais Aguarde...`, embeds: [], components: [] });

            const guild = interaction.guild;
            const category = await guild.channels.create({
                name: 'Logs Bot Ryzen Systens',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [{ id: guild.id, deny: ['ViewChannel'] }]
            });

            const canais = {
                logpedidos: '⚙️・Logs Pedidos',
                eventbuy: '⚙️・Evento Compras',
                systemlogs: '⚙️・Logs Sistema',
                entradas: '⚙️・Logs Entradas',
                'saídas': '⚙️・Logs Saídas',
                mensagens: '⚙️・Logs Mensagens',
                tráfego: '⚙️・Logs Tráfego',
                feedback: '⚙️・Feedback',
                logsticket: '⚙️・logs ticket',
                antiraid: '⚙️・logs notificaçoes',
                boasvindas: '⚙️・logs boasvindas',
                auditoria: '⚙️・Auditoria',
                logsban: '⚙️・Logs Ban',
                logscomandos: '⚙️・Logs Comandos'
            };

            let idsCanais = {};

            for (const key in canais) {
                const canal = await guild.channels.create({
                    name: canais[key],
                    type: ChannelType.GuildText,
                    parent: category.id
                });
                idsCanais[key] = canal.id;
            }

            const configFileAtual = JSON.parse(await fs.readFile(filePath, 'utf8'));
            configFileAtual.ConfigChannels = { ...configFileAtual.ConfigChannels, ...idsCanais };

            await fs.writeFile(filePath, JSON.stringify(configFileAtual, null, 4));

            interaction.editReply({ content: `${Emojis.get(`checker`)} Canais Criados e Configurados com Sucesso!\n-# Clique em **Voltar** e Apos isso Clique em **Canais** para atualizar a pagina`, embeds: [], components: [] });

        } catch (err) {
            console.error(err);
            interaction.reply({ content: 'Houve um erro ao criar os canais.', ephemeral: true });
        }
    }
};
