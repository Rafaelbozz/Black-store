const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { Emojis, configuracao } = require("../DataBaseJson");
const { res } = require("../res");

const dbPath = path.join(__dirname, "..", "DataBaseJson", "configauth02api.json");
const API_URL = "https://ryzenecloud.squareweb.app/"; 
const AUTH_TOKEN = "galaodamassa581";

async function auth02api(interaction) {
    let configLocal = {};
    let totalMembros = 0;

    if (fs.existsSync(dbPath)) {
        configLocal = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }

    const botID = configLocal.bot_id;
    const isVerificacaoAtiva = configuracao.get('Verificacaobrigatoria') === "true";

    if (botID) {
        try {
            const response = await axios.get(`${API_URL}/api/auth02/info/${botID}`, {
                headers: { 'Authorization': AUTH_TOKEN },
                timeout: 5000
            });
            if (response.data.sucesso) {
                totalMembros = response.data.membros;
            }
        } catch (err) {
            console.error("Erro ao buscar info na API:", err.message);
        }
    }

    const rowBotoes1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("mensagem_auth02")
            .setLabel('Enviar Verificação')
            .setEmoji(Emojis.get('_lapis_emoji') || '📝')
            .setStyle(1)
            .setDisabled(!botID),
        new ButtonBuilder()
            .setCustomId("logauth")
            .setLabel('Logs Webhook')
            .setEmoji(Emojis.get('_rigth_emoji') || '📋')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("recuperarmembroauth")
            .setLabel('Recuperar Membros')
            .setEmoji(Emojis.get('_change_emoji') || '🔄')
            .setStyle(3)
            .setDisabled(!botID)
    );

    const rowBotoes2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("setAuth02Keys")
            .setLabel('Configurar Bot')
            .setEmoji(Emojis.get('_settings_emoji') || '⚙️')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("configurar_venda_membro")
            .setLabel(isVerificacaoAtiva ? 'Desativar Verificação' : 'Ativar Verificação')
            .setEmoji(isVerificacaoAtiva ? Emojis.get('desligado') : Emojis.get('ligado'))
            .setStyle(isVerificacaoAtiva ? 4 : 3)
            .setDisabled(!botID),
        new ButtonBuilder()
            .setCustomId("gerenciar_gifts_membros")
            .setLabel('Gerenciar Gifts Membros')
            .setEmoji('<:hand_package_24dp_E3E3E3_FILL0_w:1468089216176230696>')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!botID)
    );

    const btnAddBot = new ButtonBuilder()
        .setLabel('Adicionar Bot ao Servidor')
        .setStyle(ButtonStyle.Link);

    if (botID) {
        btnAddBot.setURL(`https://discord.com/api/oauth2/authorize?client_id=${botID}&permissions=8&scope=bot%20applications.commands`);
    } else {
        btnAddBot.setURL('https://discord.com').setDisabled(true);
    }

    const rowLink = new ActionRowBuilder().addComponents(btnAddBot);

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltarilusioncloud")
            .setLabel('Voltar')
            .setEmoji(Emojis.get('_back_emoji') || '◀️')
            .setStyle(2)
    );

    const statusSistema = botID ? '🟢 Ativo' : '🔴 Pendente';
    const statusVerificacao = isVerificacaoAtiva ? '✅ Habilitada' : '❌ Desabilitada';

    const containerContent = res.main(
        { type: 10, content: `-# Painel > NexusCloud > Sistema OAuth02` },
        { type: 14 },
        { type: 10, content: `## Sistema OAuth02 Enterprise\n\n> Gerencie sua infraestrutura OAuth2 e a retenção de membros em tempo real.\n> Mantenha seu servidor seguro com verificação avançada de usuários.` },
        { type: 14 },
        { type: 10, content: `**Informações do Sistema**\n- Bot Auth02: ${botID ? `<@${botID}>` : `\`Não configurado\``}\n- Membros Verificados: \`${totalMembros}\`\n- Status: \`${statusSistema}\`\n- Verificação Obrigatória: \`${statusVerificacao}\`` },
        { type: 14 },
        { type: 10, content: `**URL da API**\n- Endpoint: \`https://ryzenecloud.squareweb.app/auth02/verify\`` },
        { type: 14 }
    ).with({
        components: [rowBotoes1, rowBotoes2, rowLink, rowVoltar],
        flags: [64]
    });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}

module.exports = { auth02api };
