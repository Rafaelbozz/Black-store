const { ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js")
const { tickets } = require("../DataBaseJson")
const { res } = require("../res")
const emojis = require("../DataBaseJson/emojis.json")

const Emojis = { get: (name) => emojis[name] || "" };

async function PreviewTicket(interaction, painelId) {
    const painel = tickets.get(`tickets.paineis.${painelId}`);
    if (!painel) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Painel nao encontrado!`, ephemeral: true });
    }

    const funcoes = painel?.funcoes || {};
    const funcoesArray = Object.keys(funcoes);
    const modoExibicao = painel?.modoExibicao || "embed";

    if (funcoesArray.length === 0) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Adicione pelo menos uma categoria antes de ver o preview!`, ephemeral: true });
    }

    const usarBotao = funcoesArray.length === 1;

    if (modoExibicao === "container") {
        const components = [
            { type: 10, content: `# ${painel.titulo}` },
            { type: 14 }
        ];
        
        if (painel.banner && painel.banner.startsWith('http')) {
            components.push({ type: 12, items: [{ media: { url: painel.banner.trim() }, spoiler: false }] });
            components.push({ type: 14 });
        }
        
        components.push({ type: 10, content: painel.descricao || "Sem descricao" });
        components.push({ type: 14 });

        if (usarBotao) {
            const funcao = funcoes[funcoesArray[0]];
            const btnComponent = { type: 2, style: 2, label: funcao.nome, custom_id: "preview_disabled", disabled: true };
            if (funcao.emoji && funcao.emoji.trim() !== '') {
                btnComponent.emoji = { id: funcao.emoji };
            }
            components.push({
                type: 1,
                components: [btnComponent]
            });
        } else {
            const selectOptions = funcoesArray.map(f => {
                const option = {
                    label: funcoes[f].nome,
                    description: funcoes[f].descricao?.substring(0, 50) || "Abrir ticket",
                    value: `preview_${f}`
                };
                if (funcoes[f].emoji && funcoes[f].emoji.trim() !== '') {
                    option.emoji = { id: funcoes[f].emoji };
                }
                return option;
            });
            components.push({
                type: 1,
                components: [{ type: 3, custom_id: "preview_select_disabled", placeholder: "Selecione uma opcao para abrir ticket", options: selectOptions, disabled: true }]
            });
        }

        const containerPreview = res.main(...components).with({ flags: [64] });
        await interaction.reply(containerPreview);
    } else {
        const embed = new EmbedBuilder()
            .setTitle(painel.titulo)
            .setDescription(painel.descricao)
            .setColor(painel.cor || "#5865F2");
        
        if (painel.banner) embed.setImage(painel.banner);
        if (painel.icone) embed.setThumbnail(painel.icone);

        let row;
        if (usarBotao) {
            const funcao = funcoes[funcoesArray[0]];
            const btn = new ButtonBuilder()
                .setCustomId("preview_disabled")
                .setLabel(funcao.nome)
                .setStyle(2)
                .setDisabled(true);
            if (funcao.emoji && funcao.emoji.trim() !== '') {
                btn.setEmoji(funcao.emoji);
            }
            row = new ActionRowBuilder().addComponents(btn);
        } else {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId("preview_select_disabled")
                .setPlaceholder("Selecione uma opcao para abrir ticket")
                .setDisabled(true)
                .addOptions(funcoesArray.map(f => {
                    const option = {
                        label: funcoes[f].nome,
                        description: funcoes[f].descricao?.substring(0, 50) || "Abrir ticket",
                        value: `preview_${f}`
                    };
                    if (funcoes[f].emoji && funcoes[f].emoji.trim() !== '') {
                        option.emoji = funcoes[f].emoji;
                    }
                    return option;
                }));
            row = new ActionRowBuilder().addComponents(selectMenu);
        }

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
}

async function AlternarExibicao(interaction, painelId) {
    const painel = tickets.get(`tickets.paineis.${painelId}`);
    if (!painel) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Painel nao encontrado!`, ephemeral: true });
    }

    const modoAtual = painel.modoExibicao || "embed";
    const novoModo = modoAtual === "embed" ? "container" : "embed";
    
    tickets.set(`tickets.paineis.${painelId}.modoExibicao`, novoModo);

    await interaction.deferUpdate();
    
    const { PaginaGerenciarPainel } = require("./PainelTickets.js");
    await interaction.followUp({ content: `${Emojis.get('checker')} | Modo de exibicao alterado para **${novoModo === "embed" ? "Embed" : "Component V2"}**!`, ephemeral: true });
    
    const painelAtualizado = tickets.get(`tickets.paineis.${painelId}`);
    const funcoes = painelAtualizado.funcoes || {};
    const funcoesArray = Object.keys(funcoes);
    const mensagensPostadas = painelAtualizado.mensagens?.length || 0;

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_voltar_lista").setLabel('Voltar').setEmoji(`1178068047202893869`).setStyle(2)
    );

    const selectOptions = [
        { label: "Editar", value: `editar_${painelId}`, emoji: { id: "1178066208835252266" }, description: "Editar titulo, descricao, banner e icone" },
        { label: "Categorias", value: `categorias_${painelId}`, emoji: { id: "1178163524443316285" }, description: "Gerenciar funcoes do ticket" },
        { label: "Alterar modo de exibicao", value: `exibicao_${painelId}`, emoji: { id: "1178077123882262628" }, description: `Atual: ${novoModo === "embed" ? "Embed" : "Component V2"}` },
        { label: "Apagar", value: `apagar_${painelId}`, emoji: { id: "1178076767567757312" }, description: "Deletar este painel" },
        { label: "Enviar", value: `enviar_${painelId}`, emoji: { id: "1178076954029731930" }, description: "Postar ticket em um canal" },
        { label: "Sincronizar", value: `sincronizar_${painelId}`, emoji: { id: "1178077123882262628" }, description: "Atualizar mensagens postadas" }
    ];

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Ticket > ${painelAtualizado.titulo}` },
        { type: 14 },
        { type: 10, content: `## Gerenciar: ${painelAtualizado.titulo}` },
        { type: 14 },
        { type: 10, content: `### Informacoes Gerais` },
        { type: 10, content: `> **Categorias Criadas:** \`${funcoesArray.length}\`\n> **Modo de Exibicao:** \`${novoModo === "embed" ? "Embed" : "Component V2"}\`\n> **Mensagens Postadas:** \`${mensagensPostadas}\`` },
        { type: 14 },
        { type: 1, components: [{ type: 3, custom_id: "ticket_acoes_select", placeholder: "Selecione uma opcao...", options: selectOptions }] },
        { type: 1, components: [{ type: 2, style: 2, label: 'Ver Preview', custom_id: `ticket_preview_${painelId}`, emoji: { id: '1178066208835252266' } }] }
    ).with({ components: [rowVoltar], flags: [64] });

    await interaction.editReply(containerContent);
}

async function HandleDeletarPainel(interaction, painelId) {
    const painel = tickets.get(`tickets.paineis.${painelId}`);
    if (!painel) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Painel nao encontrado!`, ephemeral: true });
    }

    const titulo = painel.titulo;
    tickets.delete(`tickets.paineis.${painelId}`);

    await interaction.deferUpdate();
    
    const { painelTicket } = require("./PainelTickets.js");
    await interaction.followUp({ content: `${Emojis.get('checker')} | Painel **${titulo}** deletado com sucesso!`, ephemeral: true });
    await painelTicket(interaction);
}

async function ModalEditarPainel(interaction, painelId) {
    const painel = tickets.get(`tickets.paineis.${painelId}`);
    if (!painel) {
        return interaction.reply({ content: `${Emojis.get('negative')} | Painel nao encontrado!`, ephemeral: true });
    }

    const modal = new ModalBuilder()
        .setCustomId(`modal_editar_${painelId}`)
        .setTitle('Editar Ticket')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('ticket_titulo').setLabel('Titulo')
                    .setPlaceholder('Digite o titulo do painel').setStyle(TextInputStyle.Short).setMaxLength(256).setRequired(true).setValue(painel.titulo || "")
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('ticket_descricao').setLabel('Descricao')
                    .setPlaceholder('Digite a descricao do painel').setStyle(TextInputStyle.Paragraph).setMaxLength(4000).setRequired(true).setValue(painel.descricao || "")
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('ticket_banner').setLabel('Banner (opcional)')
                    .setPlaceholder('Coloque a URL do banner').setStyle(TextInputStyle.Short).setRequired(false).setValue(painel.banner || "")
            )
        );
    await interaction.showModal(modal);
}

async function HandleEditarPainel(interaction, painelId) {
    try {
        const titulo = interaction.fields.getTextInputValue('ticket_titulo');
        const descricao = interaction.fields.getTextInputValue('ticket_descricao');
        const banner = interaction.fields.getTextInputValue('ticket_banner');

        const urlRegex = /^(https?:\/\/[^\s]+)$/;
        
        if (banner && !urlRegex.test(banner)) {
            return interaction.reply({ content: `${Emojis.get('negative')} | URL do banner invalida!`, ephemeral: true });
        }

        tickets.set(`tickets.paineis.${painelId}.titulo`, titulo);
        tickets.set(`tickets.paineis.${painelId}.descricao`, descricao);
        
        if (banner) {
            tickets.set(`tickets.paineis.${painelId}.banner`, banner);
        }

        await interaction.reply({ content: `${Emojis.get('checker')} | Painel atualizado com sucesso!`, ephemeral: true });
    } catch (error) {
        console.error("Erro no HandleEditarPainel:", error);
        try {
            await interaction.reply({ content: `${Emojis.get('negative')} | Erro ao atualizar painel!`, ephemeral: true });
        } catch {}
    }
}

async function PostarTicket(interaction, painelId, channel) {
    try {
        const painel = tickets.get(`tickets.paineis.${painelId}`);
        if (!painel) {
            return interaction.editReply({ content: `${Emojis.get('negative')} | Painel nao encontrado!` });
        }

        const funcoes = painel?.funcoes || {};
        const funcoesArray = Object.keys(funcoes);

        if (funcoesArray.length === 0) {
            return interaction.editReply({ content: `${Emojis.get('negative')} | Adicione pelo menos uma categoria antes de postar!` });
        }

        const modoExibicao = painel.modoExibicao || "embed";
        const usarBotao = funcoesArray.length === 1;
        let mensagem;

        if (modoExibicao === "container") {
            const components = [
                { type: 10, content: `# ${painel.titulo}` },
                { type: 14 }
            ];
            
            if (painel.banner && painel.banner.startsWith('http')) {
                components.push({ type: 12, items: [{ media: { url: painel.banner.trim() }, spoiler: false }] });
                components.push({ type: 14 });
            }
            
            components.push({ type: 10, content: painel.descricao || "Sem descricao" });
            components.push({ type: 14 });

            if (usarBotao) {
                const funcao = funcoes[funcoesArray[0]];
                const funcaoEncoded = Buffer.from(funcoesArray[0]).toString('base64');
                const btnComponent = { type: 2, style: 2, label: funcao.nome, custom_id: `AbrirTicket_${painelId}_${funcaoEncoded}` };
                if (funcao.emoji && funcao.emoji.trim() !== '') {
                    console.log(`[Ticket] Adicionando emoji ao botão: ${funcao.emoji}`);
                    btnComponent.emoji = { id: funcao.emoji };
                }
                components.push({
                    type: 1,
                    components: [btnComponent]
                });
            } else {
                const selectOptions = funcoesArray.map(f => {
                    const funcaoEncoded = Buffer.from(f).toString('base64');
                    const option = {
                        label: funcoes[f].nome,
                        description: funcoes[f].descricao?.substring(0, 50) || "Abrir ticket",
                        value: `abrirticket_${painelId}_${funcaoEncoded}`
                    };
                    if (funcoes[f].emoji && funcoes[f].emoji.trim() !== '') {
                        console.log(`[Ticket] Adicionando emoji ao select: ${funcoes[f].emoji}`);
                        option.emoji = { id: funcoes[f].emoji };
                    }
                    return option;
                });
                components.push({
                    type: 1,
                    components: [{ type: 3, custom_id: `ticket_abrir_select_${painelId}`, placeholder: "Selecione uma opcao para abrir ticket", options: selectOptions }]
                });
            }

            const containerMsg = res.main(...components);
            mensagem = await channel.send(containerMsg);
        } else {
            const embed = new EmbedBuilder()
                .setTitle(painel.titulo)
                .setDescription(painel.descricao)
                .setColor(painel.cor || "#5865F2");
            
            if (painel.banner) embed.setImage(painel.banner);
            if (painel.icone) embed.setThumbnail(painel.icone);

            let row;
            if (usarBotao) {
                const funcao = funcoes[funcoesArray[0]];
                const funcaoEncoded = Buffer.from(funcoesArray[0]).toString('base64');
                const btn = new ButtonBuilder()
                    .setCustomId(`AbrirTicket_${painelId}_${funcaoEncoded}`)
                    .setLabel(funcao.nome)
                    .setStyle(2);
                if (funcao.emoji && funcao.emoji.trim() !== '') {
                    btn.setEmoji(funcao.emoji);
                }
                row = new ActionRowBuilder().addComponents(btn);
            } else {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`ticket_abrir_select_${painelId}`)
                    .setPlaceholder("Selecione uma opcao para abrir ticket")
                    .addOptions(funcoesArray.map(f => {
                        const funcaoEncoded = Buffer.from(f).toString('base64');
                        const option = {
                            label: funcoes[f].nome,
                            description: funcoes[f].descricao?.substring(0, 50) || "Abrir ticket",
                            value: `abrirticket_${painelId}_${funcaoEncoded}`
                        };
                        if (funcoes[f].emoji && funcoes[f].emoji.trim() !== '') {
                            option.emoji = funcoes[f].emoji;
                        }
                        return option;
                    }));
                row = new ActionRowBuilder().addComponents(selectMenu);
            }

            mensagem = await channel.send({ embeds: [embed], components: [row] });
        }

        const mensagens = painel.mensagens || [];
        mensagens.push({ messageId: mensagem.id, channelId: channel.id });
        tickets.set(`tickets.paineis.${painelId}.mensagens`, mensagens);

        await interaction.editReply({ content: `${Emojis.get('checker')} | Ticket postado com sucesso no canal <#${channel.id}>!` });
    } catch (error) {
        console.error("Erro ao postar:", error);
        await interaction.editReply({ content: `${Emojis.get('negative')} | Erro ao postar: ${error.message}` });
    }
}

async function SincronizarTicket(interaction, painelId, client) {
    try {
        const painel = tickets.get(`tickets.paineis.${painelId}`);
        if (!painel) {
            return interaction.reply({ content: `${Emojis.get('negative')} | Painel nao encontrado!`, ephemeral: true });
        }

        const mensagens = painel.mensagens || [];
        if (mensagens.length === 0) {
            return interaction.reply({ content: `${Emojis.get('negative')} | Este painel nao tem mensagens postadas para sincronizar!`, ephemeral: true });
        }

        await interaction.deferUpdate();

        const funcoes = painel?.funcoes || {};
        const funcoesArray = Object.keys(funcoes);
        const modoExibicao = painel.modoExibicao || "embed";
        const usarBotao = funcoesArray.length === 1;

        let atualizadas = 0;
        let erros = 0;
        const mensagensValidas = [];

        for (const msg of mensagens) {
            try {
                const channel = await client.channels.fetch(msg.channelId);
                const message = await channel.messages.fetch(msg.messageId);

                if (modoExibicao === "container") {
                    const components = [
                        { type: 10, content: `# ${painel.titulo}` },
                        { type: 14 }
                    ];
                    
                    if (painel.banner && painel.banner.startsWith('http')) {
                        components.push({ type: 12, items: [{ media: { url: painel.banner.trim() }, spoiler: false }] });
                        components.push({ type: 14 });
                    }
                    
                    components.push({ type: 10, content: painel.descricao || "Sem descricao" });
                    components.push({ type: 14 });

                    if (usarBotao) {
                        const funcao = funcoes[funcoesArray[0]];
                        const funcaoEncoded = Buffer.from(funcoesArray[0]).toString('base64');
                        const btnComponent = { type: 2, style: 2, label: funcao.nome, custom_id: `AbrirTicket_${painelId}_${funcaoEncoded}` };
                        if (funcao.emoji && funcao.emoji.trim() !== '') {
                            btnComponent.emoji = { id: funcao.emoji };
                        }
                        components.push({
                            type: 1,
                            components: [btnComponent]
                        });
                    } else {
                        const selectOptions = funcoesArray.map(f => {
                            const funcaoEncoded = Buffer.from(f).toString('base64');
                            const option = {
                                label: funcoes[f].nome,
                                description: funcoes[f].descricao?.substring(0, 50) || "Abrir ticket",
                                value: `abrirticket_${painelId}_${funcaoEncoded}`
                            };
                            if (funcoes[f].emoji && funcoes[f].emoji.trim() !== '') {
                                option.emoji = { id: funcoes[f].emoji };
                            }
                            return option;
                        });
                        components.push({
                            type: 1,
                            components: [{ type: 3, custom_id: `ticket_abrir_select_${painelId}`, placeholder: "Selecione uma opcao para abrir ticket", options: selectOptions }]
                        });
                    }

                    const containerMsg = res.main(...components);
                    await message.edit(containerMsg);
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle(painel.titulo)
                        .setDescription(painel.descricao)
                        .setColor(painel.cor || "#5865F2");
                    
                    if (painel.banner) embed.setImage(painel.banner);
                    if (painel.icone) embed.setThumbnail(painel.icone);

                    let row;
                    if (usarBotao) {
                        const funcao = funcoes[funcoesArray[0]];
                        const funcaoEncoded = Buffer.from(funcoesArray[0]).toString('base64');
                        const btn = new ButtonBuilder()
                            .setCustomId(`AbrirTicket_${painelId}_${funcaoEncoded}`)
                            .setLabel(funcao.nome)
                            .setStyle(2);
                        if (funcao.emoji && funcao.emoji.trim() !== '') {
                            btn.setEmoji(funcao.emoji);
                        }
                        row = new ActionRowBuilder().addComponents(btn);
                    } else {
                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`ticket_abrir_select_${painelId}`)
                            .setPlaceholder("Selecione uma opcao para abrir ticket")
                            .addOptions(funcoesArray.map(f => {
                                const funcaoEncoded = Buffer.from(f).toString('base64');
                                const option = {
                                    label: funcoes[f].nome,
                                    description: funcoes[f].descricao?.substring(0, 50) || "Abrir ticket",
                                    value: `abrirticket_${painelId}_${funcaoEncoded}`
                                };
                                if (funcoes[f].emoji && funcoes[f].emoji.trim() !== '') {
                                    option.emoji = funcoes[f].emoji;
                                }
                                return option;
                            }));
                        row = new ActionRowBuilder().addComponents(selectMenu);
                    }

                    await message.edit({ embeds: [embed], components: [row] });
                }

                mensagensValidas.push(msg);
                atualizadas++;
            } catch (err) {
                erros++;
            }
        }

        tickets.set(`tickets.paineis.${painelId}.mensagens`, mensagensValidas);

        await interaction.followUp({ content: `${Emojis.get('checker')} | Sincronizacao concluida!\n> Atualizadas: **${atualizadas}**\n> Erros/Removidas: **${erros}**`, ephemeral: true });
    } catch (error) {
        console.error("Erro ao sincronizar:", error);
        await interaction.followUp({ content: `${Emojis.get('negative')} | Erro ao sincronizar: ${error.message}`, ephemeral: true });
    }
}

module.exports = { PreviewTicket, AlternarExibicao, HandleDeletarPainel, ModalEditarPainel, HandleEditarPainel, PostarTicket, SincronizarTicket };
