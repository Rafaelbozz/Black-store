const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require("discord.js")
const { pedidos, carrinhos, produtos, configuracao, estatisticas, Emojis } = require("../DataBaseJson")
const { UpdateMessageProduto } = require("./SenderMessagesOrUpdates")
const { CheckPosition } = require("./PosicoesFunction")
const { ReembolsoAutomatico } = require("./ReembolsoAutomatico")

async function EntregarPagamentos(client) {

    const yy22 = pedidos.fetchAll()

    for (const entrega of yy22) {
        pedidos.delete(entrega.ID)
        let autoentrega
        const yy = carrinhos.get(entrega.ID)
        if (yy == null) continue

        const yyaa = produtos.get(yy.infos.produto)


        if (yyaa.Config.entrega == 'Sim') {
            autoentrega = true
        } else {
            autoentrega = false
        }

        let valor222 = 0
        const hhhh2121 = produtos.get(`${yy.infos.produto}.Campos`)
        const gggaaaae = hhhh2121.find(campo22 => campo22.Nome === yy.infos.campo)

        if (!gggaaaae || !gggaaaae.estoque || gggaaaae.estoque.length < yy.quantidadeselecionada) {
            console.log(`⚠️ ESTOQUE INSUFICIENTE - Produto: ${yy.infos.produto}, Campo: ${yy.infos.campo}, Necessário: ${yy.quantidadeselecionada}, Disponível: ${gggaaaae?.estoque?.length || 0}`);
            
            if (yy.cupomadicionado !== undefined) {
                const valor2 = gggaaaae.valor * yy.quantidadeselecionada
                const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`)
                const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado)
                valor222 = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
            } else {
                valor222 = gggaaaae.valor * yy.quantidadeselecionada
            }

            await ReembolsoAutomatico({
                client,
                entrega,
                yy,
                valor: valor222,
                motivo: 'Estoque Insuficiente',
                estoqueDisponivel: gggaaaae?.estoque?.length || 0
            });

            carrinhos.delete(entrega.ID);
            
            continue;
        }


        if (yy.cupomadicionado !== undefined) {
            const valor2 = gggaaaae.valor * yy.quantidadeselecionada

            const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`)
            const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado)
            valor222 = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
        } else {
            valor222 = gggaaaae.valor * yy.quantidadeselecionada
        }

        function gerarUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        try {
            const channelaa = await client.channels.fetch(configuracao.get(`ConfigChannels.feedback`));
            channelaa.send({ content: `<@!${yy.user.id}>` }).then(msg => {
                setTimeout(async () => {
                    try {
                        await msg.delete();
                    } catch (error) {
                    }
                }, 5000);
            })
        } catch (error) {

        }


        await estatisticas.set(`${gerarUUID()}`, { produto: yy.infos.produto, campo: yy.infos.campo, quantidade: Number(yy.quantidadeselecionada), valor: Number(valor222), cupomaplicado: yy.cupomadicionado, data: Date.now(), guild: yy.guild.id, userid: yy.user.id, id: entrega.ID, idpagamento: entrega.data.id })

        CheckPosition(client)



        if (autoentrega == true) {



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


            const removedProducts = [];
            const removedIndices = [];
            for (let i = 0; i < yy.quantidadeselecionada; i++) {
                removedProducts.push(gggaaa.estoque[i]);
                removedIndices.push(i);
            }
            gggaaa.estoque.splice(0, yy.quantidadeselecionada);
            await produtos.set(`${yy.infos.produto}.Campos`, hhhh)
            UpdateMessageProduto(client, yy.infos.produto)




            const fileContent = removedProducts.join('\n');
            const attachment = new AttachmentBuilder(fileContent, { name: `${entrega.data.id}.txt` }, { type: 'text/plain' });












            const dsfjmsdfjnsdfj2 = new EmbedBuilder()
                .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#7464ff` : configuracao.get(`Cores.Sucesso`)}`)
                .setAuthor({ name: `Pedido #${entrega.data.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                .setDescription(`Seu produto foi anexado a essa mensagem`)
                .addFields(
                    { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },

                )
                .setFooter(
                    { text: yy.guild.name, iconURL: yy.guild.iconURL }
                )
                .setTimestamp()

                const row4 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`foraestoquealarme_${yy.infos.produto}_${yy.infos.campo}_1`)
                        .setLabel('Avisar atualizações de estoque')
                        .setEmoji(`${Emojis.get(`_notify_emoji`)}`)
                        .setStyle(1)
                );

                const row5 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`copiarprodutos_${entrega.data.id}`)
                        .setLabel('Copiar produto entregue')
                        .setEmoji(`${Emojis.get(`_mail_emoji`)}`)
                        .setStyle(1)
                );
                

            const yyaa = produtos.get(yy.infos.produto)
            const row6 = new ActionRowBuilder();
            if (yyaa && yyaa.mensagens && yyaa.mensagens[0]) {
                const { guildid, channelid, mesageid } = yyaa.mensagens[0];

                const buttonBuilder = new ButtonBuilder()
                    .setURL(`https://discord.com/channels/${guildid}/${channelid}/${mesageid}`)
                    .setLabel('Comprar novamente')
                    .setStyle(5);

                row6.addComponents(buttonBuilder);
            }

            try {
                const member = await client.users.fetch(yy.user.id);
                const guild = await client.guilds.fetch(yy.guild.id);
                
                const produtoAtualizado = produtos.get(yy.infos.produto);
                const camposAtualizados = produtos.get(`${yy.infos.produto}.Campos`);
                const campoAtualizado = camposAtualizados?.find(c => c.Nome === yy.infos.campo);
                
                const nomeProduto = produtoAtualizado?.Config?.nome || yy.infos.produto;
                const nomeCampo = campoAtualizado?.Nome || yy.infos.campo;
                
                const embedCompraAprovada = new EmbedBuilder()
                    .setAuthor({ 
                        name: 'Compra Aprovada', 
                        iconURL: 'https://cdn.discordapp.com/emojis/1442272956762951711.png?size=2048' 
                    })
                    .setDescription(`O usuário <@${yy.user.id}> teve seu pedido entregue com sucesso`)
                    .setThumbnail(member.displayAvatarURL({ extension: 'png', size: 256 }))
                    .addFields(
                        { 
                            name: 'Carrinho', 
                            value: `\`${yy.quantidadeselecionada}x ${nomeProduto} - ${nomeCampo}\``,
                            inline: false
                        },
                        { 
                            name: 'Valor Pago', 
                            value: `\`R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``,
                            inline: false
                        }
                    )
                    .setFooter({ 
                        text: yy.guild.name, 
                        iconURL: guild.iconURL({ extension: 'png', size: 128 }) 
                    })
                    .setTimestamp()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#00d969` : configuracao.get(`Cores.Sucesso`)}`);

                const row7 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setURL(`https://discord.com/channels/${yyaa.mensagens[0].guildid}/${yyaa.mensagens[0].channelid}/${yyaa.mensagens[0].mesageid}`)
                            .setLabel('Comprar Tambem')
                            .setEmoji('1462646805094465731')
                            .setStyle(5),
                        new ButtonBuilder()
                            .setURL(`https://discord.com/channels/${yy.guild.id}/${configuracao.get(`ConfigChannels.feedback`)}`)
                            .setLabel('Ver Feedbacks')
                            .setEmoji('1384035225146888263')
                            .setStyle(5)
                    );

                const channelaa = await client.channels.fetch(configuracao.get(`ConfigChannels.eventbuy`));

                await channelaa.send({ 
                    content: ``,
                    embeds: [embedCompraAprovada], 
                    components: [row7] 
                });

            } catch (error) {
                console.error('Erro ao enviar embed de compra aprovada:', error);
            }


function tempo24(tempo) {
    const regex = /^(\d+)(S|M|H)$/i;
    const match = regex.exec(tempo);
    if (!match) return null;

    const quantidade = parseInt(match[1], 10);
    const unidade = match[2].toUpperCase();

    switch (unidade) {
        case 'S':
            return quantidade * 1000;
        case 'M':
            return quantidade * 60 * 1000;
        case 'H':
            return quantidade * 60 * 60 * 1000;
        default:
            return null;
    }
}

try {
    if (gggaaa.roleadd !== undefined) {
        await client.guilds.cache.get(yy.guild.id).members.fetch(yy.user.id)
            .then(member => member.roles.add(gggaaa.roleadd))
            .catch(console.error);
    }
} catch (error) {
    console.error('Erro ao adicionar cargo:', error);
}

try {
    if (gggaaa.rolerem !== undefined) {
        await client.guilds.cache.get(yy.guild.id).members.fetch(yy.user.id)
            .then(member => member.roles.remove(gggaaa.rolerem))
            .catch(console.error);
    }
} catch (error) {
    console.error('Erro ao remover cargo:', error);
}

if (gggaaa.temprole24) {
    const tempoEmMilissegundos = tempo24(gggaaa.temprole24);

    if (tempoEmMilissegundos !== null) {
        setTimeout(async () => {
            try {
                if (gggaaa.roleadd !== undefined) {
                    await client.guilds.cache.get(yy.guild.id).members.fetch(yy.user.id)
                        .then(member => member.roles.remove(gggaaa.roleadd))
                        .catch(console.error);
                }
            } catch (error) {
                console.error('Erro ao remover cargo após o tempo:', error);
            }
        }, tempoEmMilissegundos);
    } else {
        console.error('Formato de tempo inválido:', gggaaa.temprole24);
    }
}


            const member = await client.users.fetch(yy.user.id)
            try {
                if (yy.quantidadeselecionada > 5) {
                    await member.send({
                        files: [{
                            name: `${entrega.data.id}.txt`,
                            attachment: Buffer.from(fileContent, 'utf-8'),
                        }], components: [row4, row5, row6], embeds: [dsfjmsdfjnsdfj2]
                    }).then(async aaaa => {

                        let threadChannel = await client.channels.fetch(entrega.ID);
                        const messages = await threadChannel.messages.fetch({ limit: 100 });
                        await threadChannel.bulkDelete(messages);

                        const umMinutoEmMilissegundos = 2 * 60 * 1000;
                        const timeStamp = Date.now() + umMinutoEmMilissegundos;

                        const row6 = new ActionRowBuilder()
                            .addComponents(

                                new ButtonBuilder()
                                    .setURL(aaaa.url)
                                    .setLabel('Ir para o pedido entregue')
                                    .setStyle(5),
                            )


                        await threadChannel.send({ components: [row6], content: `${Emojis.get(`caixagrande`)} Entrega realizada! Verifique seu privado, esse carrinho será excluído <t:${Math.ceil(timeStamp / 1000)}:R>` }).then(deletemsg => {

                            setInterval(async () => {
                                try {
                                    await threadChannel.delete()
                                } catch (error) {

                                }

                            }, 120000);
                        })



                        threadChannel.setName(`✅・${yy.user.username}・${yy.user.id}`);
                    })
                } else if (yy.quantidadeselecionada <= 5) {
                    const Entrega = configuracao.get(`Emojis_EntregAbaixo`)
                    let msg2 = ``

                    if (Entrega !== null) {
                        Entrega.sort((a, b) => {
                            const numA = parseInt(a.name.replace('eb', ''), 10);
                            const numB = parseInt(b.name.replace('eb', ''), 10);
                            return numA - numB;
                        });

                        Entrega.forEach(element => {
                            console.log(element.name)
                            msg2 += `<:${element.name}:${element.id}>`
                        });
                    }

                    dsfjmsdfjnsdfj2.setFields(
                        { name: `**Carrinho**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo}\`` },
                        { name: `**Valor pago**`, value: `\`R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `Segue abaixo seus produtos:`, value: `${fileContent}` },
                    )

                    dsfjmsdfjnsdfj2.setThumbnail(`${yy.guild.iconURL}`)


                    await member.send({
                        components: [row4, row5, row6], embeds: [dsfjmsdfjnsdfj2]
                    }).then(async aaaa => {

                        let threadChannel = await client.channels.fetch(entrega.ID);
                        const messages = await threadChannel.messages.fetch({ limit: 100 });
                        await threadChannel.bulkDelete(messages);

                        const umMinutoEmMilissegundos = 2 * 60 * 1000;
                        const timeStamp = Date.now() + umMinutoEmMilissegundos;

                        const row6 = new ActionRowBuilder()
                            .addComponents(

                                new ButtonBuilder()
                                    .setURL(aaaa.url)
                                    .setLabel('Ir para o pedido entregue')
                                    .setStyle(5),
                            )


                        await threadChannel.send({ components: [row6], content: `Entrega realizada! Verifique seu privado, esse carrinho será excluído <t:${Math.ceil(timeStamp / 1000)}:R>` }).then(deletemsg => {

                            setInterval(async () => {
                                try {
                                    await threadChannel.delete()
                                } catch (error) {

                                }

                            }, 120000);
                        })



                        threadChannel.setName(`✅・${yy.user.username}・${yy.user.id}`);
                    })
                }


                try {
                    setTimeout(async () => {
                        const dd = configuracao.get(`ConfigChannels.feedback`)
                        if (dd !== null) {
                            const row6aa = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setURL(`https://discord.com/channels/${yy.guild.id}/${dd}`)
                                        .setLabel('Clique aqui e deixe seu feedback ;)')
                                        .setStyle(5),
                                )
                            await member.send({ components: [row6aa], content: `Ola sr, <@!${member.id}>, esperamos que esteja aproveitando sua compra! Se ainda não deu seu feedback, gostaríamos muito de saber o que achou!` })
                        }
                    }, 60000);
                } catch (error) {

                }







            } catch (error) {

                let threadChannel = await client.channels.fetch(entrega.ID);
                const messages = await threadChannel.messages.fetch({ limit: 100 });
                await threadChannel.bulkDelete(messages);


                const embedddd = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#7464fc` : configuracao.get(`Cores.Sucesso`)}`)
                    .setAuthor({ name: `Pedido #${entrega.data.id}` })
                    .setTitle(`🛒 Entrega realizada!`)
                    .setDescription(`Seu pedido foi anexado a essa mensagem.`)
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                    )



                if (yy.quantidadeselecionada <= 5) {
                    const Entrega = configuracao.get(`Emojis_EntregAbaixo`)
                    let msg2 = ``
                    if (Entrega !== null) {
                        Entrega.sort((a, b) => {
                            const numA = parseInt(a.name.replace('eb', ''), 10);
                            const numB = parseInt(b.name.replace('eb', ''), 10);
                            return numA - numB;
                        });

                        Entrega.forEach(element => {
                            console.log(element.name)
                            msg2 += `<:${element.name}:${element.id}>`
                        });
                    }
                    embedddd.setFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `${msg2 !== '' ? msg2 : 'Segue abaixo seus produtos:'}`, value: `${fileContent}` },
                    )
                }



                await threadChannel.send({
                    embeds: [embedddd], content: `<@${yy.user.id}> Não foi possível enviar seu pedido na sua DM, então ele foi anexado abaixo, esse ticket será excluído`
                })

                if (yy.quantidadeselecionada > 5) {
                    await threadChannel.send({
                        files: [{
                            name: `${entrega.data.id}.txt`,
                            attachment: Buffer.from(fileContent, 'utf-8'),
                        }]
                    })
                }

                threadChannel.setName(`✅・${yy.user.username}・${yy.user.id}`);

                setInterval(async () => {
                    try {
                        await threadChannel.delete()
                    } catch (error) {

                    }

                }, 120000);

            }





            try {
                const lk = carrinhos.get(`${entrega.ID}.replys`)
                const channela = await client.channels.fetch(lk.channelid);
                const yuyu = await channela.messages.fetch(lk.idmsg)
                const row3 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`editestoque_${yy.infos.produto}_${yy.infos.campo}`)
                            .setLabel('Editar estoque')
                            .setStyle(1),
                    )


                yuyu.reply({
                    files: [{
                        name: `${entrega.data.id}.txt`,
                        attachment: Buffer.from(fileContent, 'utf-8'),
                    }],

                    embeds: [
                        new EmbedBuilder()
                            .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#7464fc` : configuracao.get(`Cores.Sucesso`)}`)
                            .setAuthor({ name: `Pedido #${entrega.data.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                            .setDescription(`Usuário <@!${yy.user.id}> teve seu pedido entregue.`)
                            .addFields(
                                { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                            )
                            .setFooter(
                                { text: yy.guild.name, iconURL: yy.guild.iconURL }
                            )
                            .setTimestamp()
                    ], components: [
                        row3
                    ]

                })

            } catch (error) {

            }


        }
        if (autoentrega == false) {


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


            const removedProducts = [];
            const removedIndices = [];
            for (let i = 0; i < yy.quantidadeselecionada; i++) {
                removedProducts.push(gggaaa.estoque[i]);
                removedIndices.push(i);
            }
            gggaaa.estoque.splice(0, yy.quantidadeselecionada);
            await produtos.set(`${yy.infos.produto}.Campos`, hhhh)
            await UpdateMessageProduto(client, yy.infos.produto)




            const fileContent = removedProducts.join('\n');
            const attachment = new AttachmentBuilder(fileContent, { name: `${entrega.data.id}.txt` }, { type: 'text/plain' });


            let threadChannel = await client.channels.fetch(entrega.ID);
            const messages = await threadChannel.messages.fetch({ limit: 100 });
            await threadChannel.bulkDelete(messages);




            const embed = new EmbedBuilder()
                .setAuthor({ name: `${yy.user.username} | Pedido: #${entrega.data.id}` })
                .setTitle(`Informação do pedido.`)
                .setColor(`${configuracao.get(`Cores.Principal`) == null ? `#008000` : configuracao.get(`Cores.Principal`)}`)
                .setFields(
                    { name: 'Detalhes:', value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                    { name: 'Status:', value: `Pagamento confirmado, aguardando entrega` }
                )
                .setFooter(
                    { text: yy.guild.name, iconURL: yy.guild.iconURL }
                )
                .setTimestamp()

            threadChannel.send({ content: `<@${yy.user.id}> Aguarde a entrega, ela será realizada nesse mesmo canal`, embeds: [embed] })



            threadChannel.setName(`🕔・${yy.user.username}・${yy.user.id}`);


            try {
                const lk = carrinhos.get(`${entrega.ID}.replys`)
                const channela = await client.channels.fetch(lk.channelid);
                const yuyu = await channela.messages.fetch(lk.idmsg)
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${yy.user.username} | Pedido: #${entrega.data.id}` })
                    .setTitle(`Informação do pedido.`)
                    .setColor(`${configuracao.get(`Cores.Principal`) == null ? `#008000` : configuracao.get(`Cores.Principal`)}`)
                    .setFields(
                        { name: 'Detalhes:', value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: 'Status:', value: `Pagamento confirmado, aguardando entrega` },
                        { name: 'Cupom:', value: `Teste`, inline: true },
                        { name: 'UserID:', value: `${yy.user.id}`, inline: true }
                    )
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()

                yuyu.reply({
                    embeds: [embed], files: [{
                        name: `${entrega.data.id}.txt`,
                        attachment: Buffer.from(fileContent, 'utf-8'),
                    }],
                })
            } catch (error) {

            }

        }





    }




}


module.exports = {
    EntregarPagamentos
}







