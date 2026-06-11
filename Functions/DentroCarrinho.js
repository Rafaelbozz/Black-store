
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder,InteractionType, ButtonStyle } = require("discord.js")
const { produtos, carrinhos, pagamentos, configuracao } = require("../DataBaseJson")
const { QuickDB } = require("quick.db");
const mercadopago = require("mercadopago");
const db = new QuickDB();
const fs = require("fs");
const https = require("https");
const axios = require("axios")
const emojis = require("../DataBaseJson/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

function crc16(data) {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
            else crc <<= 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

async function DentroCarrinhoPix(interaction, client) {
    interaction.deferUpdate();

    const Entrega24 = configuracao.get(`Emojis_carrinho`);
    let msg = ``;

    if (Entrega24 !== null) {
        Entrega24.sort((a, b) => {
            const numA = parseInt(a.name.replace('ea', ''), 10);
            const numB = parseInt(b.name.replace('ea', ''), 10);
            return numA - numB;
        });
        
        Entrega24.forEach(element => {
            msg += `<a:${element.name}:${element.id}>`;
        });
    }

    await interaction.message.edit({ content: `${Emojis.get(`loading`)} | Gerando Pagamento...`, ephemeral: true, components: [] }).then(async tt => {

        const yy = await carrinhos.get(interaction.channel.id);

        const hhhh = produtos.get(`${yy.infos.produto}.Campos`);
        const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo);

        let valor = 0;

        if (yy.cupomadicionado !== undefined) {
            const valor2 = gggaaa.valor * yy.quantidadeselecionada;
            const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`);
            const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado);
            valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
        } else {
            valor = gggaaa.valor * yy.quantidadeselecionada;
        }

        const aaaa = Number(valor).toFixed(2);


        var agora = new Date();
        agora.setMinutes(agora.getMinutes() + 10);
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset() + 240);
        agora.setHours(agora.getHours() - 5);
        var novaDataFormatada = agora.toISOString().replace('Z', '-04:00');


        var payment_data = {
            transaction_amount: Number(aaaa),
            description: `Pagamento - ${interaction.user.username}`,
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
                    console.error('[MP PIX] Erro ao criar attachment:', err);
                }
            }

            const embed = new EmbedBuilder()
                .setColor(`${configuracao.get(`Cores.Principal`) == null ? '2b2d31' : configuracao.get('Cores.Principal')}`)
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`${Emojis.get(`pix_stamp_emoji`)} Pagamento via PIX criado`)
                .addFields(
                   { name: `${Emojis.get(`time_emoji`)} Expira em:`, value: `<t:${Math.floor(Date.now() / 1000) + 600}:R>` },
                    { name: `${Emojis.get(`information_emoji`)} Código copia e cola`, value: `\`\`\`${pix_copia_cola}\`\`\`` }
                )
                .setFooter(
                    { text: `${interaction.guild.name} - Pagamento expira em 10 minutos.` }
                )
                .setTimestamp()
                .setImage(`attachment://payment.png`);

            const row3 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("codigocopiaecola")
                        .setLabel('Código copia e cola')
                        .setEmoji(Emojis.get(`codigocopia`)) 
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId("deletchannel")
                        .setLabel('Cancelar')
                        .setStyle(4)
                );

            carrinhos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: 'pix' });
            pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: 'pix', data: Date.now() });

            await tt.edit({ embeds: [embed], files: attachment ? [attachment] : [], content: ``, components: [row3] });


            
            const valorFormatado = Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            const mandanopvdocara = new EmbedBuilder()
                .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#fcba03` : configuracao.get(`Cores.Processamento`)}`)
                .setTitle(`Pedido solicitado`)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setDescription(`${Emojis.get(`completedcart_emoji`)} Seu pedido foi criado e agora está aguardando a confirmação do pagamento`)
                .addFields(
                    { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorFormatado}\`` },
                    { name: `ID do Pedido`, value: `\`${txid}\`` },
                    { name: `Forma de Pagamento`, value: `\`Pix - Mercado Pago\`` }
                );

            try {
                await interaction.user.send({ embeds: [mandanopvdocara] });
            } catch (error) {
                console.error(`[PIX MP] - ERRO ao enviar DM para ${interaction.user.id}:`, error);
            }

                     const dsfjmsdfjnsdfj = new EmbedBuilder()
                    .setColor(configuracao.get("Cores.Processamento") || "#fcba03")
                    .setAuthor({ name: `Pedido Solicitado` })
                    .setTitle("Pedido solicitado")
                    .setDescription(` ${Emojis.get(`completedcart_emoji`)} Usuário ${interaction.user} solicitou um pedido`)
                    .addFields(
                        { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorFormatado}\`` },
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
                            carrinhos.set(`${interaction.channel.id}.replys`, { channelid: yyyyy.channel.id, idmsg: yyyyy.id });
                        });
                    } else {
                        console.error(`[PIX MP] - ERRO: Canal de logs (ID: ${logChannelId}) não foi encontrado. Verifique o ID.`);
                    }
                    
                } catch (error) {
                    console.error("[PIX MP] - ERRO ao enviar log de pedido (Permissão ou API):", error);
                }


        } catch (error) {
            
            let errorMessage = 'A requisição falhou ou expirou. Verifique o Access Token ou os Dados do Pagador.';

            if (error.message === 'TIMEOUT_MP_FATAL: A requisição excedeu 20 segundos.') {
                errorMessage = 'ERRO DE TEMPO LIMITE (20s)! O SDK do MP não conseguiu se comunicar. O Access Token deve ser o problema.';
            } else if (error.response?.data) {
                errorMessage = `ERRO MP: ${error.response.data.message || 'Erro de validação.'}. STATUS: ${error.status}.`;
            }
            
            console.error(`[PIX MP] - FALHA CRÍTICA: ${errorMessage}`);
            console.error("Dados de Erro (Verifique o Token/Dados Fictícios):", error.response?.data || error); 
            
            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("pagarpix")
                        .setLabel('Pix')
                        .setEmoji(`${Emojis.get(`pix_stamp_emoji`)}`) 
                        .setStyle(2),

                    new ButtonBuilder()
                        .setCustomId("pagarcrypto")
                        .setLabel('Litecoin')
                        .setStyle(1)
                        .setEmoji(`1464139389436297308`) 
                        .setDisabled(true)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("pagarCard")
                        .setLabel('Cartão de Crédito/Débito')
                        .setEmoji('1384035213641912360')
                        .setStyle(2)
                        .setDisabled(configuracao.get(`pagamentos.MpSite`) == true ? false : true)
                );

            const row3 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltarcarrinho")
                        .setLabel('Voltar')
                        .setEmoji(`${Emojis.get(`_back_emoji`)}`) 
                        .setStyle(2)
                );

            await tt.edit({ content: `Selecione uma forma de pagamento.`, ephemeral: true, components: [row1, row2, row3] });
            interaction.followUp({ content: `${Emojis.get(`negative`)}  | Ocorreu um erro ao criar o pagamento. ${errorMessage}`, ephemeral: true });
        }


    });
}
async function DentroCarrinhoEfiBank(client, interaction) {
    const Entrega24 = configuracao.get(`Emojis_carrinho`)

    let msg = ``

    if (Entrega24 !== null) {
        Entrega24.sort((a, b) => {
            const numA = parseInt(a.name.replace('ea', ''), 10);
            const numB = parseInt(b.name.replace('ea', ''), 10);
            return numA - numB;
        });
    
        Entrega24.forEach(element => {
            msg += `<a:${element.name}:${element.id}>`
        });
    }

    await interaction.update({ content: `${Emojis.get(`loading`)} Aguarde...`, ephemeral: true, components: [], embeds: [] })

    try {
        interaction.editReply({ content: `${Emojis.get(`loading`)} Criando seu pagamento...`, ephemeral: true, components: [], embeds: [] })
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
            return response.data.access_token
        }).catch(function (error) {
            console.log(`Novo erro: ${error}`)
        })

        const yy = await carrinhos.get(interaction.channel.id)
        const hhhh = produtos.get(`${yy.infos.produto}.Campos`)
        const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo)


        let valor = 0

        if (yy.cupomadicionado !== undefined) {
            const valor2 = gggaaa.valor * yy.quantidadeselecionada

            const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`)
            const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado)
            valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
        } else {
            valor = gggaaa.valor * yy.quantidadeselecionada
        }

        interaction.editReply({ content: `${Emojis.get(`loading`)} Espere só mais um pouco...`, ephemeral: true, components: [], embeds: [] })


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
            return response.data
        }).catch(function (error) {
            console.log(error.response.data)
        })

        const { qrGenerator } = require('../Lib/QRCodeLib');
        const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' });
        const qrcode = await qr.generate(response.pixCopiaECola);
        
        let attachment = null;
        if (qrcode.status === 'success' && qrcode.response) {
            try {
                const buffer = Buffer.from(qrcode.response, "base64");
                attachment = new AttachmentBuilder(buffer, { name: "payment.png" });
            } catch (err) {
                console.error('[EFIBANK QRCODE] Erro ao criar attachment:', err);
            }
        }

        const embed = new EmbedBuilder()
            .setColor(`${configuracao.get(`QRCode.principal`) || `#328dbc`}`)
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) ? interaction.user.displayAvatarURL({ dynamic: true }) : null })
            .setTitle(`${Emojis.get(`pix_stamp_emoji`)} Pagamento via PIX criado`)
            .addFields(
                { name: `${Emojis.get(`time_emoji`)} Expira em:`, value: `<t:${Math.floor(Date.now() / 1000) + 600}:R>` },
                { name: `${Emojis.get(`information_emoji`)} Código Copia e Cola:`, value: `\`\`\`${response.pixCopiaECola}\`\`\`` }
            )
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null })
            .setTimestamp();

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("codigocopiaecola")
                    .setLabel('Código copia e cola')
                    .setEmoji(`${Emojis.get(`codigocopia`)}`)
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId("deletchannel")
                    .setLabel('Cancelar')
                    .setStyle(4)

            )

        if (attachment) {
            if (configuracao.get(`pagamentos.QRCode`) == `miniatura`) {
                embed.setDescription(`-# \`⌚\` Caso prefira pagar com Qrcode utilize o Qrcode abaixo.`)
                embed.setThumbnail(`attachment://payment.png`)
            } else {
                embed.setImage('attachment://payment.png')
            }
        }

        carrinhos.set(`${interaction.channel.id}.pagamentos`, { id: response.txid, cp: response.pixCopiaECola, method: 'efibank' })
        pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: response.txid, cp: response.pixCopiaECola, method: 'efibank', data: Date.now() })

        await interaction.editReply({ embeds: [embed], files: attachment ? [attachment] : [], content: ``, components: [row3] })

        interaction.channel.setName(`💱・${interaction.user.username}・${interaction.user.id}`)

        const mandanopvdocara = new EmbedBuilder()
            .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#fcba03` : configuracao.get(`Cores.Processamento`)}`)
            .setTitle(`Pedido solicitado`)
            .setFooter(
                { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
            )
            .setTimestamp()
            .setDescription(`Seu pedido foi criado e agora está aguardando a confirmação do pagamento`)
            .addFields(
                { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                { name: `ID do Pedido`, value: `\`${response.txid}\`` },
                { name: `Forma de Pagamento`, value: `\`Pix - Efi Bank\`` }
            )

        try {
            await interaction.user.send({ embeds: [mandanopvdocara] })
        } catch (error) {

        }

        const dsfjmsdfjnsdfj = new EmbedBuilder()
            .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#fcba03` : configuracao.get(`Cores.Processamento`)}`)
            .setTitle(`Pedido solicitado`)
            .setDescription(`Usuário ${interaction.user} solicitou um pedido.`)
            .addFields(
                { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                { name: `ID do Pedido`, value: `\`${response.txid}\`` },
                { name: `Forma de pagamento`, value: `\`Pix - Efi Bank\`` }
            )
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null })
            .setTimestamp()

        try {
            const channela = await client.channels.fetch(configuracao.get(`ConfigChannels.logpedidos`));
            await channela.send({ embeds: [dsfjmsdfjnsdfj] }).then(yyyyy => {
                carrinhos.set(`${interaction.channel.id}.replys`, { channelid: yyyyy.channel.id, idmsg: yyyyy.id })
            })
        } catch (error) {

        }
    } catch (error) {
        console.log(error)
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("pagarpix")
                .setLabel('Pix')
                .setEmoji(`${Emojis.get(`pix_stamp_emoji`)}`)
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId("pagarcrypto")
                .setLabel('Litecoin')
                .setEmoji(`1464139389436297308`)
                .setStyle(2)
                .setDisabled(true)

        )

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("pagarCard")
                .setLabel(`Cartão de Crédito/Débito`)
                .setEmoji('1384035213641912360')
                .setStyle(2)
                .setDisabled(configuracao.get(`pagamentos.MpSite`) == true ? false : true)

        )

        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("voltarcarrinho")
                .setLabel('Voltar')
                .setEmoji('1237191329432211468')
                .setStyle(2)

        )

        interaction.editReply({ content: `Selecione uma forma de pagamento.`, ephemeral: true, components: [row1, row2, row3] })
        interaction.followUp({ content: `Ocorreu um erro ao criar o pagamento, tente novamente.\nError: ${error}`, ephemeral: true })
    }
}

async function DentroCarrinhoMisticPay(interaction, client) {
    await interaction.deferUpdate();

    await interaction.message.edit({ 
        content: `${Emojis.get('loading')} | Gerando Pagamento via Pix...`, 
        ephemeral: true, 
        components: [] 
    }).then(async tt => {

        try {
            const yy = await carrinhos.get(interaction.channel.id);
            const hhhh = produtos.get(`${yy.infos.produto}.Campos`);
            const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo);

            let valor = 0;
            if (yy.cupomadicionado !== undefined) {
                const valor2 = gggaaa.valor * yy.quantidadeselecionada;
                const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`);
                const cupomData = hhhh2.find(c => c.Nome === yy.cupomadicionado);
                valor = valor2 * (1 - cupomData.desconto / 100);
            } else {
                valor = gggaaa.valor * yy.quantidadeselecionada;
            }

            const aaaa = Number(valor).toFixed(2);
            
            const clientId = configuracao.get('pagamentos.mistclientid');
            const clientSecret = configuracao.get('pagamentos.misticsecret');

            const response = await axios.post('https://api.misticpay.com/api/transactions/create', {
                amount: Number(aaaa),
                payerName: interaction.user.username,
                payerDocument: '15084299872',
                transactionId: `ID_${Date.now()}_${interaction.user.id}`,
                description: `Pagamento Produto: ${yy.infos.produto}`
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
                console.log('[MISTIC PAY] Servidor limitado ou erro ao processar imagem, usando apenas código copia e cola');
            }

            const embed = new EmbedBuilder()
                .setColor(configuracao.get('Cores.Principal') || '2b2d31')
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`${Emojis.get(`pix_stamp_emoji`)} Pagamento via PIX criado`)
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

            carrinhos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: 'misticpay' });
            pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: 'misticpay', data: Date.now() });

            const editOptions = { embeds: [embed], content: ``, components: [rowSucesso] };
            if (attachment) {
                editOptions.files = [attachment];
            }
            await tt.edit(editOptions);

        } catch (error) {
            console.error("[MISTIC PAY] Erro:", error.response?.data || error.message);
            
            const rowErro = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("pagarpix").setLabel('Tentar novamente').setStyle(2).setEmoji(Emojis.get('pix_stamp_emoji')),
                new ButtonBuilder().setCustomId("voltarcarrinho").setLabel('Voltar').setStyle(2).setEmoji(Emojis.get('_back_emoji'))
            );

            await tt.edit({ 
                content: `❌ Erro ao gerar o Pix na Mistic Pay.\nMotivo: \`${error.response?.data?.message || error.message}\``, 
                components: [rowErro] 
            });
        }
    });
}
async function DentroCarrinhoImap(interaction, client) {
    
    const customIdModal = `modal_imap_${interaction.user.id}`;
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
            content: `${Emojis.get(`loading`)} | Gerando Pagamento via Pix.`, 
            embeds: [], components: [], files: [] 
        });

        try {
            const yy = await carrinhos.get(interaction.channel.id);
            const pixChave = configuracao.get('pagamentos.imap.chavepiximap');

            const hhhh = produtos.get(`${yy.infos.produto}.Campos`);
            const gggaaa = hhhh.find(c => c.Nome === yy.infos.campo);
            let valor = 0;

            if (yy.cupomadicionado !== undefined) {
                const valor2 = gggaaa.valor * yy.quantidadeselecionada;
                const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`);
                const cupomObj = hhhh2.find(c => c.Nome === yy.cupomadicionado);
                valor = valor2 * (1 - cupomObj.desconto / 100);
            } else {
                valor = gggaaa.valor * yy.quantidadeselecionada;
            }
            const aaaa = Number(valor).toFixed(2);

            const v = aaaa.toString();
            const n = "PIX IMAP".toUpperCase();
            const p = ["000201", `26${(22 + pixChave.length).toString().padStart(2, '0')}0014br.gov.bcb.pix01${pixChave.length.toString().padStart(2, '0')}${pixChave}`, "52040000", "5303986", `54${v.length.toString().padStart(2, '0')}${v}`, "5802BR", `59${n.length.toString().padStart(2, '0')}${n}`, "6008BRASILIA", "62070503***"].join("");
            const pix_copia_cola = p + "6304" + crc16(p + "6304");

            const { qrGenerator } = require('../Lib/QRCodeLib');
            const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' });
            const qrcode = await qr.generate(pix_copia_cola);
            
            let attachment = null;
            if (qrcode.status === 'success' && qrcode.response) {
                try {
                    const buffer = Buffer.from(qrcode.response, "base64");
                    attachment = new AttachmentBuilder(buffer, { name: "payment.png" });
                } catch (err) {
                    console.error('[IMAP QRCODE] Erro ao criar attachment:', err);
                }
            }

            const txid = `IMAP_${Math.floor(Math.random() * 999999)}`;
            await carrinhos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: 'imap', pagador: nomePagador, valor: aaaa });
            await pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: 'imap', data: Date.now(), pagador: nomePagador });

            const embed = new EmbedBuilder()
                .setColor(configuracao.get('Cores.Principal') || '2b2d31')
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`${Emojis.get(`pix_stamp_emoji`)} Pagamento via PIX criado`)
                .addFields(
                    { name: `${Emojis.get(`time_emoji`)} Expira em:`, value: `<t:${Math.floor(Date.now() / 1000) + 600}:R>` },
                    { name: `${Emojis.get(`information_emoji`)} Código copia e cola`, value: `\`\`\`${pix_copia_cola}\`\`\`` }
                )
                .setImage(`attachment://payment.png`);

            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("codigocopiaecola").setLabel('Código copia e cola').setEmoji(Emojis.get(`codigocopia`)).setStyle(2),
                new ButtonBuilder().setCustomId("deletchannel").setLabel('Cancelar').setStyle(4)
            );

            await tt.edit({ embeds: [embed], files: attachment ? [attachment] : [], content: ``, components: [row3] });

            const valorFormatado = Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            const mandanopvdocara = new EmbedBuilder()
                .setColor(configuracao.get(`Cores.Processamento`) || `#fcba03`)
                .setTitle(`Pedido solicitado`)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setDescription(`${Emojis.get(`completedcart_emoji`)} Seu pedido foi criado! Aguardando confirmação do titular: **${nomePagador}**`)
                .addFields(
                    { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorFormatado}\`` },
                    { name: `ID do Pedido`, value: `\`${txid}\`` },
                    { name: `Forma de Pagamento`, value: `\`Pix - Monitoramento IMAP\`` }
                );

            await interaction.user.send({ embeds: [mandanopvdocara] }).catch(() => {});

            const logChannelId = configuracao.get(`ConfigChannels.logpedidos`);
            const logChannel = await interaction.client.channels.fetch(logChannelId).catch(() => null);
            
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(configuracao.get("Cores.Processamento") || "#fcba03")
                    .setAuthor({ name: `Pedido Solicitado (IMAP)` })
                    .setTitle("Pedido solicitado")
                    .setDescription(` ${Emojis.get(`completedcart_emoji`)} Usuário ${interaction.user} solicitou um pedido via IMAP`)
                    .addFields(
                        { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorFormatado}\`` },
                        { name: "**ID do Pedido**", value: `\`${txid}\`` },
                        { name: "**Pagador Registrado**", value: `\`${nomePagador}\`` }
                    )
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] }).then(yyyyy => {
                    carrinhos.set(`${interaction.channel.id}.replys`, { channelid: yyyyy.channel.id, idmsg: yyyyy.id });
                });
            }

        } catch (error) {
            console.error(error);
            await tt.edit({ content: `❌ Erro ao gerar Pix IMAP.`, components: [] });
        }
    }).catch(err => {
        console.log("Tempo do modal expirou ou erro na coleta.");
    });
}
function DentroCarrinho2(interaction) {

    const yd = carrinhos.get(interaction.channel.id)

    const hhhh = produtos.get(`${yd.infos.produto}.Campos`)
    const gggaaa = hhhh.find(campo22 => campo22.Nome === yd.infos.campo)


    if (yd.quantidadeselecionada > gggaaa.condicao?.valormaximo) return interaction.reply({ content: `${Emojis.get(`negative`)} | Você não pode comprar mais de \`${gggaaa.condicao.valormaximo}x ${yd.infos.produto} - ${yd.infos.campo}\``, ephemeral: true })
    if (yd.quantidadeselecionada < gggaaa.condicao?.valorminimo) return interaction.reply({ content: `${Emojis.get(`negative`)} | Você não pode comprar mais de \`${gggaaa.condicao.valorminimo}x ${yd.infos.produto} - ${yd.infos.campo}\``, ephemeral: true })
    interaction.deferUpdate()



    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("pagarpix")
                .setLabel('Pix')
                .setEmoji(`${Emojis.get(`pix_stamp_emoji`)}`)
                .setStyle(2),

            new ButtonBuilder()
                .setCustomId("pagarcrypto")
                .setLabel('Litecoin')
                .setEmoji("1464139389436297308")
                .setStyle(1)
                .setDisabled(true)
        )

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("pagarCard")
                .setLabel('Cartão de Crédito/Débito')
                .setEmoji('1384035213641912360')
                .setStyle(2)
                .setDisabled(configuracao.get(`pagamentos.MpSite`) == true ? false : true)
        )

    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltarcarrinho")
                .setLabel('Voltar')
                .setEmoji(`${Emojis.get(`_back_emoji`)}`)
                .setStyle(2)
        )

    interaction.message.edit({ content: `Selecione uma forma de pagamento.`, components: [row1, row2, row3], embeds: [] })
}
async function DentroCarrinho1(thread, status) {

    let ggg
    if (status == 1) {
        ggg = carrinhos.get(thread.channel.id)
    } else {
        ggg = carrinhos.get(thread.id)
    }



    const hhhh = produtos.get(`${ggg.infos.produto}.Campos`)
    const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.infos.campo)
    let yy = await carrinhos.get(`${ggg.threadid}.quantidadeselecionada`)
    if (yy == null) {
        await carrinhos.set(`${ggg.threadid}.quantidadeselecionada`, 1)
        yy = 1
    }


    const embed = new EmbedBuilder()
        .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
        .setAuthor({ name: ggg.user.username, iconURL: ggg.user.displayAvatarURL })
        .setTitle(`Revisao do Pedido`)
        

        .setFooter(
            { text: ggg.guild.name }
        )
        .setTimestamp()

        if (produtos.get(`${ggg.infos.produto}.Config.desc`) !== "Não definido") {
        embed.setDescription(`${produtos.get(`${ggg.infos.produto}.Config.desc`)}`)
    }


    const hhhhsdsadasd2 = produtos.get(`${ggg.infos.produto}.Config`)

    if (hhhhsdsadasd2.banner !== undefined || hhhhsdsadasd2.banner !== '') {
        try {
            await embed.setImage(`${hhhhsdsadasd2.banner}`)
        } catch (error) {

        }

    }
    if (hhhhsdsadasd2.icon !== undefined || hhhhsdsadasd2.icon !== '') {
        try {
            await embed.setThumbnail(`${hhhhsdsadasd2.icon}`)
        } catch (error) {

        }

    }



    if (ggg.cupomadicionado !== undefined) {


        const ggg2 = carrinhos.get(thread.channel.id)
        const hhhh2 = produtos.get(`${ggg.infos.produto}.Cupom`)
        const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === ggg2.cupomadicionado)

        const yyfyfy = gggaaa.valor * yy

        const valorComDesconto = yyfyfy * (1 - gggaaaawdwadwa.desconto / 100);

        const valorOriginalFormatado = Number(yyfyfy).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const valorComDescontoFormatado = Number(valorComDesconto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });


        embed.addFields(
            { name: `**Carrinho**`, value: `\`${yy}x ${ggg.infos.produto} - ${ggg.infos.campo}\``, inline: true },
            {
                name: `**Valor à vista**`,
                value: `De ~~\`R$ ${valorOriginalFormatado}\`~~  por \`${valorComDescontoFormatado}\``,
                inline: true
            },
            { name: `**Cupom**`, value: `\`${ggg2.cupomadicionado}\``, inline: false },
            { name: `**Em estoque**`, value: `\`${gggaaa.estoque.length}\``, inline: false }
        )

    } else {

        embed.addFields(
            { name: `**Carrinho**`, value: `\`${yy}x ${ggg.infos.produto} - ${ggg.infos.campo}\``, inline: true },
            { name: `**Valor à vista**`, value: `\`R$ ${Number(gggaaa.valor * yy).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true },
            { name: `**Em estoque**`, value: `\`${gggaaa.estoque.length}\``, inline: false }
        )

    }

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("irparapagamento")
                .setLabel('Ir para o Pagamento')
                .setEmoji(`1178076954029731930`)
                .setStyle(3),

            new ButtonBuilder()
                .setCustomId("editarquantidade")
                .setLabel('Editar Quantidade')
                .setEmoji(`1237192698746634331`)
                .setStyle(1)
        )
    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("usarcupom")
                .setLabel('Usar Cupom')
                .setEmoji(`1230849204528746607`)
                .setStyle(2),

            new ButtonBuilder()
                .setCustomId("deletchannel")
                .setLabel('Cancelar')
                .setEmoji(`1178076767567757312`)
                .setStyle(4)
        )


    if (status == 1) {
        thread.deferUpdate()
        thread.message.edit({ content: `<@${ggg.user.id}> ${configuracao.get('ConfigRoles.cargoadm') ? `<@&${configuracao.get('ConfigRoles.cargoadm')}>` : ''} ${configuracao.get('ConfigRoles.cargosup') ? `<@&${configuracao.get('ConfigRoles.cargosup')}>` : ''}`, embeds: [embed], components: [row2,row3] })

    } else {
        thread.send({ content: `<@${ggg.user.id}> ${configuracao.get('ConfigRoles.cargoadm') ? `<@&${configuracao.get('ConfigRoles.cargoadm')}>` : ''} ${configuracao.get('ConfigRoles.cargosup') ? `<@&${configuracao.get('ConfigRoles.cargosup')}>` : ''}`, embeds: [embed], components: [row2,row3] })
    }

}

async function DentroCarrinhoCard(interaction, client) {
    interaction.deferUpdate();

    const Entrega24 = configuracao.get(`Emojis_carrinho`);
    let msg = ``;

    if (Entrega24 !== null) {
        Entrega24.sort((a, b) => {
            const numA = parseInt(a.name.replace('ea', ''), 10);
            const numB = parseInt(b.name.replace('ea', ''), 10);
            return numA - numB;
        });
        
        Entrega24.forEach(element => {
            msg += `<a:${element.name}:${element.id}>`;
        });
    }

    await interaction.message.edit({ content: `${Emojis.get(`loading`)} | Gerando Pagamento...`, ephemeral: true, components: [] }).then(async tt => {

        const yy = await carrinhos.get(interaction.channel.id);

        const hhhh = produtos.get(`${yy.infos.produto}.Campos`);
        const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo);

        let valor = 0;

        if (yy.cupomadicionado !== undefined) {
            const valor2 = gggaaa.valor * yy.quantidadeselecionada;
            const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`);
            const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado);
            valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
        } else {
            valor = gggaaa.valor * yy.quantidadeselecionada;
        }

        const aaaa = Number(valor).toFixed(2);

        var preference_data = {
            items: [
                {
                    title: `${yy.infos.produto} - ${yy.infos.campo}`,
                    quantity: yy.quantidadeselecionada,
                    unit_price: Number((valor / yy.quantidadeselecionada).toFixed(2)),
                    currency_id: 'BRL'
                }
            ],
            payer: {
                email: `${interaction.user.id}@discord-user.com`,
                name: interaction.user.username
            },
            back_urls: {
                success: 'https://discord.com',
                failure: 'https://discord.com',
                pending: 'https://discord.com'
            },
            auto_return: 'approved',
            payment_methods: {
                excluded_payment_types: [
                    { id: 'ticket' },
                    { id: 'atm' }
                ],
                installments: 12
            },
            external_reference: interaction.channel.id
        };
        
        const mpAccessToken = configuracao.get('pagamentos.MpAPI');
        mercadopago.configurations.setAccessToken(mpAccessToken);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT_MP_FATAL: A requisição excedeu 20 segundos.')), 20000)
        );

        try {
            const preference = await Promise.race([
                mercadopago.preferences.create(preference_data),
                timeoutPromise
            ]);
            
            const preferenceId = preference.body.id;
            const checkoutUrl = preference.body.init_point;

            const contentMessage = `
# ${Emojis.get(`card_stamp_emoji`) || '✅'} Pagamento Gerado

Seu pagamento foi gerado com sucesso! Observe os detalhes do seu carrinho logo abaixo:

**Detalhes do Pagamento**
- **Valor:** \`R$ ${Number(valor).toFixed(2)}\`
- **Expira em:** <t:${Math.floor(Date.now() / 1000) + 600}:R>
- **Método:** Cartão de Crédito/Débito

${Emojis.get(`info`) || 'ℹ️'} Clique no botão abaixo e efetue seu pagamento de forma segura através do Mercado Pago.

-# ${Emojis.get(`_fixe_emoji`) || '📌'} Pagamento 100% seguro e protegido • Expira em 10 minutos
            `.trim();

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Pagar com Cartão')
                        .setEmoji('1384035213641912360')
                        .setStyle(5)
                        .setURL(checkoutUrl)
                );

            carrinhos.set(`${interaction.channel.id}.pagamentos`, { id: preferenceId, method: 'card', checkoutUrl: checkoutUrl });
            pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: preferenceId, method: 'card', data: Date.now(), checkoutUrl: checkoutUrl });

            await tt.edit({ content: contentMessage, embeds: [], components: [row1] });

            
            const valorFormatado = Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            const mandanopvdocara = new EmbedBuilder()
                .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#fcba03` : configuracao.get(`Cores.Processamento`)}`)
                .setTitle(`Pedido solicitado`)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setDescription(`${Emojis.get(`completedcart_emoji`) || '🛒'} Seu pedido foi criado e agora está aguardando a confirmação do pagamento`)
                .addFields(
                    { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorFormatado}\`` },
                    { name: `ID do Pedido`, value: `\`${preferenceId}\`` },
                    { name: `Forma de Pagamento`, value: `\`Cartão - Mercado Pago\`` }
                );

            try {
                await interaction.user.send({ embeds: [mandanopvdocara] });
            } catch (error) {
                console.error(`[CARD MP] - ERRO ao enviar DM para ${interaction.user.id}:`, error);
            }

            const dsfjmsdfjnsdfj = new EmbedBuilder()
                .setColor(configuracao.get("Cores.Processamento") || "#fcba03")
                .setAuthor({ name: `Pedido Solicitado` })
                .setTitle("Pedido solicitado")
                .setDescription(`${Emojis.get(`completedcart_emoji`) || '🛒'} Usuário ${interaction.user} solicitou um pedido`)
                .addFields(
                    { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorFormatado}\`` },
                    { name: "**ID do Pedido**", value: `\`${preferenceId}\`` },
                    { name: "**Forma de pagamento**", value: "Cartão - Mercado Pago" }
                )
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            try {
                const logChannelId = configuracao.get(`ConfigChannels.logpedidos`);
                const channela = await interaction.client.channels.fetch(logChannelId); 

                if (channela) {
                    await channela.send({ embeds: [dsfjmsdfjnsdfj] }).then(yyyyy => {
                        carrinhos.set(`${interaction.channel.id}.replys`, { channelid: yyyyy.channel.id, idmsg: yyyyy.id });
                    });
                } else {
                    console.error(`[CARD MP] - ERRO: Canal de logs (ID: ${logChannelId}) não foi encontrado.`);
                }
            } catch (error) {
                console.error("[CARD MP] - ERRO ao enviar log de pedido:", error);
            }

        } catch (error) {
            let errorMessage = 'A requisição falhou ou expirou. Verifique o Access Token.';

            if (error.message === 'TIMEOUT_MP_FATAL: A requisição excedeu 20 segundos.') {
                errorMessage = 'ERRO DE TEMPO LIMITE (20s)! O SDK do MP não conseguiu se comunicar.';
            } else if (error.response?.data) {
                errorMessage = `ERRO MP: ${error.response.data.message || 'Erro de validação.'}. STATUS: ${error.status}.`;
            }
            
            console.error(`[CARD MP] - FALHA CRÍTICA: ${errorMessage}`);
            console.error("Dados de Erro:", error.response?.data || error); 
            
            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("pagarCard")
                        .setLabel('Tentar novamente')
                        .setEmoji('1384035213641912360')
                        .setStyle(2)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltarcarrinho")
                        .setLabel('Voltar')
                        .setEmoji(`${Emojis.get(`_back_emoji`)}`) 
                        .setStyle(2)
                );

            await tt.edit({ content: `Selecione uma forma de pagamento.`, ephemeral: true, components: [row1, row2] });
            interaction.followUp({ content: `${Emojis.get(`negative`) || '❌'}  | Ocorreu um erro ao criar o pagamento. ${errorMessage}`, ephemeral: true });
        }
    });
}

module.exports = {
    DentroCarrinho1,
    DentroCarrinho2,
    DentroCarrinhoPix,
    DentroCarrinhoEfiBank,
    DentroCarrinhoMisticPay,
    DentroCarrinhoImap,
    DentroCarrinhoCard
}
