const { carrinhosrobux, EmojisHelper } = require("../DataBaseJson");
const axios = require("axios");

const Emojis = EmojisHelper;

async function getRobloxUserData(username) {
    try {
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

        let avatarUrl = 'https://tr.rbxcdn.com/38c6edcb50633730ff4cf39ac8859840/150/150/AvatarHeadshot/Png';
        try {
            const avatarResponse = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
            if (avatarResponse.data.data && avatarResponse.data.data[0] && avatarResponse.data.data[0].imageUrl) {
                avatarUrl = avatarResponse.data.data[0].imageUrl;
            }
        } catch (avatarError) {
            console.error('[getRobloxUserData] Erro ao buscar avatar:', avatarError.message);
        }

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

async function DentroCarrinhoRobux(thread, guild, quantidade, tipoTaxa, username, precoUnitario, valorTotal) {
    try {
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
        
        const robloxData = await getRobloxUserData(username);
        
        if (!robloxData) {
            await thread.send({
                content: `${Emojis.get('negative')} **Erro:** A conta do Roblox \`${username}\` não foi encontrada!\n\nPor favor, verifique o nome de usuário e tente novamente.`
            });
            return false;
        }

        const quantidadeRecebida = tipoTaxa === 'com_taxa' ? quantidade : Math.floor(quantidade * 0.7);
        const valorGamepass = tipoTaxa === 'com_taxa' ? Math.ceil(quantidade * 1.3) : quantidade;

        await carrinhosrobux.set(thread.id, {
            user: thread.guild.members.cache.find(m => thread.name.includes(m.id))?.user,
            guild: guild,
            threadid: thread.id,
            tipo: 'robux',
            tipoTaxa: tipoTaxa,
            username: robloxData.username,
            quantidade: quantidade,
            quantidadeRecebida: quantidadeRecebida,
            precoUnitario: precoUnitario,
            valorTotal: valorTotal,
            robloxUserId: robloxData.userId,
            robloxDisplayName: robloxData.displayName,
            robloxAvatarUrl: robloxData.avatarUrl,
            criadoEm: Date.now()
        });

        const timestamp = `<t:${Math.floor(robloxData.createdDate.getTime() / 1000)}:R>`;

        const embed1 = new EmbedBuilder()
            .setColor('#7805a5')
            .setTitle(`Resumo Pedido Robux`)
            .addFields({
                name: `${Emojis.get('pedidoroblox')} Informaçoes do Pedido`,
                value: `-# - Quantidade: \`\`${quantidade.toLocaleString('pt-BR')} Robux\`\`\n-# - Valor Total: \`\`R$ ${valorTotal}\`\`\n-# - Taxa: \`\`${tipoTaxa === 'com_taxa' ? 'Cobrimos a taxa (100%)' : 'Sem cobrir (70%)'}\`\`\n-# - Cupom: \`\`Nenhum aplicado\`\``,
                inline: false
            })
            .addFields({
                name: `${Emojis.get('info')} **Atençao**`,
                value: `-# Você terá que criar uma **gamepass** no valor de **${valorGamepass.toLocaleString('pt-BR')} Robux** para a administração comprar e você receber os robux em **5-7 Dias Úteis**`,
                inline: false
            });

        const embed2 = new EmbedBuilder()
            .setColor('#7805a5')
            .setTitle(`Confirmar Usuário - @${robloxData.username}`)
            .setDescription(`-# ${Emojis.get('info')} Certifique-se de que as informações abaixo estão corretas antes de prosseguir.`)
            .addFields({
                name: `${Emojis.get('contaroblox')} Informaçoes da Conta`,
                value: `-# - Roblox ID: \`\`${robloxData.userId}\`\`\n-# - Username: \`\`${robloxData.username}\`\`\n-# - Display Name: \`\`${robloxData.displayName}\`\`\n-# - Conta Criada: ${timestamp}`,
                inline: false
            })
            .setThumbnail(robloxData.avatarUrl)
            .setFooter({ text: 'Caso não seja você, clique em "Não sou eu" para corrigir' });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`robux_prosseguir_${quantidade}_${tipoTaxa}_${robloxData.username}`)
                .setLabel('Prosseguir compra')
                .setEmoji(Emojis.get('_cart_emoji') || '✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('robux_nao_sou_eu')
                .setLabel('Não sou eu')
                .setEmoji(Emojis.get('negative') || '❌')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setLabel('Ver perfil')
                .setURL(`https://www.roblox.com/users/${robloxData.userId}/profile`)
                .setStyle(ButtonStyle.Link)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('robux_cancelar_carrinho')
                .setLabel('Cancelar Carrinho')
                .setEmoji(Emojis.get('_trash_emoji') || '🗑️')
                .setStyle(ButtonStyle.Danger)
        );

        await thread.send({ embeds: [embed1] });
        await thread.send({ embeds: [embed2], components: [row1, row2] });

        return true;

    } catch (error) {
        console.error('[DentroCarrinhoRobux] Erro:', error);
        return false;
    }
}


function calcularValorTotalCarrinhoRobux(carrinhoData) {
    return parseFloat(carrinhoData.valorTotal);
}

async function DentroCarrinhoRobuxPix(interaction, client) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require("discord.js");
    const { configuracao, pagamentos } = require("../DataBaseJson");
    const mercadopago = require("mercadopago");
    
    interaction.deferUpdate();

    await interaction.message.edit({ 
        content: `${Emojis.get('loading')} | Gerando Pagamento...`, 
        ephemeral: true, 
        components: [] 
    }).then(async tt => {

        const carrinhoData = await carrinhosrobux.get(interaction.channel.id);
        
        if (!carrinhoData) {
            return interaction.followUp({
                content: `${Emojis.get('negative')} Erro ao buscar dados do carrinho.`,
                ephemeral: true
            });
        }

        const valor = calcularValorTotalCarrinhoRobux(carrinhoData);
        const aaaa = Number(valor).toFixed(2);

        var agora = new Date();
        agora.setMinutes(agora.getMinutes() + 10);
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset() + 240);
        agora.setHours(agora.getHours() - 5);
        var novaDataFormatada = agora.toISOString().replace('Z', '-04:00');

        var payment_data = {
            transaction_amount: Number(aaaa),
            description: `Pagamento Robux - ${interaction.user.username}`,
            date_of_expiration: `${novaDataFormatada}`,
            payment_method_id: 'pix',
            payer: {
                email: `${interaction.user.id}@discord-user.com`,
                first_name: `Victor André`,
                last_name: `Ricardo Almeida`,
                identification: {
                    type: 'CPF',
                    number: '15084299872'
                },
                address: {
                    zip_code: '86063190',
                    street_name: 'Rua Jácomo Piccinin',
                    street_number: '971',
                    neighborhood: 'Pinheiros',
                    city: 'Londrina',
                    federal_unit: 'PR'
                }
            }
        };

        const mpAccessToken = configuracao.get('pagamentos.MpAPI');
        mercadopago.configurations.setAccessToken(mpAccessToken);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT_MP_FATAL: A requisição excedeu 20 segundos.')), 20000)
        );

        try {
            const data = await Promise.race([
                mercadopago.payment.create(payment_data),
                timeoutPromise
            ]);

            const txid = data.body.id;
            const pix_copia_cola = data.body.point_of_interaction.transaction_data.qr_code;

            const { qrGenerator } = require('../Lib/QRCodeLib');
            const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' });
            const qrcode = await qr.generate(pix_copia_cola);

            let attachment = null;
            if (qrcode.status === 'success' && qrcode.response) {
                try {
                    const buffer = Buffer.from(qrcode.response, "base64");
                    attachment = new AttachmentBuilder(buffer, { name: "payment.png" });
                } catch (err) {
                    console.error('[MP PIX ROBUX] Erro ao criar attachment:', err);
                }
            }

            const embed = new EmbedBuilder()
                .setColor(configuracao.get('Cores.Principal') || '2b2d31')
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`${Emojis.get('pix_stamp_emoji')} Pagamento via PIX criado`)
                .addFields(
                    { name: `${Emojis.get('time_emoji')} Expira em:`, value: `<t:${Math.floor(Date.now() / 1000) + 600}:R>` },
                    { name: `${Emojis.get('information_emoji')} Código copia e cola`, value: `\`\`\`${pix_copia_cola}\`\`\`` }
                )
                .setFooter({ text: `${interaction.guild.name} - Pagamento expira em 10 minutos.` })
                .setTimestamp()
                .setImage(`attachment://payment.png`);

            const row3 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("codigocopiaecola")
                        .setLabel('Código copia e cola')
                        .setEmoji(Emojis.get('codigocopia'))
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId("deletchannel")
                        .setLabel('Cancelar')
                        .setStyle(4)
                );

            carrinhosrobux.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: 'pix' });
            pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: 'pix', data: Date.now() });

            await tt.edit({ embeds: [embed], files: attachment ? [attachment] : [], content: ``, components: [row3] });

            const valorFormatado = Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const mandanopvdocara = new EmbedBuilder()
                .setColor(configuracao.get('Cores.Processamento') || '#fcba03')
                .setTitle(`Pedido solicitado`)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setDescription(`${Emojis.get('completedcart_emoji')} Seu pedido foi criado e agora está aguardando a confirmação do pagamento`)
                .addFields(
                    { name: `Detalhes`, value: `\`${carrinhoData.quantidade}x - Robux | R$ ${valorFormatado}\`` },
                    { name: `ID do Pedido`, value: `\`${txid}\`` },
                    { name: `Forma de Pagamento`, value: `\`Pix - Mercado Pago\`` }
                );

            try {
                await interaction.user.send({ embeds: [mandanopvdocara] });
            } catch (error) {
                console.error(`[PIX MP ROBUX] - ERRO ao enviar DM:`, error);
            }

            const dsfjmsdfjnsdfj = new EmbedBuilder()
                .setColor(configuracao.get("Cores.Processamento") || "#fcba03")
                .setAuthor({ name: `Pedido Solicitado` })
                .setTitle("Pedido solicitado")
                .setDescription(`${Emojis.get('completedcart_emoji')} Usuário ${interaction.user} solicitou um pedido`)
                .addFields(
                    { name: `Detalhes`, value: `\`${carrinhoData.quantidade}x - Robux | R$ ${valorFormatado}\`` },
                    { name: "**ID do Pedido**", value: `\`${txid}\`` },
                    { name: "**Forma de pagamento**", value: "Pix - Mercado Pago" }
                )
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            try {
                const logChannelId = configuracao.get(`ConfigChannels.logpedidos`);
                const channela = await interaction.client.channels.fetch(logChannelId);

                if (channela) {
                    await channela.send({ embeds: [dsfjmsdfjnsdfj] }).then(yyyyy => {
                        carrinhosrobux.set(`${interaction.channel.id}.replys`, { channelid: yyyyy.channel.id, idmsg: yyyyy.id });
                    });
                }
            } catch (error) {
                console.error("[PIX MP ROBUX] - ERRO ao enviar log:", error);
            }

        } catch (error) {
            let errorMessage = 'A requisição falhou ou expirou. Verifique o Access Token.';

            if (error.message === 'TIMEOUT_MP_FATAL: A requisição excedeu 20 segundos.') {
                errorMessage = 'ERRO DE TEMPO LIMITE (20s)! O SDK do MP não conseguiu se comunicar.';
            } else if (error.response?.data) {
                errorMessage = `ERRO MP: ${error.response.data.message || 'Erro de validação.'}`;
            }

            console.error(`[PIX MP ROBUX] - FALHA:`, errorMessage);

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("robux_pagar_pix")
                        .setLabel('Pix')
                        .setEmoji(Emojis.get('pix_stamp_emoji'))
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId("robux_pagar_crypto")
                        .setLabel('Litecoin')
                        .setStyle(1)
                        .setEmoji('1464139389436297308')
                        .setDisabled(true)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("robux_pagar_card")
                        .setLabel('Cartão de Crédito/Débito')
                        .setEmoji('1384035213641912360')
                        .setStyle(2)
                        .setDisabled(configuracao.get('pagamentos.MpSite') == true ? false : true)
                );

            const row3 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("robux_voltar_carrinho")
                        .setLabel('Voltar')
                        .setEmoji(Emojis.get('_back_emoji'))
                        .setStyle(2)
                );

            await tt.edit({ content: `Selecione uma forma de pagamento.`, ephemeral: true, components: [row1, row2, row3] });
            interaction.followUp({ content: `${Emojis.get('negative')} | Ocorreu um erro ao criar o pagamento. ${errorMessage}`, ephemeral: true });
        }
    });
}

async function DentroCarrinhoRobuxEfiBank(client, interaction) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require("discord.js");
    const { configuracao, pagamentos } = require("../DataBaseJson");
    const fs = require("fs");
    const https = require("https");
    const axios = require("axios");

    await interaction.update({ content: `${Emojis.get('loading')} Aguarde...`, ephemeral: true, components: [], embeds: [] });

    try {
        interaction.editReply({ content: `${Emojis.get('loading')} Criando seu pagamento...`, ephemeral: true, components: [], embeds: [] });
        
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
        }).catch(function (error) {
            console.log(`Erro Efi: ${error}`);
        });

        const carrinhoData = await carrinhosrobux.get(interaction.channel.id);
        
        if (!carrinhoData) {
            return interaction.followUp({
                content: `${Emojis.get('negative')} Erro ao buscar dados do carrinho.`,
                ephemeral: true
            });
        }

        const valor = calcularValorTotalCarrinhoRobux(carrinhoData);

        interaction.editReply({ content: `${Emojis.get('loading')} Espere só mais um pouco...`, ephemeral: true, components: [], embeds: [] });

        var data = JSON.stringify({
            "calendario": {
                "expiracao": 10 * 60
            },
            "devedor": {
                "cpf": "12345678909",
                "nome": `${interaction.user.username}`,
            },
            "valor": {
                "original": `${valor.toFixed(2)}`,
            },
            "chave": `${configuracao.get(`pagamentos.chavepix`)}`,
            "solicitacaoPagador": "Cobrança dos serviços prestados."
        });

        var config = {
            method: "post",
            url: "https://pix.api.efipay.com.br/v2/cob",
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json"
            },
            httpsAgent: httpsAgent,
            data: data,
        };

        let response = await axios(config).then(function (response) {
            return response.data;
        }).catch(function (error) {
            console.log(error.response.data);
        });

        const { qrGenerator } = require('../Lib/QRCodeLib');
        const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' });
        const qrcode = await qr.generate(response.pixCopiaECola);

        let attachment = null;
        if (qrcode.status === 'success' && qrcode.response) {
            try {
                const buffer = Buffer.from(qrcode.response, "base64");
                attachment = new AttachmentBuilder(buffer, { name: "payment.png" });
            } catch (err) {
                console.error('[EFIBANK QRCODE ROBUX] Erro ao criar attachment:', err);
            }
        }

        const embed = new EmbedBuilder()
            .setColor(configuracao.get(`QRCode.principal`) || `#328dbc`)
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTitle(`${Emojis.get('pix_stamp_emoji')} Pagamento via PIX criado`)
            .addFields(
                { name: `${Emojis.get('time_emoji')} Expira em:`, value: `<t:${Math.floor(Date.now() / 1000) + 600}:R>` },
                { name: `${Emojis.get('information_emoji')} Código Copia e Cola:`, value: `\`\`\`${response.pixCopiaECola}\`\`\`` }
            )
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("codigocopiaecola")
                    .setLabel('Código copia e cola')
                    .setEmoji(Emojis.get('codigocopia'))
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId("deletchannel")
                    .setLabel('Cancelar')
                    .setStyle(4)
            );

        if (attachment) {
            if (configuracao.get(`pagamentos.QRCode`) == `miniatura`) {
                embed.setDescription(`-# \`⌚\` Caso prefira pagar com Qrcode utilize o Qrcode abaixo.`);
                embed.setThumbnail(`attachment://payment.png`);
            } else {
                embed.setImage('attachment://payment.png');
            }
        }

        carrinhosrobux.set(`${interaction.channel.id}.pagamentos`, { id: response.txid, cp: response.pixCopiaECola, method: 'efibank' });
        pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: response.txid, cp: response.pixCopiaECola, method: 'efibank', data: Date.now() });

        await interaction.editReply({ embeds: [embed], files: attachment ? [attachment] : [], content: ``, components: [row3] });

        interaction.channel.setName(`💱・${interaction.user.username}・${interaction.user.id}`);

        const valorFormatado = Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const mandanopvdocara = new EmbedBuilder()
            .setColor(configuracao.get('Cores.Processamento') || '#fcba03')
            .setTitle(`Pedido solicitado`)
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp()
            .setDescription(`Seu pedido foi criado e agora está aguardando a confirmação do pagamento`)
            .addFields(
                { name: `Detalhes`, value: `\`${carrinhoData.quantidade}x - Robux | R$ ${valorFormatado}\`` },
                { name: `ID do Pedido`, value: `\`${response.txid}\`` },
                { name: `Forma de Pagamento`, value: `\`Pix - Efi Bank\`` }
            );

        try {
            await interaction.user.send({ embeds: [mandanopvdocara] });
        } catch (error) {
            console.error('[EFI ROBUX] Erro ao enviar DM:', error);
        }

        const dsfjmsdfjnsdfj = new EmbedBuilder()
            .setColor(configuracao.get('Cores.Processamento') || '#fcba03')
            .setTitle(`Pedido solicitado`)
            .setDescription(`Usuário ${interaction.user} solicitou um pedido.`)
            .addFields(
                { name: `Detalhes`, value: `\`${carrinhoData.quantidade}x - Robux | R$ ${valorFormatado}\`` },
                { name: `ID do Pedido`, value: `\`${response.txid}\`` },
                { name: `Forma de pagamento`, value: `\`Pix - Efi Bank\`` }
            )
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        try {
            const channela = await client.channels.fetch(configuracao.get(`ConfigChannels.logpedidos`));
            await channela.send({ embeds: [dsfjmsdfjnsdfj] }).then(yyyyy => {
                carrinhosrobux.set(`${interaction.channel.id}.replys`, { channelid: yyyyy.channel.id, idmsg: yyyyy.id });
            });
        } catch (error) {
            console.error('[EFI ROBUX] Erro ao enviar log:', error);
        }
    } catch (error) {
        console.log(error);
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("robux_pagar_pix")
                .setLabel('Pix')
                .setEmoji(Emojis.get('pix_stamp_emoji'))
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId("robux_pagar_crypto")
                .setLabel('Litecoin')
                .setEmoji('1464139389436297308')
                .setStyle(2)
                .setDisabled(true)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("robux_pagar_card")
                .setLabel(`Cartão de Crédito/Débito`)
                .setEmoji('1384035213641912360')
                .setStyle(2)
                .setDisabled(configuracao.get('pagamentos.MpSite') == true ? false : true)
        );

        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("robux_voltar_carrinho")
                .setLabel('Voltar')
                .setEmoji(Emojis.get('_back_emoji'))
                .setStyle(2)
        );

        interaction.editReply({ content: `Selecione uma forma de pagamento.`, ephemeral: true, components: [row1, row2, row3] });
        interaction.followUp({ content: `Ocorreu um erro ao criar o pagamento, tente novamente.\nError: ${error}`, ephemeral: true });
    }
}

async function DentroCarrinhoRobuxMisticPay(interaction, client) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require("discord.js");
    const { configuracao, pagamentos } = require("../DataBaseJson");
    const axios = require("axios");

    await interaction.deferUpdate();

    await interaction.message.edit({ 
        content: `${Emojis.get('loading')} | Gerando Pagamento via Pix...`, 
        ephemeral: true, 
        components: [] 
    }).then(async tt => {

        try {
            const carrinhoData = await carrinhosrobux.get(interaction.channel.id);
            
            if (!carrinhoData) {
                return interaction.followUp({
                    content: `${Emojis.get('negative')} Erro ao buscar dados do carrinho.`,
                    ephemeral: true
                });
            }

            const valor = calcularValorTotalCarrinhoRobux(carrinhoData);
            const aaaa = Number(valor).toFixed(2);
            
            const clientId = configuracao.get('pagamentos.mistclientid');
            const clientSecret = configuracao.get('pagamentos.misticsecret');

            const response = await axios.post('https://api.misticpay.com/api/transactions/create', {
                amount: Number(aaaa),
                payerName: interaction.user.username,
                payerDocument: '15084299872',
                transactionId: `ID_${Date.now()}_${interaction.user.id}`,
                description: `Pagamento Robux: ${carrinhoData.quantidade}`
            }, {
                headers: { 
                    'ci': clientId,
                    'cs': clientSecret,
                    'Content-Type': 'application/json'
                }
            });

            const misticData = response.data.data;
            
            const pix_copia_cola = misticData.copyPaste;
            const txid = misticData.transactionId;
            const qrCodeBase64 = misticData.qrCodeBase64;

            if (!pix_copia_cola) throw new Error("A API não retornou o campo 'copyPaste'.");

            let attachment = null;
            try {
                if (qrCodeBase64) {
                    const base64Data = qrCodeBase64.replace(/^data:image\/png;base64,/, "");
                    const buffer = Buffer.from(base64Data, "base64");
                    attachment = new AttachmentBuilder(buffer, { name: "payment.png" });
                }
            } catch (imgError) {
                console.log('[MISTIC PAY ROBUX] Erro ao processar imagem');
            }

            const embed = new EmbedBuilder()
                .setColor(configuracao.get('Cores.Principal') || '2b2d31')
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`${Emojis.get('pix_stamp_emoji')} Pagamento via PIX criado`)
                .addFields(
                    { name: `${Emojis.get('time_emoji')} Expira em:`, value: `<t:${Math.floor(Date.now() / 1000) + 600}:R>` },
                    { name: `${Emojis.get('information_emoji')} Código copia e cola`, value: `\`\`\`${pix_copia_cola}\`\`\`` }
                )
                .setFooter({ text: `${interaction.guild.name} - Pagamento expira em 10 minutos.` })
                .setTimestamp();

            if (attachment) {
                embed.setImage(`attachment://payment.png`);
            }

            const rowSucesso = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("codigocopiaecola").setLabel('Código copia e cola').setEmoji(Emojis.get('codigocopia')).setStyle(2),
                new ButtonBuilder().setCustomId("deletchannel").setLabel('Cancelar').setStyle(4)
            );

            carrinhosrobux.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: 'misticpay' });
            pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: 'misticpay', data: Date.now() });

            const editOptions = { embeds: [embed], content: ``, components: [rowSucesso] };
            if (attachment) {
                editOptions.files = [attachment];
            }
            await tt.edit(editOptions);

        } catch (error) {
            console.error("[MISTIC PAY ROBUX] Erro:", error.response?.data || error.message);
            
            const rowErro = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("robux_pagar_pix").setLabel('Tentar novamente').setStyle(2).setEmoji(Emojis.get('pix_stamp_emoji')),
                new ButtonBuilder().setCustomId("robux_voltar_carrinho").setLabel('Voltar').setStyle(2).setEmoji(Emojis.get('_back_emoji'))
            );

            await tt.edit({ 
                content: `❌ Erro ao gerar o Pix na Mistic Pay.\nMotivo: \`${error.response?.data?.message || error.message}\``, 
                components: [rowErro] 
            });
        }
    });
}

async function DentroCarrinhoRobuxImap(interaction, client) {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, AttachmentBuilder } = require("discord.js");
    const { configuracao, pagamentos } = require("../DataBaseJson");
    const axios = require("axios");
    
    const customIdModal = `modal_imap_robux_${interaction.user.id}`;
    const modal = new ModalBuilder()
        .setCustomId(customIdModal)
        .setTitle('Identificação do Pagador')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('nome_completo')
                    .setLabel('NOME DO TITULAR (IGUAL AO BANCO)')
                    .setPlaceholder('Ex: Victor André Ricardo Almeida')
                    .setStyle(1).setRequired(true)
            )
        );

    await interaction.showModal(modal);

    const filter = (i) => i.customId === customIdModal;
    
    interaction.awaitModalSubmit({ filter, time: 60000 }).then(async (submitted) => {
        await submitted.deferUpdate();

        const nomePagador = submitted.fields.getTextInputValue('nome_completo');

        const tt = await interaction.message.edit({ 
            content: `${Emojis.get('loading')} | Gerando Pagamento via Pix.`, 
            embeds: [], components: [], files: [] 
        });

        try {
            const carrinhoData = await carrinhosrobux.get(interaction.channel.id);
            
            if (!carrinhoData) {
                return submitted.followUp({
                    content: `${Emojis.get('negative')} Erro ao buscar dados do carrinho.`,
                    ephemeral: true
                });
            }

            const valor = calcularValorTotalCarrinhoRobux(carrinhoData);

            const imapConfig = configuracao.get('pagamentos.imap');
            const { QrCodePix } = require('qrcode-pix');

            const valor2 = Number(valor.toFixed(2));
            const qrCodePix = QrCodePix({
                version: '01',
                key: imapConfig.pix,
                name: nomePagador,
                city: 'BRASILIA',
                cep: '28360000',
                value: valor2,
            });

            const chavealeatorio = qrCodePix.payload();

            const { qrGenerator } = require('../Lib/QRCodeLib.js');
            const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' });
            const qrcode = await qr.generate(chavealeatorio);
            
            let attachment = null;
            if (qrcode.status === 'success' && qrcode.response) {
                attachment = new AttachmentBuilder(Buffer.from(qrcode.response, "base64"), { name: "payment.png" });
            }

            const embed = new EmbedBuilder()
                .setColor(configuracao.get('Cores.Principal') || '#2b2d31')
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`-# ${Emojis.get('geradosucesso')} **Ambiente Seguro**\n-# Seu pagamento será processado em um ambiente 100% seguro e protegido.\n\n-# ${Emojis.get('info')} **Pagamento Automático**\n-# Assim que o pagamento for confirmado, você receberá seu produto automaticamente!`)
                .setTitle(`${Emojis.get('pix_stamp_emoji')} Pagamento via PIX criado`)
                .addFields(
                    { name: `${Emojis.get('brand_emoji')} Valor da Compra`, value: `\`R$ ${Number(valor).toFixed(2)}\``, inline: true }
                )
                .setFooter({ text: `${interaction.guild.name} - Pagamento expira em 10 minutos.` })
                .setTimestamp();

            if (attachment) {
                embed.setImage('attachment://payment.png');
            }

            const row3 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("codigocopiaecola")
                        .setLabel('Código copia e cola')
                        .setEmoji('1192868868784394381')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId("deletchannel")
                        .setLabel('Deletar')
                        .setEmoji(Emojis.get('_trash_emoji'))
                        .setStyle(4)
                );

            const editOptions = { content: ``, embeds: [embed], components: [row3] };
            if (attachment) {
                editOptions.files = [attachment];
            }
            await tt.edit(editOptions);

            carrinhosrobux.set(`${interaction.channel.id}.pagamentos`, { id: chavealeatorio, cp: chavealeatorio, method: 'imap', nomePagador: nomePagador });
            pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: chavealeatorio, cp: chavealeatorio, method: 'imap', data: Date.now(), nomePagador: nomePagador });

            interaction.channel.setName(`💱・${interaction.user.username}・${interaction.user.id}`);

        } catch (error) {
            console.error('[IMAP ROBUX] Erro:', error);
            
            const rowErro = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("robux_pagar_pix").setLabel('Tentar novamente').setStyle(2).setEmoji(Emojis.get('pix_stamp_emoji')),
                new ButtonBuilder().setCustomId("robux_voltar_carrinho").setLabel('Voltar').setStyle(2).setEmoji(Emojis.get('_back_emoji'))
            );

            await tt.edit({ 
                content: `❌ Erro ao gerar o Pix.\nMotivo: \`${error.message}\``, 
                components: [rowErro] 
            });
        }
    }).catch(error => {
        console.error('[IMAP ROBUX] Modal timeout:', error);
    });
}

module.exports = {
    DentroCarrinhoRobux,
    DentroCarrinhoRobuxPix,
    DentroCarrinhoRobuxEfiBank,
    DentroCarrinhoRobuxMisticPay,
    DentroCarrinhoRobuxImap
};
