const { 
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} = require("discord.js");
const { Systemrobux, EmojisHelper } = require("../DataBaseJson");

const Emojis = EmojisHelper;

async function CreateCarrinhoRobux(interaction) {
    try {
        const { carrinhosrobux, configuracao } = require("../DataBaseJson");
        const fs = require('fs');
        const path = require('path');

        const sistemaAtivo = Systemrobux.get('status') || false;
        
        if (!sistemaAtivo) {
            return interaction.reply({ 
                content: `${Emojis.get('negative')} O sistema de vendas de Robux está desativado no momento. Entre em contato com a administração.`,
                ephemeral: true
            });
        }

        const precoComTaxa = Systemrobux.get('preco_com_taxa');
        const precoSemTaxa = Systemrobux.get('preco_sem_taxa');
        
        if (precoComTaxa === 'Não configurado' || precoSemTaxa === 'Não configurado' || !precoComTaxa || !precoSemTaxa) {
            return interaction.reply({ 
                content: `${Emojis.get('negative')} Os preços do Robux não estão configurados. Entre em contato com a administração.`,
                ephemeral: true
            });
        }

        const mpAtivo = configuracao.get('pagamentos.MpAPI') ? true : false;
        const efiAtivo = configuracao.get('pagamentos.sistema_efi') && configuracao.get('pagamentos.secret_id') && configuracao.get('pagamentos.secret_token') ? true : false;
        const misticAtivo = configuracao.get('pagamentos.MisticSystem') && configuracao.get('pagamentos.mistclientid') && configuracao.get('pagamentos.misticsecret') ? true : false;
        const imapAtivo = configuracao.get('pagamentos.imap.status') && configuracao.get('pagamentos.imap.chavepiximap') ? true : false;
        const semiAutoAtivo = configuracao.get('pagamentos.SemiAutomatico.status') || false;

        if (!mpAtivo && !efiAtivo && !misticAtivo && !imapAtivo && !semiAutoAtivo) {
            return interaction.reply({ 
                content: `${Emojis.get('negative')} Nenhuma forma de pagamento está habilitada no momento. Entre em contato com a administração.`,
                ephemeral: true
            });
        }

        const statusComercio = configuracao.get('StatusComercio') || 'aberto';
        if (statusComercio === 'fechado') {
            return interaction.reply({ 
                content: `${Emojis.get('negative')} Nossa loja está fechada no momento. Tente novamente mais tarde...`,
                ephemeral: true
            });
        }

        const carrinhoExistente = carrinhosrobux.fetchAll().find(c => 
            c.data?.user?.id === interaction.user.id
        );

        if (carrinhoExistente) {
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
            const threadId = carrinhoExistente.data.threadid;
            
            const rowCarrinho = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setURL(`https://discord.com/channels/${interaction.guild.id}/${threadId}`)
                    .setLabel('Ir para o carrinho')
                    .setStyle(ButtonStyle.Link)
                    .setEmoji(Emojis.get('_cart_emoji') || '❌')
            );

            return interaction.reply({ 
                content: `${Emojis.get('negative')} Você já possui um carrinho de Robux aberto!`,
                components: [rowCarrinho],
                ephemeral: true
            });
        }

        const isVerificacaoObrigatoria = configuracao.get('Verificacaobrigatoria') === "true";
        const dbPathAuth = path.join(__dirname, "..", "DataBaseJson", "configauth02api.json");
        const REDIRECT_URL = "https://auth.ilusionsoluctions.com.br/auth02/verify";

        if (isVerificacaoObrigatoria) {
            if (!fs.existsSync(dbPathAuth)) {
                return interaction.reply({ 
                    content: `${Emojis.get('negative')} Erro interno: Base de dados Auth não encontrada.`,
                    ephemeral: true
                });
            }

            const authDataRaw = JSON.parse(fs.readFileSync(dbPathAuth, 'utf-8'));
            const botIds = Object.keys(authDataRaw);
            const configAuth = authDataRaw.bot_id ? authDataRaw : authDataRaw[botIds[0]];

            const roleID = configAuth?.role_id;
            const botClientID = configAuth?.bot_id;

            if (!roleID || !botClientID) {
                return interaction.reply({ 
                    content: `${Emojis.get('negative')} O sistema exige verificação, mas as configurações de Auth estão incompletas.`,
                    ephemeral: true
                });
            }

            const member = await interaction.guild.members.fetch(interaction.user.id);

            if (!member.roles.cache.has(roleID)) {
                const linkFinal = `https://discord.com/api/oauth2/authorize?client_id=${configAuth.bot_id}&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&response_type=code&scope=identify%20guilds.join&state=${configAuth.bot_id}`;

                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
                const rowVerify = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setURL(linkFinal)
                        .setLabel('Clique aqui para se verificar')
                        .setStyle(ButtonStyle.Link)
                );

                return interaction.reply({ 
                    content: `${Emojis.get('negative')} Este servidor requer que os membros estejam verificados para realizar compras.\n\nPor favor, clique no botão abaixo e autorize a verificação para continuar com sua compra.`,
                    components: [rowVerify],
                    ephemeral: true
                });
            }
        }

        const modal = new ModalBuilder()
            .setCustomId('modal_robux_quantidade')
            .setTitle('Comprar Robux');

        const inputQuantidade = new TextInputBuilder()
            .setCustomId('robux_quantidade')
            .setLabel('Quantidade de Robux')
            .setPlaceholder('Digite a quantidade de Robux (ex: 1000)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(10);

        const row = new ActionRowBuilder().addComponents(inputQuantidade);
        modal.addComponents(row);

        await interaction.showModal(modal);

    } catch (error) {
        console.error('[CreateCarrinhoRobux] Erro:', error);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ 
                content: `${Emojis.get('negative')} Erro ao processar sua solicitação. Tente novamente.`,
                embeds: [],
                components: []
            });
        } else {
            await interaction.reply({ 
                content: `${Emojis.get('negative')} Erro ao processar sua solicitação. Tente novamente.`,
                ephemeral: true
            });
        }
    }
}

async function MostrarSelecaoTaxa(interaction, quantidade) {
    try {
        const { Systemrobux } = require("../DataBaseJson");
        
        const precoComTaxa = parseFloat(Systemrobux.get('preco_com_taxa'));
        const precoSemTaxa = parseFloat(Systemrobux.get('preco_sem_taxa'));

        const valorComTaxa = ((quantidade / 1000) * precoComTaxa).toFixed(2);
        const valorSemTaxa = ((quantidade / 1000) * precoSemTaxa).toFixed(2);

        const { res } = require("../res");

        const containerParts = [
            { type: 10, content: `# Escolher Taxa - \`\`${quantidade.toLocaleString('pt-BR')} Robux\`\`` },
            { type: 14 },
            { type: 10, content: `-# - Aviso: Escolha se você quer comprar os robux cobrindo a taxa ou não logo abaixo. Após isso, é só preencher a linha de texto com o seu nome do roblox e prosseguir para compra!` },
            { type: 14 },
            {
                type: 1,
                components: [{
                    type: 3,
                    custom_id: `robux_select_taxa_${quantidade}`,
                    placeholder: 'Selecione a taxa dos robux',
                    options: [
                        {
                            label: `Sem Cobrir Taxa | R$ ${valorSemTaxa}`,
                            description: 'Você irá receber 30% a menos dos robux comprados',
                            value: 'sem_taxa',
                            emoji: { id: '1467553842060329132' }
                        },
                        {
                            label: `Cobrimos a Taxa | R$ ${valorComTaxa}`,
                            description: 'Você irá receber 100% dos robux comprados',
                            value: 'com_taxa',
                            emoji: { id: '1467553825303822430' }
                        }
                    ]
                }]
            }
        ];

        const containerContent = res.main(...containerParts).with({ flags: [64] });

        await interaction.reply(containerContent);

    } catch (error) {
        console.error('[MostrarSelecaoTaxa] Erro:', error);
        await interaction.reply({
            content: `${Emojis.get('negative')} Erro ao processar sua solicitação. Tente novamente.`,
            ephemeral: true
        });
    }
}

async function getRobloxUserData(username) {
    try {
        const axios = require("axios");
        
        const userSearchResponse = await axios.post('https://users.roblox.com/v1/usernames/users', {
            usernames: [username],
            excludeBannedUsers: false
        });

        if (!userSearchResponse.data.data || userSearchResponse.data.data.length === 0) {
            return null;
        }

        const userId = userSearchResponse.data.data[0].id;
        const displayName = userSearchResponse.data.data[0].displayName;
        const realUsername = userSearchResponse.data.data[0].name;

        const userInfoResponse = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        const createdDate = new Date(userInfoResponse.data.created);

        const avatarResponse = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        const avatarUrl = avatarResponse.data.data[0]?.imageUrl || 'https://tr.rbxcdn.com/38c6edcb50633730ff4cf39ac8859840/150/150/AvatarHeadshot/Png';

        return {
            userId,
            username: realUsername,
            displayName,
            avatarUrl,
            createdDate,
            exists: true
        };
    } catch (error) {
        console.error('[getRobloxUserData] Erro:', error.message);
        return null;
    }
}

async function MostrarConfirmacao(interaction, quantidade, tipoTaxa, username) {
    try {
        const { Systemrobux } = require("../DataBaseJson");
        
        const robloxData = await getRobloxUserData(username);
        
        if (!robloxData) {
            return interaction.reply({
                content: `${Emojis.get('negative')} Usuário do Roblox \`${username}\` não encontrado! Verifique o nome e tente novamente.`,
                ephemeral: true
            });
        }

        const precoComTaxa = parseFloat(Systemrobux.get('preco_com_taxa'));
        const precoSemTaxa = parseFloat(Systemrobux.get('preco_sem_taxa'));
        const precoUnitario = tipoTaxa === 'com_taxa' ? precoComTaxa : precoSemTaxa;
        const valorTotal = ((quantidade / 1000) * precoUnitario).toFixed(2);
        const quantidadeRecebida = tipoTaxa === 'com_taxa' ? quantidade : Math.floor(quantidade * 0.7);

        const now = new Date();
        const diffTime = Math.abs(now - robloxData.createdDate);
        const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
        const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
        
        let tempoTexto = '';
        if (diffYears > 0) {
            tempoTexto = `Em ${diffYears} ano${diffYears > 1 ? 's' : ''} atrás`;
        } else if (diffMonths > 0) {
            tempoTexto = `Em ${diffMonths} ${diffMonths > 1 ? 'meses' : 'mês'} atrás`;
        } else {
            tempoTexto = 'Recentemente';
        }

        const timestamp = `<t:${Math.floor(robloxData.createdDate.getTime() / 1000)}:R>`;

        const { res } = require("../res");

        const container1Parts = [
            { type: 10, content: `# Pedido - ${quantidade.toLocaleString('pt-BR')}x Robux` },
            { type: 10, content: `**• Informações do pedido:**\n○ Quantidade: \`\`${quantidade.toLocaleString('pt-BR')} Robux\`\`\n○ Taxa: \`\`${tipoTaxa === 'com_taxa' ? 'Sem cobrir a taxa (Nós cobrimos)' : 'Sem cobrir a taxa (Você perde 30%)'}\`\` | Valor a pagar: \`\`R$ ${valorTotal}\`\`\n○ Cupom: ❌ Nenhum` },
            { type: 14 },
            { type: 10, content: `⚠️ Observação: Você terá que criar uma gamepass no valor de **R$ ${valorTotal}** para a administração comprar e você receber os robux em 5-7 Dias Úteis` }
        ];

        const container2Parts = [
            { type: 10, content: `# Confirmar user roblox - @${robloxData.username}` },
            { type: 10, content: `**• Informações do usuário:**\n○ Roblox id: \`\`${robloxData.userId}\`\`\n○ Roblox username: \`\`${robloxData.username}\`\`\n○ Roblox display name: \`\`${robloxData.displayName}\`\`\n○ Conta criada:{${timestamp}` },
            { type: 14 },
            { type: 10, content: `⚠️ Certifique-se de que as informações acima estão corretas antes de prosseguir. Caso não seja você, clique em "Não sou eu" para corrigir.` },
            { type: 14 },
            { type: 12, items: [{ media: { url: robloxData.avatarUrl }, spoiler: false }] },
            {
                type: 1,
                components: [
                    { type: 2, style: 3, custom_id: `robux_prosseguir_${quantidade}_${tipoTaxa}_${robloxData.username}`, label: 'Prosseguir para compra', emoji: { name: '✅' } },
                    { type: 2, style: 4, custom_id: 'robux_nao_sou_eu', label: 'Não sou eu', emoji: { name: '❌' } },
                    { type: 2, style: 5, label: 'Ver perfil', url: `https://www.roblox.com/users/${robloxData.userId}/profile`, emoji: { name: '⚡' } }
                ]
            }
        ];

        const container1 = res.main(...container1Parts).with({ flags: [64] });
        const container2 = res.main(...container2Parts).with({ flags: [64] });

        await interaction.deferUpdate();
        
        await interaction.editReply(container1);
        
        await interaction.followUp(container2);

    } catch (error) {
        console.error('[MostrarConfirmacao] Erro:', error);
        await interaction.reply({
            content: `${Emojis.get('negative')} Erro ao processar sua solicitação. Tente novamente.`,
            ephemeral: true
        });
    }
}

module.exports = {
    CreateCarrinhoRobux,
    MostrarSelecaoTaxa,
    MostrarConfirmacao
};
