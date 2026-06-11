const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { res } = require("../res");
const { configuracao } = require("../DataBaseJson");

async function PainelPersonalizarBot(interaction, client) {
    const botName = client.user.username;
    const botStatus = configuracao.get("Status1") || "Nenhum status definido";
    const botAvatar = client.user.displayAvatarURL({ dynamic: true });

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltaraparencia")
                .setLabel('Voltar')
                .setEmoji("1384035199192666243")
                .setStyle(2)
        );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Aparência > Personalizar Bot` },
        { type: 14 },
        { type: 10, content: `## Personalizar Bot\n\n> Seja bem-vindo ao painel de personalização! Aqui você pode customizar completamente a identidade visual do seu bot, alterando nome, avatar, status e até as cores das embeds. Deixe seu bot com a cara do seu servidor!` },
        { type: 14 },
        { type: 10, content: `**Configurações Atuais:**\n- **Nome:** ${botName}\n- **Status:** ${botStatus}\n- **Avatar:** [Clique aqui](${botAvatar})` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "personalizar_select_menu",
                placeholder: "Selecione uma opção",
                options: [
                    {
                        label: "Alterar Nome do Bot",
                        description: "Altere o nome do seu bot",
                        value: "alterar_nome",
                        emoji: { id: "1466883685046292605" }
                    },
                    {
                        label: "Alterar Avatar",
                        description: "Altere o avatar do seu bot",
                        value: "alterar_avatar",
                        emoji: { id: "1466883667065307208" }
                    },
                    {
                        label: "Alterar Status do Bot",
                        description: "Altere o status do seu bot",
                        value: "alterar_status",
                        emoji: { id: "1466883646450438157" }
                    }
                ]
            }]
        }
    ).with({
        components: [row2],
        flags: [64]
    });

    if (interaction.message == undefined) {
        interaction.reply(containerContent);
    } else {
        interaction.update(containerContent);
    }
}

module.exports = { PainelPersonalizarBot };
