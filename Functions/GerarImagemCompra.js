const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

async function gerarImagemCompra(dados) {
    const { 
        username, 
        userAvatar, 
        userId,
        quantidade, 
        produto, 
        campo, 
        valorPago,
        timestamp,
        guildName,
        guildIcon
    } = dados;

    const width = 1024;
    const height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    const cardPadding = 25;
    const cardX = cardPadding;
    const cardY = cardPadding;
    const cardWidth = width - (cardPadding * 2);
    const cardHeight = height - (cardPadding * 2);
    
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

    const avatarSize = 80;
    const avatarX = 90 + cardPadding;
    const avatarY = 90;

    try {
        const avatar = await loadImage(userAvatar);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch (error) {
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(username, avatarX + avatarSize + 30, avatarY + 30);

    ctx.fillStyle = '#a0a0a0';
    ctx.font = '28px sans-serif';
    ctx.fillText(`@${userId}`, avatarX + avatarSize + 30, avatarY + 65);

    const dataBrasilia = new Date(timestamp).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(',', ' •');
    
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(dataBrasilia, width - 90 - cardPadding, avatarY + 45);
    ctx.textAlign = 'left';

    const titleY = avatarY + avatarSize + 80;

    ctx.fillStyle = '#00d969';
    ctx.beginPath();
    ctx.arc(105 + cardPadding, titleY - 10, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(96 + cardPadding, titleY - 10);
    ctx.lineTo(102 + cardPadding, titleY - 4);
    ctx.lineTo(114 + cardPadding, titleY - 16);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('Compra Realizada', 150 + cardPadding, titleY);

    const cartY = titleY + 90;

    ctx.fillStyle = '#a0a0a0';
    ctx.font = '26px sans-serif';
    ctx.fillText('Carrinho', 90 + cardPadding, cartY);

    const produtoTexto = `${quantidade}x ${produto} | ${campo}`;
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px sans-serif';
    
    const maxWidth = width - 450;
    const lines = wrapText(ctx, produtoTexto, maxWidth);
    let lineY = cartY + 50;
    lines.forEach(line => {
        ctx.fillText(line, 90 + cardPadding, lineY);
        lineY += 38;
    });

    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`R$ ${valorPago}`, width - 90 - cardPadding, cartY + 50);
    ctx.textAlign = 'left';

    const subtotalY = cartY + 120;
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '28px sans-serif';
    ctx.fillText('Subtotal', 90 + cardPadding, subtotalY);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`R$ ${valorPago}`, width - 90 - cardPadding, subtotalY);
    ctx.textAlign = 'left';

    const dividerY = subtotalY + 25;
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(90 + cardPadding, dividerY);
    ctx.lineTo(width - 90 - cardPadding, dividerY);
    ctx.stroke();

    const totalY = dividerY + 85;
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '32px sans-serif';
    ctx.fillText('Valor pago', 90 + cardPadding, totalY);

    ctx.fillStyle = '#00d969';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`R$ ${valorPago}`, width - 90 - cardPadding, totalY);
    ctx.textAlign = 'left';

    const footerY = height - 55;

    let iconLoaded = false;
    if (guildIcon) {
        try {
            const iconUrl = guildIcon.includes('http') ? guildIcon : `https://cdn.discordapp.com/icons/${guildIcon}`;
            const serverIcon = await loadImage(iconUrl);
            const iconSize = 28;
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(90 + cardPadding + iconSize / 2, footerY - 8, iconSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(serverIcon, 90 + cardPadding, footerY - 8 - iconSize / 2, iconSize, iconSize);
            ctx.restore();

            ctx.fillStyle = '#ffffff';
            ctx.font = '20px sans-serif';
            ctx.fillText(guildName.toUpperCase(), 90 + cardPadding + iconSize + 10, footerY);
            iconLoaded = true;
        } catch (error) {
            console.error('Erro ao carregar ícone do servidor:', error);
        }
    }
    
    if (!iconLoaded) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px sans-serif';
        ctx.fillText(guildName.toUpperCase(), 90 + cardPadding, footerY);
    }

    ctx.fillStyle = '#6a6a6a';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('ryzen system ©copyright', width - 90 - cardPadding, footerY);

    const buffer = canvas.toBuffer('image/png');
    const attachment = new AttachmentBuilder(buffer, { name: 'compra-realizada.png' });

    return attachment;
}

module.exports = { gerarImagemCompra };
