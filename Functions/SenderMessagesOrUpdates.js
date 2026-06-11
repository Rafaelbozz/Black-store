const { produtos, configuracao } = require("../DataBaseJson");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const { res, container } = require("../res"); 
const emojis = require("../DataBaseJson/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

// --- FUNÇÃO PARA VERIFICAR SE O BOTÃO DE DÚVIDAS ESTÁ ATIVO ---
function botaoDuvidasAtivo() {
    const ativo = configuracao.get('BotaoDuvidasAtivo') === 'true';
    const label = configuracao.get('BotaoDuvidasLabel');
    const url = configuracao.get('BotaoDuvidasURL');
    
    // Só retorna true se estiver ativo E configurado
    if (ativo && label && url && label !== 'Não configurado' && url !== 'Não configurado') {
        return { ativo: true, label, url };
    }
    return { ativo: false };
}

// --- LÓGICA DE EMOJIS DE ENTREGA ---
const Entrega2 = configuracao.get(`Emojis_EntregAuto`);
let msg_entrega = ``;
if (Entrega2 !== null) {
    Entrega2.sort((a, b) => {
        const numA = parseInt(a.name.replace('ea', ''), 10);
        const numB = parseInt(b.name.replace('ea', ''), 10);
        return numA - numB;
    });
    Entrega2.forEach(element => {
        msg_entrega += `<:${element.name}:${element.id}>`;
    });
}

// --- FUNÇÃO PARA TRATAR O EMOJI DO JSON ---
function formatarEmoji(emojiData) {
    if (!emojiData || emojiData === "") return { id: '1250848496987406487' }; 
    if (/^\d+$/.test(emojiData)) return { id: emojiData };
    if (emojiData.includes(':')) {
        const id = emojiData.split(':')[2].replace('>', '');
        return { id: id };
    }
    return { name: emojiData };
}

// --- FUNÇÃO PARA MONTAR O CONTEÚDO DO CONTAINER ---
function montarCorpoV2(yyy, fdfd, produtoId) {
    const itens = [];

    if (yyy.Campos.length === 1) {
        if (yyy.Config?.banner && yyy.Config.banner.startsWith('http')) {
            itens.push({
                type: 12,
                items: [{ media: { url: yyy.Config.banner.trim() }, spoiler: false }]
            });
        }

        itens.push({ type: 10, content: `**${yyy.Config.name || "Produto"}**` });

        let textoDesc = !yyy.Config.desc || yyy.Config.desc == '' ? `Faça sua compra automática abaixo!` : yyy.Config.desc;
        itens.push({ type: 10, content: textoDesc });

        itens.push({ type: 14 });

        const campo = yyy.Campos[0];
        const estoque = campo.estoque.length;
        const valor = Number(campo.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        itens.push({ 
            type: 10, 
            content: `**R$ ${valor}**\n-# ${estoque} Unidade(s) disponíveis` 
        });

        let estilo = 2;
        if (fdfd?.estilobutton == 'verde') estilo = 3;
        if (fdfd?.estilobutton == 'azul') estilo = 1;
        if (fdfd?.estilobutton == 'vermelho') estilo = 4;

        const botoes = [{
            type: 2,
            style: estilo,
            label: fdfd?.textobutton || "Comprar",
            custom_id: `comprarid_${yyy.Campos[0].Nome}_${produtoId}`,
            emoji: formatarEmoji(fdfd?.emoji || "🛒")
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
        itens.push({ type: 10, content: `**${yyy.Config.name || "Produto"}**` });

        let textoDesc = !yyy.Config.desc || yyy.Config.desc == '' ? `Faça sua compra automática abaixo!` : yyy.Config.desc;
        itens.push({ type: 10, content: textoDesc });

        if (yyy.Config?.banner && yyy.Config.banner.startsWith('http')) {
            itens.push({
                type: 12,
                items: [{ media: { url: yyy.Config.banner.trim() }, spoiler: false }]
            });
        }

        itens.push({ type: 14 });

        const valores = yyy.Campos.map(c => Number(c.valor));
        const menorValor = Math.min(...valores).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const maiorValor = Math.max(...valores).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        itens.push({ 
            type: 10, 
            content: `**R$ ${menorValor}** - **R$ ${maiorValor}**\n-# Clique no botão abaixo para ver as opções` 
        });

        let estilo = 2;
        if (fdfd?.estilobutton == 'verde') estilo = 3;
        if (fdfd?.estilobutton == 'azul') estilo = 1;
        if (fdfd?.estilobutton == 'vermelho') estilo = 4;

        const botoes = [{
            type: 2,
            style: estilo,
            label: "Ver Opções",
            custom_id: `veropcoes_${produtoId}`,
            emoji: formatarEmoji(fdfd?.emoji || "1468466320189427713")
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

async function MessageCreate(interaction, client) {
    const fdfd = await db.get(`${interaction.user.id}_colocarvenda`);
    if (!fdfd) return interaction.reply({ content: "Erro ao recuperar dados.", ephemeral: true });

    const yyy = produtos.get(fdfd.produto);
    const channel = await client.channels.fetch(interaction.values[0]);

    const itensContainer = montarCorpoV2(yyy, fdfd, fdfd.produto);

    try {
        await interaction.update({ content: `${Emojis.get('loading')} Publicando...`, components: [], embeds: [] });

        // Usar a cor personalizada do usuário ou cor padrão
        const corContainer = fdfd.colorembed || "#2f3136";
        const payload = container(corContainer, ...itensContainer);

        const msggg = await channel.send(payload);

        await produtos.push(`${fdfd.produto}.mensagens`, { 
            guildid: msggg.guild.id, channelid: msggg.channel.id, mesageid: msggg.id,
            btn_style: fdfd.estilobutton, btn_emoji: fdfd.emoji, btn_text: fdfd.textobutton,
            btn_color: fdfd.colorembed
        });

        const rowLink = new ActionRowBuilder().addComponents(new ButtonBuilder().setURL(msggg.url).setLabel('Ir para a venda').setStyle(5));
        await interaction.editReply({ content: `${Emojis.get('checker')} Postado!`, components: [rowLink] });

    } catch (error) {
        console.error(error);
    }
}

async function UpdateMessageProduto(client, produto) {
    const ghgh = await produtos.get(produto);
    if (!ghgh || !ghgh.mensagens) return;

    for (const element of ghgh.mensagens) {
        try {
            const channel = await client.channels.fetch(element.channelid);
            const fetchedMessage = await channel.messages.fetch(element.mesageid);
            
            // Monta o container com os dados salvos do botão
            const fdfd = {
                estilobutton: element.btn_style,
                emoji: element.btn_emoji,
                textobutton: element.btn_text
            };
            
            const itensContainer = montarCorpoV2(ghgh, fdfd, produto);

            // Usar a cor salva ou cor padrão
            const corContainer = element.btn_color || "#2f3136";
            const updateResponse = container(corContainer, ...itensContainer);

            await fetchedMessage.edit(updateResponse);
        } catch (error) { console.error(error); }
    }
}

module.exports = { MessageCreate, UpdateMessageProduto };