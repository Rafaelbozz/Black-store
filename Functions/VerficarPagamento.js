const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { pagamentos, carrinhos, pedidos, produtos, configuracao, Emojis } = require("../DataBaseJson")
const fs = require("fs")
const path = require("path")
const https = require("https");
const axios = require("axios");
const { BloquearBanco } = require("./BloquearBanco");
const { CheckPosition } = require("./PosicoesFunction");
const Gerencianet = require("sdk-node-apis-efi");
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');

async function VerificarPagamento(client) {
    const allPayments = pagamentos.fetchAll();

    for (const payment of allPayments) {
        const method = payment.data.pagamentos.method;
        const paymentDate = payment.data.pagamentos.data;

        let threadChannel
        try {
            threadChannel = await client.channels.fetch(payment.ID);

            const tenMinutesLater = paymentDate + 10 * 60 * 1000;

            if (Date.now() > tenMinutesLater) {
                const texto = threadChannel.name;
                const partes = texto.split("・");
                const ultimoNumero = partes[partes.length - 1];
                const car = carrinhos.get(payment.ID);
                
                let valorCarrinho = 0;
                try {
                    const prodData = produtos.get(`${car.infos.produto}.Campos`);
                    const item = prodData.find(c => c.Nome === car.infos.campo);
                    valorCarrinho = item.valor * car.quantidadeselecionada;
                    
                    if (car.cupomadicionado) {
                        const cupons = produtos.get(`${car.infos.produto}.Cupom`);
                        const cupom = cupons.find(c => c.Nome === car.cupomadicionado);
                        if (cupom) valorCarrinho = valorCarrinho * (1 - cupom.desconto / 100);
                    }
                } catch (e) {}
                
                const valorFormatado = Number(valorCarrinho).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                
                try {
                    const user = await client.users.fetch(ultimoNumero);
                    
                    const embedExpirado = new EmbedBuilder()
                        .setColor('#ff6b00')
                        .setAuthor({ 
                            name: 'Pagamento Expirado', 
                            iconURL: 'https://images-ext-1.discordapp.net/external/8TXMZbgFyRCt4qC_-Ql_Ow_Ql_Ow_Ql_Ow/https/cdn.discordapp.com/emojis/1249486723520397314.png' 
                        })
                        .setTitle('⏰ Tempo Esgotado')
                        .setDescription(`Seu carrinho foi encerrado pois o tempo limite de pagamento expirou. Você pode iniciar uma nova compra a qualquer momento.`)
                        .addFields(
                            { name: 'Detalhes do Pedido Expirado', value: `\`${car.quantidadeselecionada}x ${car.infos.produto} - ${car.infos.campo} | R$ ${valorFormatado}\`` }
                        )
                        .setFooter({ text: `${car.guild.name} • ${new Date().toLocaleDateString('pt-BR')}`, iconURL: car.guild.iconURL })
                        .setTimestamp();
                    
                    const canalPai = threadChannel.parent || threadChannel;
                    const linkCanal = `https://discord.com/channels/${car.guild.id}/${canalPai.id}`;
                    
                    const rowBotao = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Abrir Novo Carrinho')
                            .setURL(linkCanal)
                            .setStyle(5)
                    );
                    
                    await user.send({ embeds: [embedExpirado], components: [rowBotao] });
                } catch (error) {
                }
                
                try {
                    const channela = await client.channels.fetch(`${configuracao.get("ConfigChannels.systemlogs")}`);

                    const embedLogs = new EmbedBuilder()
                        .setColor('#ff6b00')
                        .setAuthor({ 
                            name: `Pedido #${car.pagamentos.id}`, 
                            iconURL: 'https://cdn.discordapp.com/emojis/1249486723520397314.png' 
                        })
                        .setTitle('Pagamento Expirado')
                        .setDescription(`O usuário <@${ultimoNumero}> não completou o pagamento dentro do prazo de 10 minutos.`)
                        .addFields(
                            { name: 'Produto', value: `\`${car.infos.produto} - ${car.infos.campo}\``, inline: true },
                            { name: 'Quantidade', value: `\`${car.quantidadeselecionada}x\``, inline: true },
                            { name: 'Valor', value: `\`R$ ${valorFormatado}\``, inline: true },
                            { name: 'Método', value: `\`${car.pagamentos.method || 'PIX'}\``, inline: true },
                            { name: 'Usuário', value: `<@${ultimoNumero}>`, inline: true },
                            { name: 'ID do Usuário', value: `\`${ultimoNumero}\``, inline: true }
                        )
                        .setFooter({ text: car.guild.name, iconURL: car.guild.iconURL })
                        .setTimestamp();

                    await channela.send({ embeds: [embedLogs] });
                } catch (error) {
                }
                
                pagamentos.delete(payment.ID);
                carrinhos.delete(payment.ID);
                await threadChannel.delete();
                
                return;
            }

        } catch (error) {
            console.error(`Error processing PIX payment for ID ${payment.ID}: ${error}`);
            pagamentos.delete(payment.ID);
            carrinhos.delete(payment.ID);
        
        } 
if (method === 'imap') {

   
    const yy = await carrinhos.get(payment.ID);
    if (!yy || !yy.pagamentos) return;

    const bancoAtivo = configuracao.get('pagamentos.imap.banco_atual') || 'inter';
    const pagadorEsperado = (yy.pagamentos.pagador || "").toLowerCase();
    
    const valorReal = yy.pagamentos.valor || "0.00"; 
    const valorComVirgula = String(valorReal).replace('.', ',');


    const configImap = {
        imap: {
            user: configuracao.get('pagamentos.imap.user'),
            password: configuracao.get('pagamentos.imap.password'),
            host: configuracao.get('pagamentos.imap.host'),
            port: 993,
            tls: true,
            authTimeout: 5000,
            tlsOptions: { rejectUnauthorized: false }
        }
    };

    try {
        const imaps = require('imap-simple');
        const { simpleParser } = require('mailparser');

        const connection = await imaps.connect(configImap);
        await connection.openBox('INBOX');

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const searchCriteria = ['UNSEEN', ['SINCE', yesterday]];
        
        const messages = await connection.search(searchCriteria, { bodies: [''], markSeen: true });

        for (const item of messages) {
            const all = item.parts.find(part => part.which === '');
            const parsed = await simpleParser(all.body);
            
            const body = (parsed.text || "").toLowerCase();
            const subject = (parsed.subject || "").toLowerCase();

            const confirmouNome = body.includes(pagadorEsperado);
            const confirmouValor = body.includes(valorComVirgula) || body.includes(`r$ ${valorComVirgula}`);

            const matchesAssunto = 
                (subject.includes('pix recebido')) || 
                (subject.includes('você recebeu um pix')) || 
                (subject.includes('você recebeu uma transferência')) || 
                (body.includes('recebeu um pix'));

            if (matchesAssunto && confirmouNome && confirmouValor) {
                console.log(` [${bancoAtivo.toUpperCase()}] E-mail de ${pagadorEsperado} aprovado!`);

                
                pagamentos.delete(payment.ID);
                pedidos.set(payment.ID, { id: `IMAP_${item.attributes.uid}`, method: 'imap', bank: bancoAtivo });

                try {
                    const userDM = await client.users.fetch(yy.user.id);
                    const embedDM = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Sucesso`) || `#40fc04`}`)
                        .setAuthor({ 
                            name: `Pedido #${payment.ID}`, 
                            iconURL: `https://cdn.discordapp.com/emojis/1249486723520397314.png` 
                        })
                        .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                        .addFields({ name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorComVirgula}\`` })
                        .setFooter({ text: threadChannel.guild.name, iconURL: threadChannel.guild.iconURL() })
                        .setTimestamp();

                    await userDM.send({ embeds: [embedDM] }).catch(() => {});
                } catch (e) { console.log("Erro ao enviar DM."); }

                try {
                    const messagesDel = await threadChannel.messages.fetch({ limit: 100 });
                    await threadChannel.bulkDelete(messagesDel).catch(() => {});
                } catch (e) {}

                await threadChannel.send({ 
                    content: `${Emojis.get('loading')} Pagamento Aprovado! Iniciando Entrega..` 
                });

                if (configuracao.get('ConfigRoles.cargoCliente')) {
                    try {
                        const guild = client.guilds.cache.get(yy.guild.id);
                        const member = await guild.members.fetch(yy.user.id);
                        await member.roles.add(configuracao.get('ConfigRoles.cargoCliente'));
                    } catch (e) {
                        console.log(`⚠️ Erro ao dar cargo para o cliente no IMAP: ${e.message}`);
                    }
                }

                try {
                    const lk = yy.replys;
                    const channelStaff = await client.channels.fetch(lk.channelid);
                    const msgStaff = await channelStaff.messages.fetch(lk.idmsg);
                    
                    const row222 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`refoundd_IMAP_${item.attributes.uid}`)
                                .setLabel('Reembolsar')
                                .setStyle(2)
                                .setDisabled(true)
                        );

                    const embedAprovado = new EmbedBuilder()
                        .setColor('#40fc04')
                        .setAuthor({ 
                            name: `Pedido #IMAP_${item.attributes.uid}`, 
                            iconURL: 'https://cdn.discordapp.com/emojis/1249486723520397314.png' 
                        })
                        .setTitle('Pagamento Aprovado')
                        .setDescription(`O usuário <@${yy.user.id}> efetuou o pagamento com sucesso e a entrega foi iniciada.`)
                        .addFields({
                            name: 'Informações do Pagamento',
                            value: `- **Valor Pago:** \`R$ ${valorComVirgula}\`\n- **Data:** <t:${Math.floor(Date.now() / 1000)}:F>\n- **Banco do Cliente:** \`${bancoAtivo.toUpperCase()} (IMAP)\`\n- **Status do Pedido:** \`Aprovado\`\n- **Produto:** \`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo}\``
                        })
                        .setFooter({ text: threadChannel.guild.name, iconURL: threadChannel.guild.iconURL() })
                        .setTimestamp();

                    await msgStaff.reply({ embeds: [embedAprovado], components: [row222] });
                } catch (e) {}

                await EntregarPagamentos(client, payment.ID, threadChannel);
                CheckPosition(client);

                connection.end();
                return; 
            }
        }
        connection.end();
    } catch (error) {
        console.error(`⚠️ [IMAP] Erro na verificação: ${error.message}`);
    }
}
if (method === 'misticpay') {
    let res;
    const clientId = configuracao.get('pagamentos.mistclientid');
    const clientSecret = configuracao.get('pagamentos.misticsecret');

    if (!clientId || !clientSecret) {
        return console.error("❌ [MISTIC ERROR] Credenciais não encontradas no banco de dados.");
    }

    if (payment.data.pagamentos.id !== `Aprovado Manualmente`) {
        try {
            res = await axios.post('https://api.misticpay.com/api/transactions/check', {
                transactionId: payment.data.pagamentos.id 
            }, {
                headers: { 'ci': clientId, 'cs': clientSecret, 'Content-Type': 'application/json' },
                timeout: 5000 
            });
        } catch (error) {
        }
    }

    const statusMistic = res?.data?.transaction?.transactionState;
    const isManual = payment.data.pagamentos.id === `Aprovado Manualmente`;

    if (statusMistic === 'COMPLETO' || isManual) {
        
        const yy = await carrinhos.get(payment.ID);
        if (!yy) return;

        pagamentos.delete(payment.ID);
        
        const prodData = produtos.get(`${yy.infos.produto}.Campos`);
        const item = prodData.find(c => c.Nome === yy.infos.campo);
        let valorFinal = item.valor * yy.quantidadeselecionada;

        if (yy.cupomadicionado) {
            const cupons = produtos.get(`${yy.infos.produto}.Cupom`);
            const cupom = cupons.find(c => c.Nome === yy.cupomadicionado);
            if (cupom) valorFinal = valorFinal * (1 - cupom.desconto / 100);
        }
        const valorFormatado = Number(valorFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        try {
            const userDM = await client.users.fetch(yy.user.id);
            const embedDM = new EmbedBuilder()
                .setColor(configuracao.get(`Cores.Sucesso`) || '#40fc04')
                .setAuthor({ 
                    name: `Pedido #${payment.ID}`, 
                    iconURL: `https://cdn.discordapp.com/emojis/1249486723520397314.png` 
                })
                .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                .addFields(
                    { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorFormatado}\`` },
                )
                .setFooter({ text: yy.guild.name, iconURL: yy.guild.iconURL })
                .setTimestamp();

            await userDM.send({ embeds: [embedDM] }).catch(() => {});
        } catch (e) {}

        try {
            const messagesDel = await threadChannel.messages.fetch({ limit: 100 });
            await threadChannel.bulkDelete(messagesDel).catch(() => {});
        } catch (e) {}

        await threadChannel.send({ 
            content: `${Emojis.get('loading')} Pagamento Aprovado! Iniciando Entrega..` 
        });

        let bank = res?.data?.transaction?.payerBank || 'Mistic Pay (Pix)';
        pedidos.set(payment.ID, { id: isManual ? 'Manual' : payment.data.pagamentos.id, method: 'misticpay', bank: bank });

        try {
            const lk = yy.replys;
            const channelStaff = await client.channels.fetch(lk.channelid);
            const msgStaff = await channelStaff.messages.fetch(lk.idmsg);
            
            const row222 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`refoundd_${isManual ? 'Manual' : payment.data.pagamentos.id}`)
                        .setLabel('Reembolsar')
                        .setStyle(2)
                        .setDisabled(isManual)
                );

            const embedAprovado = new EmbedBuilder()
                .setColor('#40fc04')
                .setAuthor({ 
                    name: `Pedido #${isManual ? 'Manual' : payment.data.pagamentos.id}`, 
                    iconURL: 'https://cdn.discordapp.com/emojis/1249486723520397314.png' 
                })
                .setTitle('Pagamento Aprovado')
                .setDescription(`O usuário <@${yy.user.id}> efetuou o pagamento com sucesso e a entrega foi iniciada.`)
                .addFields({
                    name: 'Informações do Pagamento',
                    value: `- **Valor Pago:** \`R$ ${valorFormatado}\`\n- **Data:** <t:${Math.floor(Date.now() / 1000)}:F>\n- **Banco do Cliente:** \`${bank}\`\n- **Status do Pedido:** \`Aprovado\`\n- **Produto:** \`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo}\``
                })
                .setFooter({ text: threadChannel.guild.name, iconURL: threadChannel.guild.iconURL() })
                .setTimestamp();

            await msgStaff.reply({ embeds: [embedAprovado], components: [row222] });
        } catch (e) {}

        if (configuracao.get('ConfigRoles.cargoCliente')) {
            try {
                const guild = client.guilds.cache.get(yy.guild.id);
                const member = await guild.members.fetch(yy.user.id);
                await member.roles.add(configuracao.get('ConfigRoles.cargoCliente'));
            } catch (e) {}
        }

        await EntregarPagamentos(client, payment.ID, threadChannel);

        CheckPosition(client);
    }
}

      if (method === 'pix') {
            let res
            if (payment.data.pagamentos.id !== `Aprovado Manualmente`) {
                res = await axios.get(`https://api.mercadopago.com/v1/payments/${payment.data.pagamentos.id}`, {
                    headers: {
                        Authorization: `Bearer ${configuracao.get('pagamentos.MpAPI')}`
                    }
                })
            }

       
            if (res?.data.status == 'approved' || payment.data.pagamentos.id == `Aprovado Manualmente`) {
                pagamentos.delete(payment.ID)
                const yy = await carrinhos.get(payment.ID);
                const messages = await threadChannel.messages.fetch({ limit: 100 });
                await threadChannel.bulkDelete(messages);



                const mandanopvdocara = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc': configuracao.get('Cores.Principal')}`)
                    .setAuthor({ name: `${yy.user.globalName}` })
                    .setTitle(`🕔 Aguarde...`)
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()
                const msg = await threadChannel.send({ content: `${Emojis.get('loading')} Pagamento Aprovado! Iniciando Entrega..`, embeds: [] })






                let valor = 0
                const hhhh = produtos.get(`${yy.infos.produto}.Campos`)
                const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo)


                if (yy.cupomadicionado !== undefined) {
                    const valor2 = gggaaa.valor * yy.quantidadeselecionada

                    const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`)
                    const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado)
                    valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
                } else {
                    valor = gggaaa.valor * yy.quantidadeselecionada
                }

                const lk = carrinhos.get(`${payment.ID}.replys`)
                let bank = res?.data.point_of_interaction.transaction_data.bank_info.payer.long_name


                if (configuracao.get('pagamentos.BancosBloqueados') !== null) {
                    const dd = await BloquearBanco(client, bank, payment.data.pagamentos.id, yy, msg)

                    const embed = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Erro`) == null ? `#ff0000` : configuracao.get(`Cores.Erro`)}`)
                        .setAuthor({ name: `Pedido #${payment.ID}` })
                        .setTitle(`Pedido não aprovado`)
                        .setDescription(`Esse servidor não está aceitando pagamentos desta instituição \`${bank}\`, seu dinheiro foi reembolsado, tente novamente usando outro banco.`)
                        .addFields(
                            { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` }
                        )

                    const embed2 = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Erro`) == null ? `#ff0000` : configuracao.get(`Cores.Erro`)}`)
                        .setAuthor({ name: `Pedido #${payment.ID}` })
                        .setTitle(`Anti Banco | Nova Venda`)
                        .setDescription(`Esse servidor não está aceitando pagamentos desta instituição \`${bank}\`, o dinheiro do Comprador foi reembolsado, Obrigado por confiar em meu trabalho.`).addFields(
                            { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` }
                        )


                    if (dd?.status == 400) {

                        try {
                            const channela = await client.channels.fetch(lk.channelid);

                            const yuyu = await channela.messages.fetch(lk.idmsg)


                            yuyu.reply({ embeds: [embed2] })

                        } catch (error) {
                        }



                        msg.edit({ embeds: [embed], content: `` })

                        setInterval(async () => {
                            try { await threadChannel.delete() } catch (error) { }

                        }, 10000);
                        return
                    }

                const status = (payment.data.pagamentos.id === 'Aprovado Manualmente') ? 'Aprovado Manualmente' : (res.data.status === 'pending' ? 'AutoApproved' : Number(payment.data.pagamentos.id));
                pedidos.set(payment.ID, { id: status, method: method })

                await msg.edit({ content: `${Emojis.get('loading')} Pagamento Aprovado, Aguarde um momento...`, embeds: [] })

                const mandanopvdocara2 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#53c435` : configuracao.get(`Cores.Processamento`)}`)
                    .setAuthor({ name: `${yy.user.globalName}` })
                    .setTitle(`Pagamento confirmado`)
                    .setDescription('🕔 Aguarde...')
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()

                await msg.edit({ embeds: [], content: `${Emojis.get('loading')} Pagamento Aprovado, Aguarde um momento...` })









                const dsfjmsdfjnsdfj2 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`)
                    .setAuthor({ name: `Pedido #${payment.data.pagamentos.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                    .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                    )
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()

                try {
                    const member = await client.users.fetch(yy.user.id)
                    await member.send({ embeds: [dsfjmsdfjnsdfj2] })
                } catch (error) {

                }



                const status2 = (payment.data.pagamentos.id === 'Aprovado Manualmente') ? 'Aprovado Manualmente' : (res.data.status === 'pending' ? 'AutoApproved' : bank);
                
                const row222 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`refoundd_${payment.data.pagamentos.id}`)
                            .setLabel('Reembolsar')
                            .setStyle(2)
                            .setDisabled(res?.data?.status == 'approved' ? false : true)
                    );

                const embedAprovado = new EmbedBuilder()
                    .setColor('#40fc04')
                    .setAuthor({ 
                        name: `Pedido #${payment.data.pagamentos.id}`, 
                        iconURL: 'https://cdn.discordapp.com/emojis/1249486723520397314.png' 
                    })
                    .setTitle('Pagamento Aprovado')
                    .setDescription(`O usuário <@${yy.user.id}> efetuou o pagamento com sucesso e a entrega foi iniciada.`)
                    .addFields({
                        name: 'Informações do Pagamento',
                        value: `- **Valor Pago:** \`R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`\n- **Data:** <t:${Math.floor(Date.now() / 1000)}:F>\n- **Banco do Cliente:** \`${status2}\`\n- **Status do Pedido:** \`Aprovado\`\n- **Produto:** \`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo}\``
                    })
                    .setFooter({ text: threadChannel.guild.name, iconURL: threadChannel.guild.iconURL() })
                    .setTimestamp();

                try {
                    const channela = await client.channels.fetch(lk.channelid);

                    const yuyu = await channela.messages.fetch(lk.idmsg)
                    yuyu.reply({ embeds: [embedAprovado], components: [row222] }).then(aaaaa => {
                        carrinhos.set(`${payment.ID}.replys`, { channelid: aaaaa.channel.id, idmsg: aaaaa.id })
                    })
                } catch (error) {

                }

                CheckPosition(client)
                try {
                    if (configuracao.get('ConfigRoles.cargoCliente') !== null) {
                        await client.guilds.cache.get(yy.guild.id).members.fetch(yy.user.id).then(member => member.roles.add(configuracao.get('ConfigRoles.cargoCliente'))).catch(console.error);
                    }
                } catch (error) {

                }







                CheckPosition(client)









            }



                const status = (payment.data.pagamentos.id === 'Aprovado Manualmente') ? 'Aprovado Manualmente' : (res.data.status === 'ATIVA' ? 'CONCLUIDA' : Number(payment.data.pagamentos.id));
                pedidos.set(payment.ID, { id: status, method: method })

                await msg.edit({ content: `🕔 Aguarde...`, embeds: [] })

                const mandanopvdocara2 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#53c435` : configuracao.get(`Cores.Processamento`)}`)
                    .setAuthor({ name: `${yy.user.globalName}` })
                    .setTitle(`Pagamento confirmado`)
                    .setDescription('🕔 Aguarde...')
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()

                await msg.edit({ embeds: [mandanopvdocara2], content: `` })








                const dsfjmsdfjnsdfj2 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`)
                    .setAuthor({ name: `Pedido #${payment.data.pagamentos.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                    .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                    )
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()

                try {
                    const member = await client.users.fetch(yy.user.id)
                    await member.send({ embeds: [dsfjmsdfjnsdfj2] })
                } catch (error) {

                }



                const status2 = (payment.data.pagamentos.id === 'Aprovado Manualmente') ? 'Aprovado Manualmente' : (res.data.status === 'ATIVA' ? 'CONCLUIDA' : bank);
                const dsfjmsdfjnsdfj222 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`)
                    .setAuthor({ name: `Pedido #${payment.data.pagamentos.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                    .setDescription(`Usuário <@!${yy.user.id}> efetuou o pagamento.`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `Banco`, value: `\`${status2}\`` }
                    )
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()


                const row222 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`refoundd_${payment.data.pagamentos.id}`)
                            .setLabel('Reembolsar')
                            .setStyle(2)
                            .setDisabled(res?.data?.status == 'CONCLUIDA' ? false : true)
                    );




                try {
                    const channela = await client.channels.fetch(lk.channelid);

                    const yuyu = await channela.messages.fetch(lk.idmsg)
                    yuyu.reply({ embeds: [dsfjmsdfjnsdfj222], components: [row222] }).then(aaaaa => {
                        carrinhos.set(`${payment.ID}.replys`, { channelid: aaaaa.channel.id, idmsg: aaaaa.id })
                    })
                } catch (error) {

                }

                CheckPosition(client)
                try {
                    if (configuracao.get('ConfigRoles.cargoCliente') !== null) {
                        await client.guilds.cache.get(yy.guild.id).members.fetch(yy.user.id).then(member => member.roles.add(configuracao.get('ConfigRoles.cargoCliente'))).catch(console.error);
                    }
                } catch (error) {

                }







                CheckPosition(client)








                threadChannel.setName(`🕔・${yy.user.username}・${yy.user.id}`);

            }
        } else if (method === 'card') {
            try {
                const preferenceId = payment.data.pagamentos.id;
                
                const searchResponse = await axios.get(`https://api.mercadopago.com/v1/payments/search`, {
                    headers: {
                        Authorization: `Bearer ${configuracao.get('pagamentos.MpAPI')}`
                    },
                    params: {
                        external_reference: payment.ID,
                        sort: 'date_created',
                        criteria: 'desc',
                        range: 'date_created',
                        begin_date: new Date(paymentDate - 60000).toISOString(),
                        end_date: new Date().toISOString()
                    }
                });

                const approvedPayment = searchResponse.data.results.find(p => p.status === 'approved');

                if (approvedPayment) {
                    pagamentos.delete(payment.ID);
                    const yy = await carrinhos.get(payment.ID);
                    const messages = await threadChannel.messages.fetch({ limit: 100 });
                    await threadChannel.bulkDelete(messages);

                    const msg = await threadChannel.send({ content: `${Emojis.get('loading')} Pagamento Aprovado! Iniciando Entrega..` });

                    let valor = 0;
                    const hhhh = produtos.get(`${yy.infos.produto}.Campos`);
                    const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo);

                    if (yy.cupomadicionado !== undefined) {
                        const valor2 = gggaaa.valor * yy.quantidadeselecionada;
                        const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`);
                        const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado);
                        valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
                    } else {
                        valor = gggaaa.valor * yy.quantidadeselecionada;
                    }

                    pedidos.set(payment.ID, { id: approvedPayment.id, method: method });

                    await msg.edit({ content: `${Emojis.get('loading')} Pagamento Aprovado, Aguarde um momento...`, embeds: [] });

                    const dsfjmsdfjnsdfj2 = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`)
                        .setAuthor({ name: `Pedido #${approvedPayment.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                        .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                        .addFields(
                            { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` }
                        )
                        .setFooter({ text: yy.guild.name, iconURL: yy.guild.iconURL })
                        .setTimestamp();

                    try {
                        const member = await client.users.fetch(yy.user.id);
                        await member.send({ embeds: [dsfjmsdfjnsdfj2] });
                    } catch (error) {
                        console.error(`[CARD MP] - ERRO ao enviar DM:`, error);
                    }

                    const paymentMethod = approvedPayment.payment_method_id || 'Cartão';
                    const dsfjmsdfjnsdfj222 = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`)
                        .setAuthor({ name: `Pedido #${approvedPayment.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                        .setDescription(`Usuário <@!${yy.user.id}> efetuou o pagamento.`)
                        .addFields(
                            { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                            { name: `**Método de Pagamento**`, value: `\`${paymentMethod}\`` }
                        )
                        .setFooter({ text: yy.guild.name, iconURL: yy.guild.iconURL })
                        .setTimestamp();

                    try {
                        const lk = carrinhos.get(`${payment.ID}.replys`);
                        const channela = await client.channels.fetch(lk.channelid);
                        const yuyu = await channela.messages.fetch(lk.idmsg);
                        yuyu.edit({ embeds: [dsfjmsdfjnsdfj222] });
                    } catch (error) {
                        console.error(`[CARD MP] - ERRO ao atualizar log:`, error);
                    }

                    await CheckPosition(client, payment.ID, msg);
                    threadChannel.setName(`🕔・${yy.user.username}・${yy.user.id}`);
                }
            } catch (error) {
                console.error(`[CARD MP] - Erro ao verificar pagamento:`, error);
            }
        } else if (method !== 'imap' && method !== 'misticpay' && method !== 'efibank' && method !== 'card') {
            console.log(`Unknown payment method: ${method}`);
        }
        
        if (method === 'efibank') {
            try {
                console.log(`[EFI BANK] Verificando pagamento ${payment.data.pagamentos.id}...`);
                
                let res;
                if (payment.data.pagamentos.id !== `Aprovado Manualmente`) {
                    const certificado = fs.readFileSync(`./Lib/${configuracao.get("pagamentos.certificado")}.p12`);
                    const httpsAgent = new https.Agent({ pfx: certificado, passphrase: "" });
                    
                    const data_credentials = configuracao.get(`pagamentos.secret_id`) + ":" + configuracao.get(`pagamentos.secret_token`);
                    const auth = Buffer.from(data_credentials).toString("base64");
                    
                    const tokenRes = await axios.post("https://pix.api.efipay.com.br/oauth/token", 
                        { grant_type: "client_credentials" },
                        { 
                            headers: { Authorization: "Basic " + auth, "Content-Type": "application/json" }, 
                            httpsAgent,
                            timeout: 10000
                        }
                    );
                    
                    res = await axios.get(`https://pix.api.efipay.com.br/v2/cob/${payment.data.pagamentos.id}`, {
                        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
                        httpsAgent,
                        timeout: 10000
                    });
                    
                    console.log(`[EFI BANK] Status: ${res.data.status}`);
                }

                if (res?.data.status === 'CONCLUIDA' || payment.data.pagamentos.id === `Aprovado Manualmente`) {
                    console.log(`[EFI BANK] Pagamento aprovado! Processando...`);
                    
                    pagamentos.delete(payment.ID);
                    const yy = await carrinhos.get(payment.ID);
                    
                    if (!yy) {
                        console.log(`[EFI BANK] Carrinho não encontrado para ${payment.ID}`);
                        return;
                    }
                    
                    const messages = await threadChannel.messages.fetch({ limit: 100 });
                    await threadChannel.bulkDelete(messages);

                    const msg = await threadChannel.send({ content: `${Emojis.get('loading')} Pagamento Aprovado! Iniciando Entrega..` });

                    let valor = 0;
                    const hhhh = produtos.get(`${yy.infos.produto}.Campos`);
                    const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo);

                    if (yy.cupomadicionado !== undefined) {
                        const valor2 = gggaaa.valor * yy.quantidadeselecionada;
                        const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`);
                        const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado);
                        valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
                    } else {
                        valor = gggaaa.valor * yy.quantidadeselecionada;
                    }

                    let bankCliente = 'Pix';
                    
                    if (res?.data?.pix && res.data.pix.length > 0) {
                        const pixInfo = res.data.pix[0];
                        
                        const instituicoesISPB = {
                            '00000000': 'Banco Central do Brasil',
                            '00360305': 'Caixa Econômica Federal',
                            '00416968': 'Banco Inter S.A.',
                            '04902979': 'Banco da Amazônia S.A.',
                            '07237373': 'Banco do Estado do Pará S.A.',
                            '09089356': 'Banco Mercantil do Brasil S.A.',
                            '10664513': 'Banco Agibank S.A.',
                            '10866788': 'Banco do Estado do Espírito Santo S.A.',
                            '11703662': 'Banco Votorantim S.A.',
                            '13009717': 'Banco do Estado do Rio Grande do Sul S.A.',
                            '13059145': 'Banco do Estado de Sergipe S.A.',
                            '13140088': 'Banco Cooperativo Sicredi S.A.',
                            '15114366': 'Banco Cooperativo Sicoob',
                            '16501555': 'Stone Pagamentos S.A.',
                            '17184037': 'Banco Mercantil do Brasil S.A.',
                            '17298092': 'Banco Itaú BBA S.A.',
                            '18236120': 'Banco BS2 S.A.',
                            '19307785': 'Banco Next',
                            '20155248': 'Banco Bradesco BERJ S.A.',
                            '22896431': 'PicPay Serviços S.A.',
                            '23862762': 'Will Bank',
                            '26563270': 'Stone Pagamentos S.A.',
                            '27098060': 'Banco Afinz S.A.',
                            '27351731': 'Banco Genial',
                            '28127603': 'Banco Banrisul S.A.',
                            '28195667': 'Banco ABC Brasil S.A.',
                            '30306294': 'Banco BTG Pactual S.A.',
                            '31597552': 'Banco C6 S.A.',
                            '31880826': 'Banco Original S.A.',
                            '32062580': 'Banco Santander Brasil S.A.',
                            '33042151': 'Banco Citibank S.A.',
                            '33132044': 'Banco Bradesco Cartões S.A.',
                            '33172537': 'Banco J.P. Morgan S.A.',
                            '33479023': 'Banco Mercedes-Benz do Brasil S.A.',
                            '33644196': 'Banco Fator S.A.',
                            '33657248': 'Banco Olé Consignado S.A.',
                            '33862244': 'Banco Safra S.A.',
                            '36113876': 'Banco Sofisa S.A.',
                            '60394079': 'Banco Itaú Unibanco S.A.',
                            '60498557': 'Banco Itaú Unibanco S.A.',
                            '60701190': 'Itaú Unibanco S.A.',
                            '60746948': 'Banco Bradesco S.A.',
                            '60850229': 'Nu Pagamentos S.A. (Nubank)',
                            '60872504': 'Banco do Brasil S.A.',
                            '62144175': 'PagSeguro Internet S.A.',
                            '62169875': 'Neon Pagamentos S.A.',
                            '71027866': 'Banco BS2 S.A.',
                            '90400888': 'Banco do Brasil S.A.',
                            '92894922': 'Banco Original S.A.',
                            '09516419': 'Banco Inter S.A.',
                            '00806535': 'Pluxee Brasil Serviços de Benefícios e Incentivos Ltda',
                            '01027058': 'Cielo S.A.',
                            '01181521': 'Mercado Pago - Instituição de Pagamento Ltda.',
                            '02318507': 'Ame Digital Brasil Ltda.',
                            '04632856': 'Getnet Adquirência e Serviços para Meios de Pagamento S.A.',
                            '05351887': 'Pagseguro Internet S.A.',
                            '07679404': 'Banco do Brasil S.A.',
                            '08253539': 'Itaú Unibanco S.A.',
                            '09105360': 'Banco Bradesco S.A.',
                            '10573521': 'Stone Pagamentos S.A.',
                            '11581339': 'Banco Inter S.A.',
                            '13370835': 'PicPay Serviços S.A.',
                            '14388334': 'Pagseguro Internet S.A.',
                            '16501555': 'Stone Pagamentos S.A.',
                            '18520834': 'Banco BS2 S.A.',
                            '19540550': 'Banco C6 S.A.',
                            '20855875': 'Banco Original S.A.',
                            '22610500': 'Banco Safra S.A.',
                            '23522214': 'Banco BTG Pactual S.A.',
                            '26264220': 'Nu Pagamentos S.A. (Nubank)',
                            '28650236': 'Banco Santander Brasil S.A.',
                            '30723886': 'Caixa Econômica Federal',
                            '32062580': 'Banco Santander Brasil S.A.',
                            '37880206': 'CloudWalk Instituição de Pagamentos e Serviços Ltda',
                            '40303299': 'Zoop Tecnologia e Meios de Pagamento S.A.',
                            '49336860': 'Dock Soluções em Pagamentos S.A.',
                            '58497702': 'Banco Neon S.A.'
                        };
                        
                        const endToEndId = pixInfo?.endToEndId || '';
                        if (endToEndId && endToEndId.startsWith('E')) {
                            const ispb = endToEndId.substring(1, 9);
                            if (instituicoesISPB[ispb]) {
                                bankCliente = instituicoesISPB[ispb];
                            } else {
                                bankCliente = `Instituição ISPB: ${ispb}`;
                            }
                        }
                        
                        if (bankCliente === 'Pix' || bankCliente.startsWith('Instituição ISPB:')) {
                            if (pixInfo?.pagador?.nome) {
                                bankCliente = pixInfo.pagador.nome;
                            } else if (pixInfo?.infoPagador) {
                                bankCliente = pixInfo.infoPagador;
                            }
                        }
                        
                        console.log('[EFI BANK] EndToEndId:', endToEndId);
                        console.log('[EFI BANK] Instituição do cliente identificada:', bankCliente);
                    }

                    pedidos.set(payment.ID, { id: payment.data.pagamentos.id, method: method });

                    await msg.edit({ content: `${Emojis.get('loading')} Pagamento Aprovado, Aguarde um momento...`, embeds: [] });

                    const dsfjmsdfjnsdfj2 = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`)
                        .setAuthor({ name: `Pedido #${payment.data.pagamentos.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                        .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                        .addFields(
                            { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` }
                        )
                        .setFooter({ text: yy.guild.name, iconURL: yy.guild.iconURL })
                        .setTimestamp();

                    try {
                        const member = await client.users.fetch(yy.user.id);
                        await member.send({ embeds: [dsfjmsdfjnsdfj2] });
                    } catch (error) {
                        console.error(`[EFI BANK] Erro ao enviar DM:`, error);
                    }

                    const row222 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`refoundd_${payment.data.pagamentos.id}`)
                                .setLabel('Reembolsar')
                                .setStyle(2)
                                .setDisabled(payment.data.pagamentos.id === 'Aprovado Manualmente')
                        );

                    const embedAprovado = new EmbedBuilder()
                        .setColor('#40fc04')
                        .setAuthor({ 
                            name: `Pedido #${payment.data.pagamentos.id}`, 
                            iconURL: 'https://cdn.discordapp.com/emojis/1249486723520397314.png' 
                        })
                        .setTitle('Pagamento Aprovado')
                        .setDescription(`O usuário <@${yy.user.id}> efetuou o pagamento com sucesso e a entrega foi iniciada.`)
                        .addFields({
                            name: 'Informações do Pagamento',
                            value: `- **Valor Pago:** \`R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`\n- **Data:** <t:${Math.floor(Date.now() / 1000)}:F>\n- **Banco do Cliente:** \`${bankCliente}\`\n- **Status do Pedido:** \`Aprovado\`\n- **Produto:** \`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo}\``
                        })
                        .setFooter({ text: threadChannel.guild.name, iconURL: threadChannel.guild.iconURL() })
                        .setTimestamp();

                    try {
                        const lk = carrinhos.get(`${payment.ID}.replys`);
                        const channela = await client.channels.fetch(lk.channelid);
                        const yuyu = await channela.messages.fetch(lk.idmsg);
                        yuyu.reply({ embeds: [embedAprovado], components: [row222] });
                    } catch (error) {
                        console.error(`[EFI BANK] Erro ao atualizar log:`, error);
                    }

                    try {
                        if (configuracao.get('ConfigRoles.cargoCliente') !== null) {
                            await client.guilds.cache.get(yy.guild.id).members.fetch(yy.user.id).then(member => member.roles.add(configuracao.get('ConfigRoles.cargoCliente'))).catch(console.error);
                        }
                    } catch (error) {
                        console.error(`[EFI BANK] Erro ao dar cargo:`, error);
                    }

                    await CheckPosition(client, payment.ID, msg);
                    threadChannel.setName(`🕔・${yy.user.username}・${yy.user.id}`);
                    
                    console.log(`[EFI BANK] Pagamento processado com sucesso!`);
                }
            } catch (error) {
                console.error(`[EFI BANK] Erro ao verificar pagamento:`, error.response?.data || error.message);
            }
        }
    }
}




module.exports = {
    VerificarPagamento
}







