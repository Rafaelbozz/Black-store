const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { produtos, configuracao, Emojis } = require("../DataBaseJson");
const { res } = require("../res");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

function getEmojiObject(emojiStr) {
    if (!emojiStr || emojiStr === "") return { name: "📦" };
    if (/^\d+$/.test(emojiStr)) return { id: emojiStr };
    const match = emojiStr.match(/<a?:\w+:(\d+)>/);
    if (match) return { id: match[1] };
    return { name: emojiStr };
}

async function GerenciarCampos2(interaction, campo, produtoname, update, reply) {
    let ggg;
    const isModal = interaction.isModalSubmit?.() || interaction.type === 5;
    
    if (isModal) {
        await interaction.deferUpdate();
    }

    if (produtoname == undefined) {
        await db.set(`${interaction.message.id}.camposelect`, campo);
        ggg = await db.get(interaction.message.id);
    } else {
        ggg = {
            name: produtoname,
            camposelect: campo
        };
    }

    const hhhh = produtos.get(`${ggg.name}.Campos`);
    const gggaaa = hhhh.find(campo22 => campo22.Nome === campo);

    const infoCargosAdd = gggaaa.roleadd ? `Cargo <@&${gggaaa.roleadd}> adicionado` : '';
    const infoCargosRemove = gggaaa.rolerem ? `Cargo <@&${gggaaa.rolerem}> removido` : '';
    const bothUndefined = !gggaaa.roleadd && !gggaaa.rolerem;

    const a1 = gggaaa.condicao?.idcargo ? `Possuir cargo <@&${gggaaa.condicao?.idcargo}>` : '';
    const a2 = gggaaa.condicao?.valorminimo ? `Mín. ${gggaaa.condicao?.valorminimo} unidades` : '';
    const a3 = gggaaa.condicao?.valormaximo ? `Máx. ${gggaaa.condicao?.valormaximo} unidades` : '';
    const a4 = !gggaaa.condicao?.idcargo && !gggaaa.condicao?.valorminimo && !gggaaa.condicao?.valormaximo;
    const condicaoInfoValue = [a1, a2, a3].filter(Boolean).join(' | ');

    const ggawdwadaw = produtos.get(`${ggg.name}.UltimaReposicao`);
    const detalhesaa = ggawdwadaw 
        ? `Última reposição <t:${Math.ceil(ggawdwadaw / 1000)}:R>` 
        : `Criado <t:${Math.ceil(gggaaa.criado / 1000)}:R>`;

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("Voltar4")
            .setLabel('Voltar')
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# ${ggg.name} > Campos > ${gggaaa.Nome}` },
        { type: 14 },
        { type: 10, content: `**Informações do Campo**\n> **Nome:** \`${gggaaa.Nome}\`\n> **Estoque:** \`${gggaaa.estoque.length}\`\n> **Preço:** \`R$ ${Number(gggaaa.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
        { type: 14 },
        { type: 10, content: `**Descrição**\n\`\`\`${gggaaa.desc || 'Sem descrição'}\`\`\`` },
        { type: 14 },
        { type: 10, content: `**Condições de Compra**\n> ${a4 ? 'Nenhuma condição definida' : condicaoInfoValue}` },
        { type: 14 },
        { type: 10, content: `**Cargos**\n> ${bothUndefined ? 'Nenhum cargo configurado' : [infoCargosAdd, infoCargosRemove].filter(Boolean).join(' | ')}` },
        { type: 14 },
        { type: 10, content: `**Detalhes**\n> ${detalhesaa}` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "campo_config_menu",
                placeholder: "Selecione uma opção",
                options: [
                    {
                        label: "Editar campo",
                        value: "editarcampooo",
                        description: "Editar nome, preço e descrição",
                        emoji: getEmojiObject(Emojis.get('_lapis_emoji'))
                    },
                    {
                        label: "Configurar cargos",
                        value: "cargosremadd",
                        description: "Adicionar ou remover cargos após compra",
                        emoji: getEmojiObject(Emojis.get('_flag_emoji'))
                    },
                    {
                        label: "Definir condições",
                        value: "gwdawdwadawawderenciarcampossss",
                        description: "Definir condições para compra",
                        emoji: getEmojiObject(Emojis.get('_fixe_emoji'))
                    },
                    {
                        label: "Gerenciar estoque",
                        value: "gerenciar_estoque",
                        description: "Adicionar, ver ou limpar estoque",
                        emoji: getEmojiObject(Emojis.get('_add_emoji'))
                    }
                ]
            }]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (isModal) {
        await interaction.editReply(containerContent);
    } else if (produtoname == undefined) {
        await interaction.update(containerContent);
    } else {
        if (update !== true) {
            await interaction.reply({ ...containerContent, fetchReply: true, ephemeral: true }).then(async msg => {
                await db.set(`${msg.id}`, ggg);
            });
        } else {
            if (reply !== true) {
                await interaction.update(containerContent).then(async () => {
                    await db.set(`${interaction.message.id}`, ggg);
                });
            } else {
                await interaction.reply({ ...containerContent, ephemeral: true }).then(async () => {
                    const message = await interaction.fetchReply();
                    db.set(message.id, ggg);
                });
            }
        }
    }
}

async function GerenciarCampos(interaction, produtoname) {
    const isModal = interaction.isModalSubmit?.() || interaction.type === 5;
    const alreadyDeferred = interaction.deferred || interaction.replied;
    
    if (isModal && !alreadyDeferred) {
        await interaction.deferUpdate();
    }

    const ggg = produtos.get(produtoname);

    let campos = '';
    if (ggg.Campos.length === 0) {
        campos = 'Nenhum campo adicionado';
    } else {
        for (let i = ggg.Campos.length - 1; i >= Math.max(0, ggg.Campos.length - 5); i--) {
            const campooo = ggg.Campos[i];
            campos += `\`${campooo.Nome}\` - Estoque: \`${campooo.estoque.length}\` - R$ \`${Number(campooo.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`\n`;
        }
        if (ggg.Campos.length > 5) {
            campos += `E mais ${ggg.Campos.length - 5}...`;
        }
    }

    let cupom = '';
    if (ggg.Cupom.length === 0) {
        cupom = 'Nenhum cupom';
    } else {
        for (let i = ggg.Cupom.length - 1; i >= Math.max(0, ggg.Cupom.length - 3); i--) {
            const cupommmm = ggg.Cupom[i];
            cupom += `\`${cupommmm.Nome}\` - ${cupommmm.desconto}% - Usos: \`${cupommmm.usos}\`\n`;
        }
        if (ggg.Cupom.length > 3) {
            cupom += `E mais ${ggg.Cupom.length - 3}...`;
        }
    }

    const aaaaaa = produtos.get(`${produtoname}.Campos`);

    let selectMenuComponent = null;
    if (aaaaaa.length > 0) {
        const options = aaaaaa.map(campo => ({
            label: campo.Nome,
            description: (campo.desc || 'Sem descrição').slice(0, 70),
            value: campo.Nome,
            emoji: getEmojiObject(campo.emoji)
        }));

        selectMenuComponent = {
            type: 1,
            components: [{
                type: 3,
                custom_id: "configurarcampooo",
                placeholder: "Clique aqui para gerenciar algum campo",
                options: options
            }]
        };
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltargerenciarproduto")
            .setLabel('Voltar')
            .setEmoji(`${Emojis.get('_back_emoji')}`)
            .setStyle(2)
    );

    const containerItems = [
        { type: 10, content: `-# ${ggg.Config.name} > Gerenciar Campos` },
        { type: 14 },
        { type: 10, content: `**Campos cadastrados**\n${campos}` },
        { type: 14 },
        { type: 10, content: `**Cupons**\n${cupom}` },
        { type: 14 },
        { type: 10, content: `**Entrega automática:** \`${ggg.Config.entrega}\`` },
        { type: 14 }
    ];

    if (selectMenuComponent) {
        containerItems.push(selectMenuComponent);
        containerItems.push({ type: 14 });
    }

    containerItems.push({
        type: 1,
        components: [
            {
                type: 2,
                style: 3,
                label: "Adicionar campo",
                custom_id: "addcampoo",
                emoji: getEmojiObject(Emojis.get('_add_emoji'))
            },
            {
                type: 2,
                style: 4,
                label: "Remover campo",
                custom_id: "remcampo",
                emoji: getEmojiObject(Emojis.get('_trash_emoji'))
            }
        ]
    });

    const containerContent = res.main(...containerItems).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (isModal || alreadyDeferred) {
        await interaction.editReply(containerContent);
        await db.set(interaction.message.id, { name: produtoname });
    } else {
        try {
            await interaction.update(containerContent);
            await db.set(interaction.message.id, { name: produtoname });
        } catch (error) {
            await interaction.reply({ ...containerContent, fetchReply: true, ephemeral: true });
            const msg = await interaction.fetchReply();
            await db.set(`${msg.id}`, { name: produtoname });
        }
    }
}

module.exports = {
    GerenciarCampos,
    GerenciarCampos2
};
