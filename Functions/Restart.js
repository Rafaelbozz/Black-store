const { ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { configuracao, EmojisHelper } = require('../DataBaseJson');
const { res } = require('../res');

const Emojis = EmojisHelper;

async function restart(client) {

    if (configuracao.get('ConfigChannels.systemlogs') == null) return;

    const containerContent = res.main(
        { type: 10, content: `-# Sistema > Reinicialização` },
        { type: 14 },
        { type: 10, content: `## Sistema Reiniciado\n\n> Seu bot foi reiniciado com sucesso e já está operando normalmente.` },
        { type: 14 },
        { type: 10, content: `**Informações do Sistema**\n- Versão: \`3.9.8\`\n- Data: <t:${Math.ceil(Date.now() / 1000)}:R>` },
        { type: 14 }
    ).with({
        components: [{
            type: 1,
            components: [
                {
                    type: 2,
                    label: 'Reiniciado com Sucesso!',
                    custom_id: "restart_success",
                    style: 2,
                    disabled: true
                },
                {
                    type: 2,
                    label: 'Servidor de Suporte',
                    url: 'https://discord.gg/SmkshsgUEr',
                    style: ButtonStyle.Link
                },
                {
                    type: 2,
                    label: 'Dashboard',
                    url: 'https://ilusionsoluctions.com.br/dashboard',
                    style: ButtonStyle.Link
                }
            ]
        }],
        flags: [MessageFlags.IsComponentsV2]
    });

    try {
        const channel = await client.channels.fetch(configuracao.get('ConfigChannels.systemlogs'));
        await channel.send(containerContent);
    } catch (error) { }
}

module.exports = {
    restart
}
