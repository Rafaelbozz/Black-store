const cron = require('node-cron');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require('discord.js');
const { produtos, configuracao } = require("../DataBaseJson");
const emojis = require("../DataBaseJson/emojis.json");
const { container } = require("../res");

const Emojis = {
    get: (name) => emojis[name] || ""
};

let cronJob = null;

function botaoDuvidasAtivo() {
    const ativo = configuracao.get('BotaoDuvidasAtivo') === 'true';
    const label = configuracao.get('BotaoDuvidasLabel');
    const url = configuracao.get('BotaoDuvidasURL');
    
    if (ativo && label && url && label !== 'Não configurado' && url !== 'Não configurado') {
        return { ativo: true, label, url };
    }
    return { ativo: false };
}

function formatarEmoji(emojiData) {
    if (!emojiData || emojiData === "") return { id: '1250848496987406487' }; 
    if (/^\d+$/.test(emojiData)) return { id: emojiData };
    if (emojiData.includes(':')) {
        const id = emojiData.split(':')[2].replace('>', '');
        return { id: id };
    }
    return { name: emojiData };
}

function montarCorpoV2(produtoInfo, mensagemAntiga, produtoId) {
    const itens = [];

    if (produtoInfo.Campos.length === 1) {
        if (produtoInfo.Config?.banner && produtoInfo.Config.banner.startsWith('http')) {
            itens.push({
                type: 12,
                items: [{ media: { url: produtoInfo.Config.banner.trim() }, spoiler: false }]
            });
        }

        itens.push({ type: 10, content: `**${produtoInfo.Config.name || "Produto"}**` });

        let textoDesc = !produtoInfo.Config.desc || produtoInfo.Config.desc == '' ? `Faça sua compra automática abaixo!` : produtoInfo.Config.desc;
        itens.push({ type: 10, content: textoDesc });

        itens.push({ type: 14 });

        const campo = produtoInfo.Campos[0];
        const estoque = campo.estoque.length;
        const valor = Number(campo.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        itens.push({ 
            type: 10, 
            content: `**R$ ${valor}**\n-# ${estoque} Unidade(s) disponíveis` 
        });

        let estilo = 2;
        if (mensagemAntiga?.btn_style == 'verde') estilo = 3;
        if (mensagemAntiga?.btn_style == 'azul') estilo = 1;
        if (mensagemAntiga?.btn_style == 'vermelho') estilo = 4;

        const botoes = [{
            type: 2,
            style: estilo,
            label: mensagemAntiga?.btn_text || "Comprar",
            custom_id: `comprarid_${produtoInfo.Campos[0].Nome}_${produtoId}`,
            emoji: formatarEmoji(mensagemAntiga?.btn_emoji || "🛒")
        }];

        const botaoDuvidas = botaoDuvidasAtivo();
        if (botaoDuvidas.ativo) {
            botoes.push({
                type: 2,
                style: 5,
                label: botaoDuvidas.label,
                url: botaoDuvidas.url
            });
        }

        itens.push({
            type: 1,
            components: botoes
        });
    } else {
        itens.push({ type: 10, content: `**${produtoInfo.Config.name || "Produto"}**` });

        let textoDesc = !produtoInfo.Config.desc || produtoInfo.Config.desc == '' ? `Faça sua compra automática abaixo!` : produtoInfo.Config.desc;
        itens.push({ type: 10, content: textoDesc });

        if (produtoInfo.Config?.banner && produtoInfo.Config.banner.startsWith('http')) {
            itens.push({
                type: 12,
                items: [{ media: { url: produtoInfo.Config.banner.trim() }, spoiler: false }]
            });
        }

        itens.push({ type: 14 });

        const valores = produtoInfo.Campos.map(c => Number(c.valor));
        const menorValor = Math.min(...valores).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const maiorValor = Math.max(...valores).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        itens.push({ 
            type: 10, 
            content: `**R$ ${menorValor}** - **R$ ${maiorValor}**\n-# Clique no botão abaixo para ver as opções` 
        });

        let estilo = 2;
        if (mensagemAntiga?.btn_style == 'verde') estilo = 3;
        if (mensagemAntiga?.btn_style == 'azul') estilo = 1;
        if (mensagemAntiga?.btn_style == 'vermelho') estilo = 4;

        const botoes = [{
            type: 2,
            style: estilo,
            label: "Ver Opções",
            custom_id: `veropcoes_${produtoId}`,
            emoji: formatarEmoji(mensagemAntiga?.btn_emoji || "1468466320189427713")
        }];

        const botaoDuvidas = botaoDuvidasAtivo();
        if (botaoDuvidas.ativo) {
            botoes.push({
                type: 2,
                style: 5,
                label: botaoDuvidas.label,
                url: botaoDuvidas.url
            });
        }

        itens.push({
            type: 1,
            components: botoes
        });
    }

    return itens;
}

async function repostarProdutos(client) {
    try {
        const todosProdutos = await produtos.all();
        console.log('Número de produtos:', todosProdutos.length);
        
        for (const produtoData of todosProdutos) {
            const produtoId = produtoData.ID;
            const produtoInfo = produtoData.data;
            
            if (!produtoInfo || !produtoInfo.mensagens || !Array.isArray(produtoInfo.mensagens)) {
                console.log(`Produto ${produtoId} não tem dados válidos. Pulando...`);
                continue;
            }
            
            for (const mensagem of produtoInfo.mensagens) {
                try {
                    if (!mensagem.channelid || !mensagem.mesageid) {
                        console.log(`Dados de mensagem incompletos para o produto ${produtoId}. Pulando...`);
                        continue;
                    }

                    const channel = await client.channels.fetch(mensagem.channelid);
                    const oldMessage = await channel.messages.fetch(mensagem.mesageid);
                    await oldMessage.delete();

                    const newMessage = await criarNovaMensagem(client, channel, produtoId, produtoInfo, mensagem);

                    await atualizarMensagemNoBD(produtoId, mensagem, newMessage);

                } catch (error) {
                    const systemLogsChannelId = configuracao.get(`ConfigChannels.systemlogs`);
                    
                    if (systemLogsChannelId) {
                        const systemLogsChannel = client.channels.cache.get(systemLogsChannelId);
                        
                        if (systemLogsChannel) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor('#FF0000')
                                .setTitle('Erro ao Repostar Produto')
                                .setDescription(`Ocorreu um erro ao tentar repostar o produto.`)
                                .addFields(
                                    { name: 'ID do Produto', value: produtoId.toString(), inline: true },
                                    { name: 'Tipo de Erro', value: error.name || 'Desconhecido', inline: true },
                                    { name: 'Mensagem de Erro', value: error.message || 'Sem mensagem' }
                                )
                                .setFooter({ text: 'Sistema de Logs' })
                                .setTimestamp();
                
                            systemLogsChannel.send({ embeds: [errorEmbed] });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erro ao obter produtos do banco de dados:', error);
    }
}

async function criarNovaMensagem(client, channel, produtoId, produtoInfo, mensagemAntiga) {
    const itensContainer = montarCorpoV2(produtoInfo, mensagemAntiga, produtoId);
    const corContainer = mensagemAntiga?.btn_color || "#2f3136";
    const payload = container(corContainer, ...itensContainer);
    const newMessage = await channel.send(payload);
    return newMessage;
}

async function atualizarMensagemNoBD(produtoId, mensagemAntiga, novaMensagem) {
    try {
        const produtoInfo = await produtos.get(produtoId);
        
        if (!produtoInfo || !produtoInfo.mensagens) {
            console.log(`Não foi possível atualizar a mensagem para o produto ${produtoId}. Dados inválidos.`);
            return;
        }

        const btnData = {
            btn_style: mensagemAntiga.btn_style,
            btn_emoji: mensagemAntiga.btn_emoji,
            btn_text: mensagemAntiga.btn_text,
            btn_color: mensagemAntiga.btn_color
        };

        produtoInfo.mensagens = produtoInfo.mensagens.filter(m => m.mesageid !== mensagemAntiga.mesageid);

        produtoInfo.mensagens.push({
            guildid: novaMensagem.guild.id,
            channelid: novaMensagem.channel.id,
            mesageid: novaMensagem.id,
            ...btnData
        });

        await produtos.set(produtoId, produtoInfo);
    } catch (error) {
        console.error(`Erro ao atualizar mensagem no banco de dados para o produto ${produtoId}:`, error);
    }
}

function agendarRepostagem(client) {
    const horaConfig = configuracao.get("Repostagem.Hora");
    const statusConfig = configuracao.get("Repostagem.Status");

    if (statusConfig === true) {
        const [hour, minute] = horaConfig.split(":");
        const cronTime = `${minute} ${hour} * * *`;
        const timeZone = 'America/Sao_Paulo'; 

        if (cronJob) {
            cronJob.stop();
        }

        cronJob = cron.schedule(cronTime, () => {
            repostarProdutos(client);
        }, {
            scheduled: true,
            timezone: timeZone 
        });
    } else {
        if (cronJob) {
            cronJob.stop();
            cronJob = null;
        }
    }
}

function pararRepostagem() {
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
        console.log('Cron job interrompido.');
    }
}

async function iniciarRepostagem(client) {
    console.log('Iniciando teste de repostagem imediatamente.');
    await repostarProdutos(client);
}

module.exports = { agendarRepostagem, pararRepostagem, iniciarRepostagem, repostarProdutos };
