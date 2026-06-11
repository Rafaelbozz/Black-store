const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder } = require("discord.js");
const { tickets } = require("../DataBaseJson");

function CreateMessageTicket(interaction, channel, client) {
    const ggg = tickets.get(`tickets.funcoes`);
    const aparencia = tickets.get(`tickets.aparencia`);
    const modoContent = tickets.get(`tickets.config.modoContent`) || false;
    const textContent = tickets.get(`tickets.config.textContent`) || "Nenhum conteúdo definido.";
    const imageContent = tickets.get(`tickets.config.imageContent`);

    const arrayDeValores = Object.values(ggg);
    const button = new ButtonBuilder()
        .setCustomId(`AbrirTicket_${arrayDeValores[0].nome}`)
        .setLabel(arrayDeValores[0].nome)
        .setStyle(2);

    if (arrayDeValores[0].emoji !== undefined) {
        button.setEmoji(arrayDeValores[0].emoji);
    }

    const buttonrow = new ActionRowBuilder().addComponents(button);

    const selectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId('abrirticket')
        .setPlaceholder('Clique aqui para ver as opções');

    for (const element in ggg) {
        const item = ggg[element];
        const option = {
            label: `${item.nome}`,
            description: `${item.descricao == undefined ? item.predescricao : item.descricao}`,
            value: `${element}`,
            ...item.emoji == undefined ? {} : { emoji: `${item.emoji}` }
        };
        selectMenuBuilder.addOptions(option);
    }

    const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);
    const components = Object.keys(ggg).length == 1 ? [buttonrow] : [style2row];

    const channel2 = client.channels.cache.get(channel);
    const messageOptions = { components: components };

    if (modoContent) {
        messageOptions.content = textContent;
        messageOptions.embeds = [];
        if (imageContent && imageContent.startsWith('http')) {
            messageOptions.files = [imageContent];
        }
    } else {
        const embed = new EmbedBuilder()
            .setTitle(`${aparencia.title}`)
            .setDescription(`${aparencia.description}`)
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        if (aparencia.color !== undefined) embed.setColor(`${aparencia.color}`);
        if (aparencia.banner !== undefined) embed.setImage(`${aparencia.banner}`);
        
        messageOptions.embeds = [embed];
        messageOptions.content = null;
        messageOptions.files = [];
    }

    channel2.send(messageOptions).then(msg => {
        tickets.push(`tickets.messageid`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });
    });
}

async function Checkarmensagensticket(client) {
    const ggg = tickets.get(`tickets.funcoes`);
    const aparencia = tickets.get(`tickets.aparencia`);
    const item = tickets.get(`tickets.messageid`);
    const modoContent = tickets.get(`tickets.config.modoContent`) || false;
    const textContent = tickets.get(`tickets.config.textContent`) || "Nenhum conteúdo definido.";
    const imageContent = tickets.get(`tickets.config.imageContent`);

    const arrayDeValores = Object.values(ggg);
    const button = new ButtonBuilder()
        .setCustomId(`AbrirTicket_${arrayDeValores[0].nome}`)
        .setLabel(arrayDeValores[0].nome)
        .setStyle(2);
    if (arrayDeValores[0].emoji !== undefined) button.setEmoji(arrayDeValores[0].emoji);
    const buttonrow = new ActionRowBuilder().addComponents(button);

    const selectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId('abrirticket')
        .setPlaceholder('Clique aqui para ver as opções');
    for (const element in ggg) {
        const opt = ggg[element];
        selectMenuBuilder.addOptions({
            label: `${opt.nome}`,
            description: `${opt.predescricao || ""}`,
            value: `${element}`,
            ...opt.emoji ? { emoji: `${opt.emoji}` } : {}
        });
    }
    const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);
    const components = Object.keys(ggg).length == 1 ? [buttonrow] : [style2row];

    for (const iterator in item) {
        const element = item[iterator];
        try {
            const guild = client.guilds.cache.get(element.guildid);
            const channel = await client.channels.cache.get(element.channelid);
            const msg = await channel.messages.fetch(element.msgid);

            const editOptions = { components: components };

            if (modoContent) {
                editOptions.content = textContent;
                editOptions.embeds = [];
                if (imageContent && imageContent.startsWith('http')) {
                    editOptions.files = [imageContent];
                } else {
                    editOptions.files = [];
                }
            } else {
                const embed = new EmbedBuilder()
                    .setTitle(`${aparencia.title}`)
                    .setDescription(`${aparencia.description}`)
                    .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
                    .setTimestamp();
                if (aparencia.color) embed.setColor(`${aparencia.color}`);
                if (aparencia.banner) embed.setImage(`${aparencia.banner}`);
                
                editOptions.content = null;
                editOptions.embeds = [embed];
                editOptions.files = [];
            }

            await msg.edit(editOptions);
        } catch (error) {
        }
    }
}

module.exports = {
    CreateMessageTicket,
    Checkarmensagensticket
};