const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { carrinhosrobux, configuracao, EmojisHelper, pagamentos } = require("../DataBaseJson");
const axios = require("axios");

const Emojis = EmojisHelper;

async function VerificarPagamentoRobux(interaction, client) {
    if (interaction && interaction.channel) {
        try {
            await interaction.deferUpdate();

            const carrinhoData = await carrinhosrobux.get(interaction.channel.id);
            
            if (!carrinhoData) {
                return interaction.followUp({
                    content: `${Emojis.get('negative')} Erro ao buscar dados do carrinho.`,
                    ephemeral: true
                });
            }

            const contentPagamento = `Selecione a Forma de Pagamento`;

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('robux_pagar_pix')
                    .setLabel('Pix')
                    .setEmoji(Emojis.get('pix_stamp_emoji') || '💳')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('robux_pagar_crypto')
                    .setLabel('Litecoin')
                    .setEmoji('1464139389436297308')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('robux_pagar_card')
                    .setLabel('Cartão de Crédito/Débito')
                    .setEmoji('1384035213641912360')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(configuracao.get('pagamentos.MpSite') == true ? false : true)
            );

            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('robux_voltar_carrinho')
                    .setLabel('Voltar')
                    .setEmoji(Emojis.get('_back_emoji') || '◀️')
                    .setStyle(ButtonStyle.Secondary)
            );

            try {
                const messages = await interaction.channel.messages.fetch({ limit: 10 });
                const embedMessages = messages.filter(msg => 
                    msg.author.id === client.user.id && 
                    msg.embeds.length > 0 &&
                    msg.embeds[0].title?.includes('Confirmar Usuário')
                );
                
                for (const msg of embedMessages.values()) {
                    try {
                        await msg.edit({ 
                            content: contentPagamento,
                            embeds: [],
                            components: [row1, row2, row3] 
                        });
                    } catch (err) {
                        console.error('[Edit Message] Erro:', err);
                    }
                }
            } catch (error) {
                console.error('[Fetch Messages] Erro:', error);
            }

        } catch (error) {
            console.error('[VerificarPagamentoRobux] Erro:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({
                    content: `${Emojis.get('negative')} Erro ao processar pagamento.`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: `${Emojis.get('negative')} Erro ao processar pagamento.`,
                    ephemeral: true
                });
            }
        }
        return;
    }

    if (!client) return;

    const mercadopago = require("mercadopago");
    const fs = require("fs");
    const https = require("https");
    const axios = require("axios");

    const allCarrinhosRobux = carrinhosrobux.fetchAll();
    
    for (const carrinho of allCarrinhosRobux) {
        const carrinhoData = carrinho.data;
        
        const temPagamento = pagamentos.has(carrinho.ID);
        
        if (!temPagamento && carrinhoData.criadoEm) {
            const twentyMinutesLater = carrinhoData.criadoEm + 20 * 60 * 1000;
            
            if (Date.now() > twentyMinutesLater) {
                try {
                    const thread = await client.channels.fetch(carrinho.ID);
                    
                    await thread.send({
                        content: `${Emojis.get('negative')} **Carrinho Encerrado por Inatividade**\n\nSeu carrinho foi fechado automaticamente após 20 minutos sem atividade. Você pode iniciar uma nova compra a qualquer momento.`
                    });
                    
                    setTimeout(async () => {
                        try {
                            await thread.delete();
                        } catch (err) {
                            console.error('[Delete Thread Inatividade] Erro:', err);
                        }
                    }, 5000);
                    
                    carrinhosrobux.delete(carrinho.ID);
                } catch (error) {
                    console.error(`[Verificar Inatividade Robux] Erro ao buscar thread ${carrinho.ID}:`, error);
                    carrinhosrobux.delete(carrinho.ID);
                }
            }
        }
    }

    const allPayments = pagamentos.fetchAll();

    for (const payment of allPayments) {
        const carrinhoData = await carrinhosrobux.get(payment.ID);
        if (!carrinhoData) continue;

        const method = payment.data.pagamentos.method;
        const paymentDate = payment.data.pagamentos.data;
        const txid = payment.data.pagamentos.id;

        let threadChannel;
        try {
            threadChannel = await client.channels.fetch(payment.ID);

            const tenMinutesLater = paymentDate + 10 * 60 * 1000;

            if (Date.now() > tenMinutesLater) {
                await threadChannel.delete();
                pagamentos.delete(payment.ID);
                carrinhosrobux.delete(payment.ID);
                continue;
            }

        } catch (error) {
            console.error(`[Verificar Pagamento Robux] Erro ao buscar thread ${payment.ID}:`, error);
            pagamentos.delete(payment.ID);
            carrinhosrobux.delete(payment.ID);
            continue;
        }

        let pagamentoAprovado = false;

        if (method === 'pix') {
            try {
                const mpAccessToken = configuracao.get('pagamentos.MpAPI');
                mercadopago.configurations.setAccessToken(mpAccessToken);

                const paymentInfo = await mercadopago.payment.get(txid);
                
                if (paymentInfo.body.status === 'approved') {
                    pagamentoAprovado = true;
                }
            } catch (error) {
                console.error(`[Verificar MP Robux] Erro:`, error);
            }
        } else if (method === 'efibank') {
            try {
                let certificado = fs.readFileSync(`./Lib/${configuracao.get("pagamentos.certificado")}.p12`);

                const httpsAgent = new https.Agent({
                    pfx: certificado,
                    passphrase: "",
                });

                var data = JSON.stringify({ grant_type: "client_credentials" });
                var data_credentials = configuracao.get(`pagamentos.secret_id`) + ":" + configuracao.get(`pagamentos.secret_token`);
                var auth = Buffer.from(data_credentials).toString("base64");

                var config = {
                    method: "POST",
                    url: "https://pix.api.efipay.com.br/oauth/token",
                    headers: {
                        Authorization: "Basic " + auth,
                        "Content-Type": "application/json",
                    },
                    httpsAgent: httpsAgent,
                    data: data,
                };

                let access_token = await axios(config).then(function (response) {
                    return response.data.access_token;
                });

                var config2 = {
                    method: "get",
                    url: `https://pix.api.efipay.com.br/v2/cob/${txid}`,
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json"
                    },
                    httpsAgent: httpsAgent,
                };

                let response = await axios(config2).then(function (response) {
                    return response.data;
                });

                if (response.status === 'CONCLUIDA') {
                    pagamentoAprovado = true;
                }
            } catch (error) {
                console.error(`[Verificar Efi Robux] Erro:`, error);
            }
        } else if (method === 'misticpay') {
            try {
                const clientId = configuracao.get('pagamentos.mistclientid');
                const clientSecret = configuracao.get('pagamentos.misticsecret');

                const response = await axios.get(`https://api.misticpay.com/api/transactions/${txid}`, {
                    headers: {
                        'ci': clientId,
                        'cs': clientSecret
                    }
                });

                if (response.data.data.status === 'approved') {
                    pagamentoAprovado = true;
                }
            } catch (error) {
                console.error(`[Verificar Mistic Robux] Erro:`, error);
            }
        }

        if (pagamentoAprovado) {
            pagamentos.delete(payment.ID);
            await AprovarPagamentoRobux(client, payment.ID);
        }
    }
}

module.exports = { VerificarPagamentoRobux };

async function verificarGamepass(userId, valorGamepass) {
    try {
        let allGamepasses = [];
        const minimoGamepass = 0;
        const limiteGamepass = 1000000;

        const gamesResponse = await axios.get(`https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`);
        const gamesData = gamesResponse.data;

        if (!gamesData.data || gamesData.data.length === 0) {
            return { encontrada: false };
        }

        for (const game of gamesData.data) {
            const placeId = game.rootPlace?.id;
            if (!placeId) {
                continue;
            }

            try {
                const universeResponse = await axios.get(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
                const universeData = universeResponse.data;
                const universeId = universeData.universeId;

                if (!universeId) {
                    continue;
                }

                const gamepassUrl = `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full`;
                const gamepassResponse = await axios.get(gamepassUrl);
                const gamepassData = gamepassResponse.data;

                const gamepasses = gamepassData.gamePasses || gamepassData.data || [];

                if (gamepasses.length > 0) {
                    for (const gp of gamepasses) {
                        const price = gp.price;

                        if (gp.isForSale && price !== null && price !== undefined && price >= minimoGamepass && price <= limiteGamepass) {
                            allGamepasses.push({
                                id: gp.id,
                                name: gp.name,
                                price: price,
                                gameId: universeId,
                                gameName: game.name,
                                iconUrl: gp.iconImageAssetId ? `https://www.roblox.com/asset-thumbnail/image?assetId=${gp.iconImageAssetId}&width=150&height=150&format=png` : null
                            });
                        }
                    }
                }
            } catch (e) {
                console.error(`[Verificar Gamepass] Erro ao buscar gamepasses do jogo ${game.name}:`, e.message);
            }
        }

        const gamepassEncontrada = allGamepasses.find(gp => gp.price === valorGamepass);

        if (gamepassEncontrada) {
            return {
                encontrada: true,
                gamepassId: gamepassEncontrada.id,
                gamepassName: gamepassEncontrada.name,
                gamepassUrl: `https://www.roblox.com/game-pass/${gamepassEncontrada.id}`,
                gamepassIcon: gamepassEncontrada.iconUrl
            };
        }

        return { encontrada: false };
    } catch (error) {
        console.error('[Verificar Gamepass] Erro:', error.message);
        return { encontrada: false, erro: error.message };
    }
}

async function AprovarPagamentoRobux(client, threadId) {
    try {
        const carrinhoData = await carrinhosrobux.get(threadId);
        
        if (!carrinhoData) {
            console.error('[Aprovar Pagamento Robux] Carrinho não encontrado:', threadId);
            return;
        }

        const thread = await client.channels.fetch(threadId);
        
        if (!thread) {
            console.error('[Aprovar Pagamento Robux] Thread não encontrada:', threadId);
            return;
        }

        try {
            const messages = await thread.messages.fetch({ limit: 10 });
            const botMessages = messages.filter(msg => msg.author.id === client.user.id);
            
            for (const msg of botMessages.values()) {
                try {
                    await msg.delete();
                } catch (err) {
                    console.error('[Delete Message] Erro:', err);
                }
            }
        } catch (error) {
            console.error('[Fetch Messages] Erro:', error);
        }

        const valorGamepass = carrinhoData.tipoTaxa === 'com_taxa' ? Math.ceil(carrinhoData.quantidade * 1.3) : carrinhoData.quantidade;

        const resultadoGamepass = await verificarGamepass(carrinhoData.robloxUserId, valorGamepass);

        if (!resultadoGamepass.encontrada) {
            const { res } = require("../res");
            
            const tutorialContent = res.main(
                { type: 10, content: `-# Pagamento Aprovado > Verificação de Gamepass` },
                { type: 14 },
                { type: 10, content: `## ${Emojis.get('info')} Gamepass Não Encontrada\n\n> Não encontramos uma gamepass no valor de **${valorGamepass.toLocaleString('pt-BR')} Robux** em sua conta.` },
                { type: 14 },
                { type: 10, content: `**Como criar uma Gamepass:**\n\n1. Acesse o Roblox Studio e abra qualquer jogo seu\n2. Vá em "View" → "Toolbox"\n3. Na Toolbox, clique em "Marketplace"\n4. Clique em "Create" → "Passes"\n5. Defina o nome e descrição da gamepass\n6. **IMPORTANTE:** Defina o preço como **${valorGamepass.toLocaleString('pt-BR')} Robux**\n7. Clique em "Create Pass"\n\nApós criar a gamepass, clique no botão abaixo para confirmar.` }
            ).with({
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('robux_confirmar_gamepass')
                            .setLabel('Confirmar Criação')
                            .setEmoji(Emojis.get('checker') || '✅')
                            .setStyle(ButtonStyle.Success)
                    )
                ]
            });

            await thread.send(tutorialContent);
            
        } else {
            await MostrarPaginaAprovado(thread, carrinhoData, resultadoGamepass);
        }

    } catch (error) {
        console.error('[Aprovar Pagamento Robux] Erro:', error);
    }
}

async function MostrarPaginaAprovado(thread, carrinhoData, gamepassData) {
    const { res } = require("../res");
    
    const timestampCompra = Math.floor(Date.now() / 1000);
    
    const contentAprovado = res.main(
        { type: 10, content: `-# Pagamento Aprovado > Aguardando Entrega` },
        { type: 14 },
        { type: 10, content: `## ${Emojis.get('checker')} Pagamento Aprovado!\n\n> Obrigado por Comprar Conosco! Nossos staff já foram marcados e seus **${carrinhoData.quantidade.toLocaleString('pt-BR')} Robux** serão entregues em breve.` },
        { type: 14 },
        { type: 10, content: `**Detalhes do Carrinho**\n- User Roblox: **${carrinhoData.username}** (ID: ${carrinhoData.robloxUserId})\n- Total de Robux Comprados: **${carrinhoData.quantidade.toLocaleString('pt-BR')}**\n- Status Gamepass: \`\`🟢 Encontrada\`\`\n- Data da Compra: <t:${timestampCompra}:R>` }
    ).with({
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('robux_confirmar_entrega')
                    .setLabel('Confirmar Entrega')
                    .setEmoji(Emojis.get('checker') || '✅')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setLabel('Link da Gamepass')
                    .setURL(gamepassData.gamepassUrl)
                    .setStyle(ButtonStyle.Link)
            )
        ]
    });

    try {
        const usernameDiscord = carrinhoData.user?.username || 'Usuario';
        await thread.setName(`✅・${usernameDiscord} - Aprovado`);
    } catch (error) {
        console.error('[Renomear Thread] Erro:', error);
    }

    const cargoAdmin = configuracao.get('ConfigRoles.admrole');
    
    if (cargoAdmin) {
        await thread.send({ content: `<@&${cargoAdmin}>` });
    }
    
    await thread.send(contentAprovado);

    await carrinhosrobux.set(`${thread.id}.gamepass`, gamepassData);
    await carrinhosrobux.set(`${thread.id}.status`, 'aguardando_entrega');
    await carrinhosrobux.set(`${thread.id}.timestampCompra`, timestampCompra);
}

module.exports = { 
    VerificarPagamentoRobux, 
    AprovarPagamentoRobux,
    verificarGamepass,
    MostrarPaginaAprovado
};
