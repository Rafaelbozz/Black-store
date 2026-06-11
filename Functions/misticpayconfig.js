const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");
const { res } = require("../res");
const axios = require("axios");

async function misticConfigs(interaction) {
    const clientId = configuracao.get(`pagamentos.mistclientid`) || "";
    const clientSecret = configuracao.get(`pagamentos.misticsecret`) || "";
    const status = configuracao.get(`pagamentos.MisticSystem`) ?? false;
    
    let saldoDisplay = "❌ Credenciais não configuradas";
    let credenciaisStatus = "❌ As credenciais não foram configuradas ainda.";

    const maskKey = (key) => {
        if (!key || key.length < 5) return "Não definido";
        return `${key.substring(0, 4)}********`;
    };

    if (clientId !== "" && clientSecret !== "") {
        credenciaisStatus = "✅ Todas as credenciais estão configuradas perfeitamente!";
        
        try {
            const response = await axios.get('https://api.misticpay.com/api/users/balance', {
                headers: { 
                    'ci': clientId,
                    'cs': clientSecret 
                }
            });

            const saldo = response.data.data?.balance || 0;
            saldoDisplay = `R$ ${Number(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        } catch (error) {
            console.error("Erro Mistic Pay:", error.response?.data || error.message);
            saldoDisplay = "⚠️ Erro (Verifique as chaves)";
            credenciaisStatus = "⚠️ Erro de Autenticação na API";
        }
    }

    const rowActions = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("setMisticCreds")
            .setLabel('Configurar Credenciais')
            .setEmoji(Emojis.get('_lapis_emoji') ? Emojis.get('_lapis_emoji').match(/\d+/)?.[0] : '✏️')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("toggleMisticStatus")
            .setLabel(status ? "Desativar Gateway" : "Ativar Gateway")
            .setEmoji(`1246953228655132772`)
            .setStyle(status ? 4 : 3),
        new ButtonBuilder()
            .setCustomId("requestMisticWithdraw")
            .setLabel('Sacar Saldo')
            .setEmoji(Emojis.get('carteirasaque') ? Emojis.get('carteirasaque').match(/\d+/)?.[0] : '💰')
            .setStyle(2)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("formasdepagamentos")
            .setLabel('Voltar ao Menu')
            .setEmoji(`1238413255886639104`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `**${Emojis.get('mistic')} Configurar Mistic Pay**` },
        { type: 14 },
        { type: 10, content: `Bem-vindo à Central de Controle Mistic Pay. Através deste painel, você tem total autonomia sobre a integração financeira do seu sistema, monitore o saldo disponível em tempo real e realize saques instantâneos.` },
        { type: 10, content: `**Informaçoes Atuais**\n> - **Client ID:** \`${maskKey(clientId)}\`\n> - **Client Secret:** \`${maskKey(clientSecret)}\`\n> - **Saldo na Carteira:** \`${saldoDisplay}\`\n> - **Status Gateway:** \`${status ? "Habilitado" : "Desativado"}\`` },
        { type: 14 }
    ).with({
        components: [rowActions, rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

module.exports = { misticConfigs };
