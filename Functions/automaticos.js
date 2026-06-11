const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");
const { res } = require("../res");

function getEmojiObject(emojiStr) {
    if (!emojiStr || emojiStr === "") return { name: "⚙️" };
    if (/^\d+$/.test(emojiStr)) return { id: emojiStr };
    const match = emojiStr.match(/<a?:\w+:(\d+)>/);
    if (match) return { id: match[1] };
    return { name: emojiStr };
}

async function automatico(interaction, client) {
    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar1")
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setLabel('Voltar')
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `**Gerenciar Ações Automáticas**` },
        { type: 14 },
        { type: 10, content: `##  Central de Automações\n\n> Configure sistemas automáticos para otimizar a moderação e gestão do seu servidor.\n> Automatize tarefas repetitivas e melhore a experiência dos seus membros.` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "select_acoes_automaticas",
                placeholder: "Selecione uma ação automática",
                options: [
                    {
                        label: "Repostagem Automática",
                        value: "automaticRepostar",
                        description: "Republique produtos automaticamente",
                        emoji: { id: "1472813288701296801" }
                    },
                    {
                        label: "Configurar Mensagens Automáticas",
                        value: "configMensagensAuto",
                        description: "Envie mensagens em intervalos",
                        emoji: { id: "1472813288701296801" }
                    },
                    {
                        label: "Lock Automático",
                        value: "configlock",
                        description: "Bloqueie/desbloqueie canais por horário",
                        emoji: { id: "1472813288701296801" }
                    },
                    {
                        label: "Monitorador de Feedbacks",
                        value: "monitorfeedbacks",
                        description: "Monitore feedbacks negativos automaticamente",
                        emoji: { id: "1472813288701296801" }
                    },
                    {
                        label: "Sistema de Sugestões",
                        value: "sistemasugestoes",
                        description: "Configure o sistema de sugestões",
                        emoji: { id: "1472813288701296801" }
                    },
                    {
                        label: "Reações Automáticas",
                        value: "reacoesautomaticas",
                        description: "Configure reações automáticas em mensagens",
                        emoji: { id: "1472813288701296801" }
                    },
                    {
                        label: "Rastreador de Invites",
                        value: "rastreadorinvites",
                        description: "Rastreie quem convidou cada membro",
                        emoji: { id: "1472813288701296801" }
                    },
                    {
                        label: "Mensagem de Boas-vindas",
                        value: "mensagemboasvindas",
                        description: "Configure mensagens de boas-vindas",
                        emoji: { id: "1472813288701296801" }
                    },
                    {
                        label: "Nuke Automático",
                        value: "nukeautomatico",
                        description: "Limpe canais automaticamente",
                        emoji: { id: "1472813288701296801" }
                    },
                    {
                        label: "Limpeza Automática",
                        value: "limpezaautomatica",
                        description: "Apague mensagens automaticamente",
                        emoji: { id: "1472813288701296801" }
                    }
                ]
            }]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

module.exports = {
    automatico
};
