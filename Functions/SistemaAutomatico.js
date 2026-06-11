const { EmbedBuilder } = require("discord.js");
const { configuracao } = require("../DataBaseJson");

async function ClearAutomatic(client) {
    try {
        let info = configuracao.get(`AutomaticSettings.LimpezaAutomatica`);
        if (!info || !info?.status || !info?.canais || info?.canais?.length === 0 || !info?.primeira || !info.segunda) return;

        let agora = new Date();
        let horaAtual = agora.getHours();
        let minutoAtual = agora.getMinutes();

        let [horaPrimeira, minutoPrimeira] = info.primeira.split(":").map(Number);
        let [horaSegunda, minutoSegunda] = info.segunda.split(":").map(Number);

        let execucaoPrimeira = configuracao.get(`AutomaticSettings.LimpezaAutomatica.execucaoprimeira`);
        let execucaoSegunda = configuracao.get(`AutomaticSettings.LimpezaAutomatica.execucaosegunda`);

        if (horaAtual === horaPrimeira && minutoAtual === minutoPrimeira && !execucaoPrimeira) {
            configuracao.set(`AutomaticSettings.LimpezaAutomatica.execucaoprimeira`, true);
            await limparCanais(client, info.canais);
            configuracao.set(`AutomaticSettings.LimpezaAutomatica.execucaosegunda`, false);
        }

        if (horaAtual === horaSegunda && minutoAtual === minutoSegunda && !execucaoSegunda) {
            configuracao.set(`AutomaticSettings.LimpezaAutomatica.execucaosegunda`, true);
            await limparCanais(client, info.canais);
            configuracao.set(`AutomaticSettings.LimpezaAutomatica.execucaoprimeira`, false);
        }

    } catch (error) {
        console.error(`Erro ao limpar automaticamente: ${error.message}`);
    }
}

async function limparCanais(client, canais) {

    for (const key in canais) {
        const canal = canais[key];
        try {
            const channel = await client.channels.fetch(canal);
            channel.messages.fetch().then(async messages => {
                for (const message of messages.values()) {
                    try {
                        if (message.deletable) {
                            await message.delete();
                        } else {
                            console.log(`Não é possível deletar a mensagem ${message.id}. Sem permissão ou é uma mensagem fixa.`);
                        }
                    } catch (error) {
                        if (error.code === 50001) {
                            console.log(`Erro ao deletar a mensagem ${message.id}: Acesso ausente.`);
                        } else {
                            console.log(`Erro ao deletar a mensagem ${message.id}: ${error.message}`);
                        }
                    }
                }
            })
        } catch (error) {
            console.error(`Erro ao limpar canal ${canal}: ${error.message}`);
        }
    }
}
async function SystemLockAndUnlock(client) {
    let info = configuracao.get(`AutomaticSettings.GerenciarCanais`);
    if (!info || !info?.status || !info?.canais || info?.canais?.length === 0 || !info?.abertura || !info.fechamento) return;

    let horarioatual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' });
    let horarioabertura = info.abertura;
    let horariofechamento = info.fechamento;

    if (horarioatual === horarioabertura) {
        configuracao.set(`AutomaticSettings.GerenciarCanais.tipo`, "aberto");
        if (info?.tipo == "aberto") return;
        await UnlockChannels(client, info.canais)
    } else if (horarioatual === horariofechamento) {
        configuracao.set(`AutomaticSettings.GerenciarCanais.tipo`, "fechado");
        if (info?.tipo == "fechado") return;
        await LockChannels(client, info.canais)

    }
}

async function UnlockChannels(client, canais) {
    const embed = new EmbedBuilder()
        .setAuthor({ name: 'Canal Aberto Pelo Sistema', iconURL: 'https://cdn.discordapp.com/emojis/1230562932044070922.webp?size=44&quality=lossless' })
        .setColor('#41ffa1')
        .setDescription('- Este canal foi aberto automaticamente pelo sistema.\n- Agora você pode enviar mensagens.');

    let ids = [];
    for (const canal of canais) {
        try {
            const channel = await client.channels.fetch(canal);
            await channel.permissionOverwrites.edit(channel.guild.id, { SendMessages: true });

            const msgIds = configuracao.get('AutomaticSettings.GerenciarCanais.mensagem') || [];
            for (const mensagemId of msgIds) {
                try {
                    const message = await client.channels.cache.get(canal).messages.fetch(mensagemId);
                    await message.delete();
                } catch (error) {
                }
            }

            const msg = await channel.send({ embeds: [embed] });
            ids.push(msg.id);
        } catch (error) {
            console.error(`Erro ao abrir canal ${canal}: ${error.message}`);
        }
    }
    configuracao.set('AutomaticSettings.GerenciarCanais.mensagem', ids);
}

async function LockChannels(client, canais) {
    const abertura = configuracao.get('AutomaticSettings.GerenciarCanais.abertura') || 'não definida';
    const embed = new EmbedBuilder()
        .setAuthor({ name: 'Canal Fechado Pelo Sistema', iconURL: 'https://cdn.discordapp.com/emojis/1230562904424845322.webp?size=44&quality=lossless' })
        .setColor('#ff5251')
        .setDescription(`- Este canal foi fechado automaticamente. Ele será reaberto às \`${abertura}\`.`);

    let ids = [];
    for (const canal of canais) {
        try {
            const channel = await client.channels.fetch(canal);
            await channel.permissionOverwrites.edit(channel.guild.id, { SendMessages: false });

            const msgIds = configuracao.get('AutomaticSettings.GerenciarCanais.mensagem') || [];
            for (const mensagemId of msgIds) {
                try {
                    const message = await client.channels.cache.get(canal).messages.fetch(mensagemId);
                    await message.delete();
                } catch (error) {
                }
            }

            const msg = await channel.send({ embeds: [embed] });
            ids.push(msg.id);
        } catch (error) {
            console.error(`Erro ao fechar canal ${canal}: ${error.message}`);
        }
    }
    configuracao.set('AutomaticSettings.GerenciarCanais.mensagem', ids);
}
async function SystemNukedChannels(client) {
    let info = configuracao.get(`AutomaticSettings.SistemaNukar`);
    if (!info || !info?.status || !info?.canais || info?.canais?.length === 0 || !info?.horario) return;

    let hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' });

    if (hora === info.horario) {
        let data = `${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${hora}`;
        if (info?.data == data) return;
        configuracao.set(`AutomaticSettings.SistemaNukar.data`, data)
        let ids = [];
        for (const canal of info.canais) {  
            try {
                const channel = await client.channels.fetch(canal);
                await channel.clone({ reason: 'Canal nukado automaticamente pelo sistema.' }).then(async (channel) => {
                    ids.push(channel.id);
                    await channel.send({ content: `\`Channel Nuked by: System\`` });
                });
                await channel.delete({ reason: 'Canal nukado automaticamente pelo sistema.' });
            } catch (error) {
                console.error(`Erro ao nukar canal ${canal}: ${error.message}`);
            }
        }
        configuracao.set('AutomaticSettings.SistemaNukar.canais', ids);
    }
}






module.exports = {
    ClearAutomatic,
    SystemLockAndUnlock,
    SystemNukedChannels
}