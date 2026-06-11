const { 
    ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder 
} = require("discord.js");
const { DentroCarrinho1 } = require("./DentroCarrinho");
const { carrinhos, configuracao, EmojisHelper } = require("../DataBaseJson");
const fs = require('fs');
const path = require('path');

const Emojis = EmojisHelper;

const dbPathAuth = path.join(__dirname, "..", "DataBaseJson", "configauth02api.json");
const REDIRECT_URL = "https://ryzenecloud.squareweb.app/auth02/verify";

function VerificaçõesCarrinho(infos) {
    if (infos.estoque <= 0) return { error: 400, message: `Sem Stock Disponível` };
    return { status: 202 };
}

async function CreateCarrinho(interaction, infos) {
    if (infos.isFromSelectMenu) {
        await interaction.update({ 
            content: `${Emojis.get('loading')} Iniciando Verificações de Segurança...`, 
            components: []
        });
    } else {
        await interaction.reply({ 
            content: `${Emojis.get('loading')} Iniciando Verificações de Segurança...`, 
            ephemeral: true 
        });
    }

    const mpAtivo = configuracao.get('pagamentos.MpAPI') ? true : false;
    const efiAtivo = configuracao.get('pagamentos.sistema_efi') && configuracao.get('pagamentos.secret_id') && configuracao.get('pagamentos.secret_token') ? true : false;
    const misticAtivo = configuracao.get('pagamentos.MisticSystem') && configuracao.get('pagamentos.mistclientid') && configuracao.get('pagamentos.misticsecret') ? true : false;
    const imapAtivo = configuracao.get('pagamentos.imap.status') && configuracao.get('pagamentos.imap.chavepiximap') ? true : false;
    const semiAutoAtivo = configuracao.get('pagamentos.SemiAutomatico.status') || false;

    if (!mpAtivo && !efiAtivo && !misticAtivo && !imapAtivo && !semiAutoAtivo) {
        return interaction.editReply({ 
            content: `${Emojis.get('negative')} Nenhuma forma de pagamento está habilitada no momento. Entre em contato com a administração.` 
        });
    }

    const statusComercio = configuracao.get('StatusComercio') || 'aberto';
    if (statusComercio === 'fechado') {
        return interaction.editReply({ 
            content: `${Emojis.get('negative')} Nossa loja está fechada no momento. Tente novamente mais tarde...` 
        });
    }

    const isVerificacaoObrigatoria = configuracao.get('Verificacaobrigatoria') === "true";

    if (isVerificacaoObrigatoria) {
        if (!fs.existsSync(dbPathAuth)) {
            return interaction.editReply({ 
                content: `${Emojis.get('negative')} | Erro interno: Base de dados Auth não encontrada.` 
            });
        }

        const authDataRaw = JSON.parse(fs.readFileSync(dbPathAuth, 'utf-8'));
        
        const botIds = Object.keys(authDataRaw);
        const configAuth = authDataRaw.bot_id ? authDataRaw : authDataRaw[botIds[0]];

        const roleID = configAuth?.role_id;
        const botClientID = configAuth?.bot_id;

        if (!roleID || !botClientID) {
            return interaction.editReply({ 
                content: `${Emojis.get('negative')} | O sistema exige verificação, mas as configurações de Auth estão incompletas no JSON.` 
            });
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member.roles.cache.has(roleID)) {
            
            const linkFinal = `https://discord.com/api/oauth2/authorize?client_id=${configAuth.bot_id}&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&response_type=code&scope=identify%20guilds.join&state=${configAuth.bot_id}`;

            const rowVerify = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setURL(linkFinal)
                    .setLabel('Clique aqui para se verificar')
                    .setStyle(ButtonStyle.Link)
            );

            return interaction.editReply({ 
                content: `Este servidor requer que os membros estejam verificados para realizar compras.\nclique no botão abaixo e autorize a verificação para continuar.\n-# Isso e Apenas uma Medida de Segurança , voce nao sera puxado`,
                embeds: [],
                components: [rowVerify]
            });
        }
    }

    await interaction.editReply({ 
        content: `${Emojis.get('loading')} Verificando disponibilidade no estoque...`, 
        embeds: [],
        components: [] 
    });

    const carrinhoStatus = VerificaçõesCarrinho(infos);
    if (carrinhoStatus.error) {
        return interaction.editReply({ 
            content: `${Emojis.get('negative')} | ${carrinhoStatus.message}` 
        });
    }

    const threadExistente = interaction.channel.threads.cache.find(x => x.name.includes(interaction.user.id));
    
    if (threadExistente) {
        const rowExistente = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${threadExistente.id}`)
                .setLabel('Ir para o carrinho')
                .setStyle(ButtonStyle.Link)
        );

        return interaction.editReply({ 
            content: `${Emojis.get('negative')} Você já possui um carrinho aberto.`, 
            components: [rowExistente] 
        });
    }

    try {
        const thread = await interaction.channel.threads.create({
            name: `🛒・${interaction.user.username}・${interaction.user.id}`,
            autoArchiveDuration: 60,
            type: ChannelType.PrivateThread,
        });

        const rowSucesso = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`)
                .setLabel('Ir para o carrinho')
                .setStyle(ButtonStyle.Link)
        );

        await interaction.editReply({ 
            content: `${Emojis.get('checker')} Carrinho criado com sucesso!`, 
            components: [rowSucesso] 
        });

        await carrinhos.set(thread.id, { 
            user: interaction.user, 
            guild: interaction.guild, 
            threadid: thread.id, 
            infos: infos 
        });

        DentroCarrinho1(thread);

    } catch (error) {
        console.error(error);
        await interaction.editReply({ 
            content: `${Emojis.get('negative')} Erro ao criar canal. Verifique minhas permissões.` 
        });
    }
}

module.exports = {
    VerificaçõesCarrinho,
    CreateCarrinho
};