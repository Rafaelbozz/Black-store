const { GatewayIntentBits, Client, Collection, ChannelType, EmbedBuilder, Partials, Events } = require("discord.js");
const { AtivarIntents } = require("./Functions/StartIntents");
const { UploadEmojis } = require('./FunctionEmojis/EmojisFunction.js');
const { carregarCache } = require('./Handler/EmojiFunctions');
const express = require("express");
const { agendarRepostagem } = require('./Functions/repostagem');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const criarCanais = require('./Functions/CriarCanais.js');

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
    ],
    sweepers: {
        messages: {
            interval: 300,
            lifetime: 600,
        },
        users: {
            interval: 3600,
            filter: () => user => user.bot && user.id !== client.user?.id,
        },
    },
});

const estatisticasStormInstance = require("./Functions/VariaveisEstatisticas");
const EstatisticasStorm = new estatisticasStormInstance();
module.exports = { EstatisticasStorm }

function getSaudacao() {
    const brazilTime = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const hora = new Date(brazilTime).getHours();

    if (hora < 12) {
        return "Bom dia";
    } else if (hora < 18) {
        return "Boa tarde";
    } else {
        return "Boa noite";
    }
}

const config = require("./config.json");
const events = require("./Handler/events");
const slash = require("./Handler/slash");

client.slashCommands = new Collection();
client.activityRotationInterval = null;
client.activityRotationTexts = [];
client.activityRotationIndex = 0;
client.activityRotationType = null;

slash.run(client);
events.run(client);

client.on("guildCreate", (guild) => {
    if (client.guilds.cache.size > 1) {
        guild.leave();
    }
});

process.on("unhandRejection", (reason, promise) => {});
process.on("uncaughtException", (error, origin) => {});
process.on("uncaughtExceptionMonitor", (error, origin) => {});

const login = require("./routes/login");
app.use("/", login);

const callback = require("./routes/callback");
app.use("/", callback);

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor online na porta ${PORT}`);
});

client.on("ready", async () => {
    console.log("Bot online!");

    try {
        const fs = require('fs');
        const permsPath = './DataBaseJson/perms.json';
        const config = require('./config.json');
        let permsData = {};
        
        if (fs.existsSync(permsPath)) {
            permsData = JSON.parse(fs.readFileSync(permsPath, 'utf8'));
        }
        
        const ownerId = config.owner;
        
        if (ownerId && !permsData[ownerId]) {
            permsData[ownerId] = ownerId;
            fs.writeFileSync(permsPath, JSON.stringify(permsData, null, 2));
            console.log(`\x1b[36m[Permissões]\x1b[35m Owner (${ownerId}) adicionado automaticamente às permissões.`);
        }
    } catch (error) {
        console.error('\x1b[31m[Permissões]\x1b[0m Erro ao adicionar owner:', error);
    }

    const activities = [{ name: `Nexus Applications 🤖`, type: 1, url: "https://www.twitch.tv/discord" }];

    let i = 0;
    setInterval(() => {
        if (i >= activities.length) i = 0;
        client.user.setActivity(activities[i]);
        i++;
    }, 60 * 1000);

    await UploadEmojis(client)
        .then(() => console.log('\x1b[36m[Emojis]\x1b[35m Todos os emojis foram carregados com sucesso.'))
        .catch(err => console.error('\x1b[31m[Emojis]\x1b[0m Erro ao carregar os emojis:', err));
        console.log(`\x1b[36m[Log Principal]\x1b[35m ${client.user.tag} Iniciado Atualmente em ${client.guilds.cache.size} servidores, ${client.channels.cache.size} canais e ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)} usuários`);

    carregarCache();

    const CANAL_ID = '1475903146424537230';
    const EMOJI_ID = '1477527184938766437';
    
    try {
        const canal = await client.channels.fetch(CANAL_ID).catch(() => null);
        
        if (canal) {
            console.log(`\x1b[36m[Reação Auto]\x1b[35m Sistema de reação automática ativado no canal ${canal.name}`);
            
            let mensagensAntigas = 0;
            try {
                const mensagens = await canal.messages.fetch({ limit: 100 });
                
                for (const msg of mensagens.values()) {
                    if (msg.author.bot) continue;
                    
                    const jaTemReacao = msg.reactions.cache.has(EMOJI_ID);
                    
                    if (!jaTemReacao) {
                        await msg.react(EMOJI_ID).catch(() => {});
                        mensagensAntigas++;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                
                console.log(`\x1b[36m[Reação Auto]\x1b[35m ${mensagensAntigas} mensagens antigas reagidas com sucesso`);
            } catch (error) {
                console.error('\x1b[31m[Reação Auto]\x1b[0m Erro ao reagir mensagens antigas:', error);
            }
        } else {
            console.error('\x1b[31m[Reação Auto]\x1b[0m Canal não encontrado');
        }
    } catch (error) {
        console.error('\x1b[31m[Reação Auto]\x1b[0m Erro ao configurar sistema:', error);
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const CANAL_ID = '1475903146424537230';
    const EMOJI_ID = '1477527184938766437';
    
    if (message.channel.id === CANAL_ID) {
        try {
            await message.react(EMOJI_ID);
        } catch (error) {
            console.error('[Reação Auto] Erro ao reagir:', error);
        }
    }

    try {
        const { ProcessarSugestao } = require("./Functions/SistemaSugestoes.js");
        await ProcessarSugestao(message, client);
    } catch (e) {}
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "criarcanaisfds") {
        const embed = new EmbedBuilder()
            .setAuthor({ name: `Ryzen SysteM - Auto Config`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
            .setDescription(`-# Olá Senhor(a) ${interaction.user}, este comando irá criar uma categoria no fundo do seu servidor e irá criar os canais e auto configurar automaticamente. Deseja continuar com a ação?`)
            .setColor("#2F3136");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("confirmarCriacao")
                .setLabel("Confirmar")
                .setStyle(3),
            new ButtonBuilder()
                .setCustomId("cancelarCriacao")
                .setLabel("Cancelar")
                .setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    if (interaction.customId === "confirmarCriacao") {
        criarCanais.criarCanais(interaction);
    }

    if (interaction.customId === "cancelarCriacao") {
        return interaction.update({ content: '❌ Criação de canais cancelada!', embeds: [], components: [] });
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "editarmensagemboasvindas") {
        const modalaAA = new ModalBuilder()
            .setCustomId("sdaju111idsjjsdua")
            .setTitle("Editar Boas Vindas");

        const newnameboteN = new TextInputBuilder()
            .setCustomId("tokenMP")
            .setLabel("Mensagem")
            .setPlaceholder("Insira aqui sua mensagem, use {member} para mencionar o membro e {guildname} para o servidor.")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

        const newnameboteN2 = new TextInputBuilder()
            .setCustomId("tokenMP2")
            .setLabel("TEMPO PARA APAGAR A MENSAGEM")
            .setPlaceholder("Insira aqui a quantidade em segundos.")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(6);

        const newnameboteN3 = new TextInputBuilder()
            .setCustomId("qualcanal")
            .setLabel("QUAL CANAL VAI SER ENVIADO?")
            .setPlaceholder("Insira aqui o ID do canal que vai enviar. (ID, ID, ID)")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
        const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
        const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN3);

        modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5);

        await interaction.showModal(modalaAA);
    }
});

client.login(config.token);
