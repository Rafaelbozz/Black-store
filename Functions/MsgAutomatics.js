const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const { res } = require("../res");
const fs = require('fs');
const path = require('path');

const mensagemPath = path.resolve(__dirname, '../DataBaseJson/msgauto.json');

function getMsgData() {
    try {
        if (fs.existsSync(mensagemPath)) {
            const content = fs.readFileSync(mensagemPath, 'utf-8').trim();
            const data = content ? JSON.parse(content) : [];
            return Array.isArray(data) ? data : [];
        }
    } catch (e) {
        console.error('Erro ao ler msgauto.json:', e);
    }
    return [];
}

function saveMsgData(data) {
    fs.writeFileSync(mensagemPath, JSON.stringify(data, null, 2));
}

async function startAutoMessages(client) {
    console.log('[MsgAuto] Sistema de mensagens automáticas iniciado');
    
    setInterval(async () => {
        await checkAndSendMessages(client);
    }, 30000);
    
    await checkAndSendMessages(client);
}

async function checkAndSendMessages(client) {
    const msgData = getMsgData();
    const now = Date.now();
    
    for (const msg of msgData) {
        if (!msg.ativo) continue;
        
        const lastSent = msg.lastSent || 0;
        const intervaloMs = msg.intervalo * 1000;
        
        if (now - lastSent >= intervaloMs) {
            await sendAutoMessage(client, msg);
            msg.lastSent = now;
        }
    }
    
    saveMsgData(msgData);
}

async function sendAutoMessage(client, msg) {
    for (const canalId of msg.canais) {
        try {
            const channel = await client.channels.fetch(canalId).catch(() => null);
            if (!channel) continue;
            
            if (msg.lastMessageIds && msg.lastMessageIds[canalId]) {
                try {
                    const oldMsg = await channel.messages.fetch(msg.lastMessageIds[canalId]);
                    await oldMsg.delete();
                } catch (e) {}
            }
            
            let messageOptions = {};
            
            if (msg.tipo === 'content') {
                messageOptions.content = msg.content;
            } else if (msg.tipo === 'embed') {
                const embed = new EmbedBuilder()
                    .setTitle(msg.embed.titulo)
                    .setDescription(msg.embed.descricao)
                    .setColor(msg.embed.cor || '#2b2d31');
                
                if (msg.embed.imagem) {
                    embed.setImage(msg.embed.imagem);
                }
                
                messageOptions.embeds = [embed];
            } else if (msg.tipo === 'container') {
                messageOptions = res.main(
                    { type: 10, content: `**${msg.container.titulo}**` },
                    { type: 14 },
                    { type: 10, content: msg.container.conteudo }
                ).with({ flags: [] });
            }
            
            if (msg.botao && msg.botao.texto && msg.botao.url) {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel(msg.botao.texto)
                        .setURL(msg.botao.url)
                        .setStyle(ButtonStyle.Link)
                );
                
                if (msg.tipo === 'container') {
                    messageOptions.components = [...(messageOptions.components || []), row];
                } else {
                    messageOptions.components = [row];
                }
            }
            
            const sentMessage = await channel.send(messageOptions);
            
            if (!msg.lastMessageIds) msg.lastMessageIds = {};
            msg.lastMessageIds[canalId] = sentMessage.id;
            
        } catch (error) {
            console.error(`[MsgAuto] Erro ao enviar mensagem no canal ${canalId}:`, error.message);
        }
    }
}

module.exports = {
    startAutoMessages,
    checkAndSendMessages,
    sendAutoMessage
};
