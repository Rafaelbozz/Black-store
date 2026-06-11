const { ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js")
const { Emojis } = require("../DataBaseJson")
const { JsonDatabase } = require("wio.db");

const robuxConfig = new JsonDatabase({
    databasePath: "./DataBaseJson/configuracaorobux.json"
});

const carrinhosRobux = new JsonDatabase({
    databasePath: "./DataBaseJson/carrinhosrobux.json"
});

async function getRobloxUser(username) {
    try {
        const response = await fetch(`https://users.roblox.com/v1/usernames/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
        });
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const user = data.data[0];
            const avatarResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png`);
            const avatarData = await avatarResponse.json();
            const avatarUrl = avatarData.data?.[0]?.imageUrl || null;
            
            return {
                id: user.id,
                name: user.name,
                displayName: user.displayName,
                avatar: avatarUrl
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar usuário Roblox:', error);
        return null;
    }
}

async function getUserGamepasses(userId) {
    try {
        let allGamepasses = [];
        const minimoGamepass = parseInt(robuxConfig.get(`config.limites.minimoGamepass`)) || 0;
        const limiteGamepass = parseInt(robuxConfig.get(`config.limites.gamepass`)) || 1000000;
        
        const gamesResponse = await fetch(`https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`);
        const gamesData = await gamesResponse.json();
        
        if (!gamesData.data || gamesData.data.length === 0) {
            return [];
        }
        
        for (const game of gamesData.data) {
            const placeId = game.rootPlace?.id;
            
            if (!placeId) {
                continue;
            }
            
            try {
                const universeResponse = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
                const universeData = await universeResponse.json();
                
                const universeId = universeData.universeId;
                if (!universeId) {
                    continue;
                }
                
                const gamepassUrl = `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full`;
                const gamepassResponse = await fetch(gamepassUrl);
                const gamepassData = await gamepassResponse.json();
                
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
            }
        }
        
        return allGamepasses;
        
    } catch (error) {
        return [];
    }
}

async function criarCarrinhoRobux(interaction, tipo, client) {
    const statusRobux = robuxConfig.get(`config.status`) || false;
    const statusGamepass = robuxConfig.get(`config.statusGamepass`) || false;

    if (tipo === 'comprar_robux' && !statusRobux) {
        return interaction.reply({ 
            content: `${Emojis.get('negative') || '❌'} | O sistema de **Robux** está desativado no momento!`, 
            ephemeral: true 
        });
    }

    if (tipo === 'comprar_gamepass' && !statusGamepass) {
        return interaction.reply({ 
            content: `${Emojis.get('negative') || '❌'} | O sistema de **Gamepass** está desativado no momento!`, 
            ephemeral: true 
        });
    }

    const carrinhoExistente = carrinhosRobux.get(`${interaction.user.id}`);
    if (carrinhoExistente) {
        const canalExistente = interaction.guild.channels.cache.get(carrinhoExistente.channelId);
        if (canalExistente) {
            return interaction.reply({ 
                content: `${Emojis.get('negative') || '❌'} | Você já possui um carrinho aberto em <#${carrinhoExistente.channelId}>!`, 
                ephemeral: true 
            });
        } else {
            carrinhosRobux.delete(`${interaction.user.id}`);
        }
    }

    await interaction.deferReply({ ephemeral: true });

    await interaction.editReply({ 
        content: `${Emojis.get('loading') || '⏳'} | Aguarde, **Verificando Informações...**` 
    });

    await new Promise(resolve => setTimeout(resolve, 800));

    await interaction.editReply({ 
        content: `${Emojis.get('loading') || '⏳'} | Aguarde, **Verificando Ambiente...**` 
    });

    await new Promise(resolve => setTimeout(resolve, 800));

    await interaction.editReply({ 
        content: `${Emojis.get('loading') || '⏳'} | Aguarde, **Criando Carrinho...**` 
    });

    try {
        const categoriaId = robuxConfig.get(`config.canais.categoriaCarrinhos`);
        const tipoCompra = tipo === 'comprar_robux' ? 'robux' : 'gamepass';
        
        const channel = await interaction.guild.channels.create({
            name: `🛒・${interaction.user.username}・${tipoCompra}`,
            type: ChannelType.GuildText,
            parent: categoriaId || null,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                },
                {
                    id: client.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
                }
            ]
        });

        const embedCentral = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setTitle('Central de Vendas')
            .setDescription(`<@${interaction.user.id}>, seja muito bem-vindo ao seu carrinho de compras!\n\n> • Para continuar a compra, clique em **"Iniciar Compra"**\n> • Para cancelar a compra, clique em **"Cancelar Compra"**`)
            .addFields({
                name: '\u200B',
                value: '```Ao iniciar a compra, você confirma estar ciente de todas as regras e termos do servidor.```'
            })
            .addFields({
                name: 'Nunca oferecemos nada por mensagens privadas.',
                value: 'Se receber qualquer mensagem do tipo, trate como golpe e denuncie!'
            })
            .setFooter({ text: `© ${new Date().getFullYear()} Todos os direitos reservados` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`robux_iniciar_compra_${tipoCompra}`)
                .setLabel('Iniciar compra')
                .setEmoji(`${Emojis.get('_confirm_emoji')}`)
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('robux_cancelar_compra')
                .setLabel('Cancelar Compra')
                .setEmoji(`${Emojis.get('_trash_emoji')}`)
                .setStyle(4),
            new ButtonBuilder()
                .setCustomId('robux_ajuda')
                .setLabel('Preciso de Ajuda')
                .setEmoji(`${Emojis.get('duvidasuporte')}`)
                .setStyle(2)
                .setDisabled(true)
        );

        const msg = await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embedCentral], components: [row] });

        carrinhosRobux.set(`${interaction.user.id}`, {
            channelId: channel.id,
            oderId: interaction.user.id,
            visão: tipoCompra,
            status: 'aguardando_nick',
            criadoEm: Date.now(),
            robloxUser: null,
            gamepassSelecionado: null,
            messageId: msg.id
        });

        await enviarLogCompra(interaction.guild, 'iniciadas', {
            usuario: interaction.user,
            tipo: tipoCompra,
            canal: channel,
            acao: 'Carrinho Criado'
        });

        const rowLink = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Ir para o Carrinho')
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
                .setEmoji(Emojis.get('_link_emoji') || '🔗')
                .setStyle(5)
        );

        await interaction.editReply({ 
            content: `${Emojis.get('checker') || '✅'} | Carrinho criado com sucesso!`,
            components: [rowLink]
        });

    } catch (error) {
        console.error('Erro ao criar carrinho:', error);
        await interaction.editReply({ 
            content: `${Emojis.get('negative') || '❌'} | Ocorreu um erro ao criar o carrinho!` 
        });
    }
}

async function modalNickRoblox(interaction, tipo) {
    const modal = new ModalBuilder()
        .setCustomId(`robux_modal_nick_${tipo}`)
        .setTitle('Informações do Roblox');

    const inputNick = new TextInputBuilder()
        .setCustomId('roblox_nick')
        .setLabel('Nick do Roblox')
        .setPlaceholder('Digite seu nick do Roblox')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

    modal.addComponents(new ActionRowBuilder().addComponents(inputNick));
    await interaction.showModal(modal);
}

async function handleModalNickRoblox(interaction, tipo) {
    const nick = interaction.fields.getTextInputValue('roblox_nick');
    
    const embedLoading = new EmbedBuilder()
        .setColor('#2b2d31')
        .setDescription(`${Emojis.get('loading') || '⏳'} **Buscando informações do usuário...**\n\nAguarde enquanto verificamos o nick **${nick}**.`);

    await interaction.update({ embeds: [embedLoading], components: [] });

    const robloxUser = await getRobloxUser(nick);
    
    if (!robloxUser) {
        const embedErro = new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription(`${Emojis.get('negative') || '❌'} | Usuário **${nick}** não encontrado no Roblox! Verifique o nick e tente novamente.`);
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`robux_iniciar_compra_${tipo}`)
                .setLabel('Tentar Novamente')
                .setEmoji(`${Emojis.get('_change_emoji')}`)
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('robux_cancelar_compra')
                .setLabel('Cancelar Compra')
                .setEmoji(`${Emojis.get('_trash_emoji')}`)
                .setStyle(4)
        );
        
        return interaction.editReply({ embeds: [embedErro], components: [row] });
    }

    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (carrinho) {
        carrinho.robloxUser = robloxUser;
        carrinho.status = 'usuario_verificado';
        carrinhosRobux.set(`${interaction.user.id}`, carrinho);
    }

    const embedLoadingGp = new EmbedBuilder()
        .setColor('#2b2d31')
        .setDescription(`${Emojis.get('loading') || '⏳'} **Buscando GamePasses...**\n\nAguarde enquanto verificamos as gamepasses de **${robloxUser.name}**.`);

    await interaction.editReply({ embeds: [embedLoadingGp], components: [] });

    const gamepasses = await getUserGamepasses(robloxUser.id);
    const minimoGamepass = robuxConfig.get(`config.limites.minimoGamepass`) || 0;
    const limiteGamepass = robuxConfig.get(`config.limites.gamepass`) || 1000000;

    if (gamepasses.length === 0) {
        await mostrarSemGamepass(interaction, robloxUser, minimoGamepass, limiteGamepass);
    } else {
        await mostrarGamepasses(interaction, robloxUser, gamepasses);
    }
}

async function mostrarSemGamepass(interaction, robloxUser, minimo, limite) {
    const embedUser = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('Informações do Usuário Roblox')
        .addFields(
            { name: 'Nome de Exibição', value: robloxUser.displayName, inline: true },
            { name: 'Nome de Usuário', value: robloxUser.name, inline: true }
        )
        .addFields(
            { name: 'ID do Usuário', value: `${robloxUser.id}`, inline: false }
        );

    if (robloxUser.avatar) {
        embedUser.setThumbnail(robloxUser.avatar);
    }

    const embedNoGamepass = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('Nenhum GamePass Encontrado')
        .setDescription(`O usuário **${robloxUser.name}** não possui nenhum GamePass à venda dentro do valor aceito (entre ${minimo} e ${limite} Robux).`)
        .addFields(
            { name: 'Como Criar um GamePass', value: `> 1. Acesse o site do [Roblox](https://www.roblox.com)\n> 2. Vá até "Experiências" e selecione o jogo\n> 3. Clique em "Passes", crie um novo e ative a venda` }
        )
        .setFooter({ text: 'Clique em Atualizar Lista após criar.' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('robux_atualizar_gamepass')
            .setLabel('Atualizar Lista')
            .setEmoji(`${Emojis.get('_change_emoji')}`)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('robux_cancelar_compra')
            .setLabel('Cancelar Compra')
            .setEmoji(`${Emojis.get('_trash_emoji')}`)
            .setStyle(4),
        new ButtonBuilder()
            .setCustomId('robux_ajuda')
            .setLabel('Preciso de Ajuda')
            .setEmoji(`${Emojis.get('duvidasuporte')}`)
            .setStyle(2)
            .setDisabled(true)
    );

    await interaction.editReply({ content: null, embeds: [embedUser, embedNoGamepass], components: [row] });
}

async function mostrarGamepasses(interaction, robloxUser, gamepasses) {
    const valorGamepass = parseFloat(robuxConfig.get(`config.valores.gamepass`)) || 0;
    
    const embedUser = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('Informações do Usuário Roblox')
        .addFields(
            { name: 'Nome de Exibição', value: robloxUser.displayName, inline: true },
            { name: 'Nome de Usuário', value: robloxUser.name, inline: true }
        )
        .addFields(
            { name: 'ID do Usuário', value: `${robloxUser.id}`, inline: false }
        );

    if (robloxUser.avatar) {
        embedUser.setThumbnail(robloxUser.avatar);
    }

    const embedGamepasses = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle(`GamePasses Disponíveis`)
        .setDescription(`${Emojis.get('checker') || '✅'} Foram encontradas **${gamepasses.length} GamePass(es)** no seu perfil!\n\nAgora escolha abaixo a quantidade de Robux que você irá querer. Caso queira outra quantidade, crie uma GamePass nova e clique em **Atualizar Lista**.`)
        .addFields(
            { name: `${Emojis.get('dinheiro') || '💰'} Valor`, value: `\`R$ ${valorGamepass}\` a cada 1000 Robux`, inline: false }
        )
        .setFooter({ text: 'Selecione um GamePass abaixo para continuar a compra.' });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('robux_select_gamepass')
        .setPlaceholder('Selecione a quantidade de Robux')
        .addOptions(
            gamepasses.slice(0, 25).map(gp => {
                const valorReais = ((gp.price / 1000) * valorGamepass).toFixed(2);
                return {
                    label: `${gp.price} Robux`,
                    description: `${gp.name} - R$ ${valorReais}`,
                    value: `${gp.id}_${gp.price}`,
                    emoji: { id: '1350550813898178570' }
                };
            })
        );

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('robux_atualizar_gamepass')
            .setLabel('Atualizar Lista')
            .setEmoji(Emojis.get('_change_emoji') || '🔄')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('robux_cancelar_compra')
            .setLabel('Cancelar Compra')
            .setEmoji(Emojis.get('_trash_emoji') || '🗑️')
            .setStyle(4)
    );

    await interaction.editReply({ content: null, embeds: [embedUser, embedGamepasses], components: [selectRow, buttonRow] });
}

async function cancelarCompra(interaction, client) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    
    if (!carrinho) {
        return interaction.reply({ 
            content: `${Emojis.get('negative') || '❌'} | Você não possui um carrinho aberto!`, 
            ephemeral: true 
        });
    }

    await enviarLogCompra(interaction.guild, 'canceladas', {
        usuario: interaction.user,
        tipo: carrinho.tipo,
        canal: interaction.channel,
        acao: 'Compra Cancelada',
        robloxUser: carrinho.robloxUser
    });

    carrinhosRobux.delete(`${interaction.user.id}`);

    const embedCancelado = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription(`${Emojis.get('checker') || '✅'} | Compra cancelada! O canal será deletado em 5 segundos...`);

    await interaction.update({ embeds: [embedCancelado], components: [] });

    setTimeout(async () => {
        try {
            await interaction.channel.delete();
        } catch (e) {
            console.error('Erro ao deletar canal:', e);
        }
    }, 5000);
}

async function atualizarGamepasses(interaction) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    
    if (!carrinho || !carrinho.robloxUser) {
        return interaction.reply({ 
            content: `${Emojis.get('negative') || '❌'} | Erro ao buscar informações do carrinho!`, 
            ephemeral: true 
        });
    }

    await interaction.deferUpdate();
    
    const embedLoading = new EmbedBuilder()
        .setColor('#2b2d31')
        .setDescription(`${Emojis.get('loading') || '⏳'} **Buscando GamePasses novamente...**\n\nAguarde enquanto verificamos suas gamepasses.`);

    await interaction.editReply({ embeds: [embedLoading], components: [] });

    const gamepasses = await getUserGamepasses(carrinho.robloxUser.id);
    const minimoGamepass = robuxConfig.get(`config.limites.minimoGamepass`) || 0;
    const limiteGamepass = robuxConfig.get(`config.limites.gamepass`) || 1000000;
    
    if (gamepasses.length === 0) {
        await mostrarSemGamepass(interaction, carrinho.robloxUser, minimoGamepass, limiteGamepass);
    } else {
        await mostrarGamepasses(interaction, carrinho.robloxUser, gamepasses);
    }
}

async function enviarLogCompra(guild, tipo, dados) {
    const canalId = robuxConfig.get(`config.canais.${tipo}`);
    if (!canalId) return;

    const canal = guild.channels.cache.get(canalId);
    if (!canal) return;

    const { configuracao } = require("../DataBaseJson");

    const cores = {
        iniciadas: configuracao.get(`Cores.Processamento`) || '#3498db',
        canceladas: configuracao.get(`Cores.Erro`) || '#e74c3c',
        aprovadas: configuracao.get(`Cores.Sucesso`) || '#2ecc71',
        publicas: configuracao.get(`Cores.Principal`) || '#9b59b6'
    };

    const icones = {
        iniciadas: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless`,
        canceladas: null,
        aprovadas: `https://images-ext-1.discordapp.net/external/_4RFG9_wx9GMsiOlXivLlAwB5MfEHKQbD07bxwrd6lQ/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486366329409637.png?format=webp&quality=lossless`,
        publicas: null
    };

    const embed = new EmbedBuilder()
        .setColor(cores[tipo] || '#7c3aed')
        .setAuthor({ name: `${dados.acao}`, iconURL: icones[tipo] || null })
        .setDescription(`Usuário ${dados.usuario} ${tipo === 'canceladas' ? 'cancelou a compra' : 'iniciou uma compra de Robux'}`)
        .addFields(
            { name: 'Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
        )
        .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    if (dados.robloxUser) {
        embed.addFields(
            { name: '🎮 Roblox', value: `\`${dados.robloxUser.name}\` (\`${dados.robloxUser.id}\`)`, inline: true }
        );
        if (dados.robloxUser.avatar) {
            embed.setThumbnail(dados.robloxUser.avatar);
        }
    }

    if (dados.canal) {
        embed.addFields({ name: '📝 Canal', value: `<#${dados.canal.id}>`, inline: true });
    }

    try {
        await canal.send({ embeds: [embed] });
    } catch (e) {
        console.error('Erro ao enviar log:', e);
    }
}

async function mostrarRevisaoPedido(interaction, gamepassId, gamepassPrice) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    
    if (!carrinho || !carrinho.robloxUser) {
        return interaction.reply({ 
            content: `${Emojis.get('negative') || '❌'} | Erro ao buscar informações do carrinho!`, 
            ephemeral: true 
        });
    }

    await interaction.deferUpdate();

    const valorPor1000 = parseFloat(robuxConfig.get(`config.valores.gamepass`)) || 0;
    const robuxSemTaxa = parseInt(gamepassPrice);
    
    const robuxComTaxa = Math.ceil(robuxSemTaxa / 0.7);
    
    const valorSemTaxa = ((robuxSemTaxa / 1000) * valorPor1000).toFixed(2);
    const valorComTaxa = ((robuxComTaxa / 1000) * valorPor1000).toFixed(2);

    let gamepassNome = 'GamePass';
    const gamepasses = await getUserGamepasses(carrinho.robloxUser.id);
    const gpEncontrado = gamepasses.find(gp => gp.id.toString() === gamepassId.toString());
    if (gpEncontrado) {
        gamepassNome = gpEncontrado.name;
    }

    carrinho.gamepassSelecionado = { 
        id: gamepassId, 
        name: gamepassNome,
        price: robuxSemTaxa,
        priceComTaxa: robuxComTaxa
    };
    carrinho.status = 'revisao_pedido';
    carrinhosRobux.set(`${interaction.user.id}`, carrinho);

    const embedUser = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('Informações do Usuário Roblox')
        .addFields(
            { name: 'Nome de Exibição', value: carrinho.robloxUser.displayName, inline: true },
            { name: 'Nome de Usuário', value: carrinho.robloxUser.name, inline: true }
        )
        .addFields(
            { name: 'ID do Usuário', value: `${carrinho.robloxUser.id}`, inline: false }
        );

    if (carrinho.robloxUser.avatar) {
        embedUser.setThumbnail(carrinho.robloxUser.avatar);
    }

    const embedRevisao = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('📋 Revisão do Pedido')
        .setDescription(`Confira os detalhes da sua compra antes de prosseguir.`)
        .addFields(
            { name: '🎮 GamePass Selecionado', value: `${gamepassNome}`, inline: false },
            { name: '\u200B', value: '**━━━━━━━━━━━━━━━━━━━━━━**', inline: false },
            { name: '💰 Sem Taxa (Você recebe menos)', value: `\`${robuxSemTaxa} Robux\` → **R$ ${valorSemTaxa}**\n-# O Roblox desconta 30%, você recebe ~${Math.floor(robuxSemTaxa * 0.7)} Robux`, inline: false },
            { name: '💎 Com Taxa (Você recebe o valor cheio)', value: `\`${robuxComTaxa} Robux\` → **R$ ${valorComTaxa}**\n-# Valor ajustado para cobrir a taxa do Roblox`, inline: false }
        )
        .setFooter({ text: 'Escolha uma opção abaixo para continuar.' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`robux_comprar_sem_taxa_${gamepassId}_${robuxSemTaxa}`)
            .setLabel(`Sem Taxa - R$ ${valorSemTaxa}`)
            .setEmoji('💰')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`robux_comprar_com_taxa_${gamepassId}_${robuxComTaxa}`)
            .setLabel(`Com Taxa - R$ ${valorComTaxa}`)
            .setEmoji('💎')
            .setStyle(1)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('robux_voltar_gamepasses')
            .setLabel('Voltar')
            .setEmoji('⬅️')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('robux_cancelar_compra')
            .setLabel('Cancelar Compra')
            .setEmoji('🗑️')
            .setStyle(4)
    );

    await interaction.editReply({ content: null, embeds: [embedUser, embedRevisao], components: [row, row2] });
}

async function mostrarCheckout(interaction, gamepassId, robuxAmount) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    
    if (!carrinho || !carrinho.robloxUser) {
        return interaction.reply({ 
            content: `${Emojis.get('negative') || '❌'} | Erro ao buscar informações do carrinho!`, 
            ephemeral: true 
        });
    }

    await interaction.deferUpdate();

    const valorPor1000 = parseFloat(robuxConfig.get(`config.valores.gamepass`)) || 0;
    const valorTotal = ((robuxAmount / 1000) * valorPor1000).toFixed(2);

    let gamepassNome = 'GamePass';
    const gamepasses = await getUserGamepasses(carrinho.robloxUser.id);
    const gpEncontrado = gamepasses.find(gp => gp.id.toString() === gamepassId.toString());
    if (gpEncontrado) {
        gamepassNome = gpEncontrado.name;
    }

    carrinho.gamepassSelecionado = { 
        id: gamepassId, 
        name: gamepassNome,
        price: robuxAmount
    };
    carrinho.robuxFinal = robuxAmount;
    carrinho.valorFinal = valorTotal;
    carrinho.status = 'checkout';
    carrinhosRobux.set(`${interaction.user.id}`, carrinho);

    const embedUser = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('Informações do Usuário Roblox')
        .addFields(
            { name: 'Nome de Exibição', value: carrinho.robloxUser.displayName, inline: true },
            { name: 'Nome de Usuário', value: carrinho.robloxUser.name, inline: true }
        )
        .addFields(
            { name: 'ID do Usuário', value: `${carrinho.robloxUser.id}`, inline: false }
        );

    if (carrinho.robloxUser.avatar) {
        embedUser.setThumbnail(carrinho.robloxUser.avatar);
    }

    const embedCheckout = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('Revisão do Pedido - Checkout Robux')
        .setDescription(`- Acompanhe abaixo os detalhes de seu carrinho e logo em seguida escolha o que fazer`)
        .addFields(
            { name: 'Gamepass no Carrinho', value: `\`${gamepassNome}\`\n\`${robuxAmount} Robux\``, inline: true },
            { name: 'Valor Total do Carrinho', value: `**R$ ${valorTotal}**`, inline: true }
        )
        .setFooter({ text: 'Clique em "Ir para o Pagamento" para continuar.' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('robux_ir_pagamento')
            .setLabel('Ir para o Pagamento')
            .setEmoji(`${Emojis.get('_confirm_emoji')}`)
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId('robux_voltar_gamepasses')
            .setLabel('Voltar')
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('robux_cancelar_compra')
            .setLabel('Cancelar Compra')
            .setEmoji(`${Emojis.get('_trash_emoji')}`)
            .setStyle(4)
    );

    await interaction.editReply({ content: null, embeds: [embedUser, embedCheckout], components: [row] });
}

async function voltarParaGamepasses(interaction) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    
    if (!carrinho || !carrinho.robloxUser) {
        return interaction.reply({ 
            content: `${Emojis.get('negative') || '❌'} | Erro ao buscar informações do carrinho!`, 
            ephemeral: true 
        });
    }

    await interaction.deferUpdate();

    const embedLoading = new EmbedBuilder()
        .setColor('#2b2d31')
        .setDescription(`${Emojis.get('loading') || '⏳'} **Carregando GamePasses...**`);

    await interaction.editReply({ embeds: [embedLoading], components: [] });

    const gamepasses = await getUserGamepasses(carrinho.robloxUser.id);
    const minimoGamepass = robuxConfig.get(`config.limites.minimoGamepass`) || 0;
    const limiteGamepass = robuxConfig.get(`config.limites.gamepass`) || 1000000;
    
    if (gamepasses.length === 0) {
        await mostrarSemGamepass(interaction, carrinho.robloxUser, minimoGamepass, limiteGamepass);
    } else {
        await mostrarGamepasses(interaction, carrinho.robloxUser, gamepasses);
    }
}

module.exports = {
    criarCarrinhoRobux,
    modalNickRoblox,
    handleModalNickRoblox,
    cancelarCompra,
    atualizarGamepasses,
    mostrarGamepasses,
    mostrarSemGamepass,
    mostrarCheckout,
    voltarParaGamepasses,
    enviarLogCompra,
    carrinhosRobux,
    getRobloxUser,
    getUserGamepasses
}
