const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios");
const fs = require('fs');
const path = require('path');
const { Emojis } = require("../DataBaseJson/index");
const { res } = require("../res");

const API_URL = "https://ryzenecloud.squareweb.app/";
const dbPathAuth = path.join(__dirname, "..", "DataBaseJson", "configauth02api.json");

async function PainelGifts(interaction) {
    try {
        let giftsGerados = 0;
        let giftsResgatados = 0;
        let giftsNaoResgatados = 0;

        if (fs.existsSync(dbPathAuth)) {
            const authData = JSON.parse(fs.readFileSync(dbPathAuth, 'utf-8'));
            const botId = authData.bot_id;

            if (botId) {
                const giftsRes = await axios.get(`${API_URL}api/gifts/bot/${botId}/stats`, {
                    timeout: 5000
                });

                if (giftsRes.data.sucesso) {
                    giftsGerados = giftsRes.data.gifts_gerados_total || 0;
                    giftsResgatados = giftsRes.data.gifts_resgatados || 0;
                    giftsNaoResgatados = giftsRes.data.gifts_nao_resgatados || 0;
                }
            }
        }

        const rowBotoes1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("criar_gift_membro")
                .setLabel('Criar Gift Membros')
                .setEmoji('<:hand_package_24dp_E3E3E3_FILL0_w:1468089216176230696>')
                .setStyle(ButtonStyle.Success)
        );

        const rowVoltar = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("voltar_painel_auth02")
                .setLabel('Voltar')
                .setEmoji(Emojis.get('_back_emoji') || '◀️')
                .setStyle(ButtonStyle.Secondary)
        );

        const containerContent = res.main(
            { type: 10, content: `-# Painel > NexusCloud > Sistema OAuth02 > Gerenciar Gifts` },
            { type: 14 },
            { type: 10, content: `## 🎁 Gerenciamento de Gifts de Membros\n\n> Sistema de gifts permite criar códigos únicos que podem ser resgatados para adicionar membros a servidores do Discord.` },
            { type: 14 },
            { type: 10, content: `**Estatísticas de Gifts**\n- Gifts Gerados: \`\`${giftsGerados}\`\`\n- Gifts Resgatados: \`\`${giftsResgatados}\`\`\n- Gifts Ainda não Resgatados: \`\`${giftsNaoResgatados}\`\`\n\n**Todos os Dados Totalmente Sicronizados Com A API em Tempo Real**` },
            { type: 14 }
        ).with({
            components: [rowBotoes1, rowVoltar],
            flags: [64]
        });

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(containerContent);
        } else {
            await interaction.update(containerContent);
        }

    } catch (err) {
        console.error("Erro ao carregar painel de gifts:", err.message);

        const rowBotoes1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("criar_gift_membro")
                .setLabel('Criar Gift Membros')
                .setEmoji('<:hand_package_24dp_E3E3E3_FILL0_w:1468089216176230696>')
                .setStyle(ButtonStyle.Success)
        );

        const rowVoltar = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("voltar_painel_auth02")
                .setLabel('Voltar')
                .setEmoji(Emojis.get('_back_emoji') || '◀️')
                .setStyle(ButtonStyle.Secondary)
        );

        const containerContent = res.main(
            { type: 10, content: `-# Painel > NexusCloud > Sistema OAuth02 > Gerenciar Gifts` },
            { type: 14 },
            { type: 10, content: `## 🎁 Gerenciamento de Gifts de Membros\n\n> Sistema de gifts permite criar códigos únicos que podem ser resgatados para adicionar membros a servidores do Discord.` },
            { type: 14 },
            { type: 10, content: `**Estatísticas de Gifts**\n- Gifts Gerados: \`\`0\`\`\n- Gifts Resgatados: \`\`0\`\`\n- Gifts Ainda não Resgatados: \`\`0\`\`\n\n${Emojis.get('negative')} *Erro ao carregar estatísticas da API*` },
            { type: 14 }
        ).with({
            components: [rowBotoes1, rowVoltar],
            flags: [64]
        });

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(containerContent);
        } else {
            await interaction.update(containerContent);
        }
    }
}

module.exports = { PainelGifts };
