const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");
const { res } = require("../res");

async function mpConfigs(interaction) {
    const blockedBanksArray = configuracao.get(`pagamentos.BancosBloqueados`) || [];
    const BancosBloqueados = blockedBanksArray.map(bank => `${bank}`).join(', ') || 'Nenhum';
    
    const accessToken = configuracao.get(`pagamentos.MpAPI`);
    const tokenDisplay = !accessToken || accessToken === "" 
        ? `APP_USR-000000000000000-XXXXXXX` 
        : `${accessToken.slice(0, 30)}*****************`;

    const mpOnOff = configuracao.get(`pagamentos.MpOnOff`) || false;
    const mpSite = configuracao.get(`pagamentos.MpSite`) || false;

    const rowToken = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("+18porra")
            .setLabel('Definir Access Token')
            .setEmoji(`1238417619657424929`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("toggleMpOnOff")
            .setLabel(mpOnOff ? "Desativar MP" : "Ativar MP")
            .setEmoji(`1384035191621812234`)
            .setStyle(mpOnOff ? 4 : 3),
        new ButtonBuilder()
            .setCustomId("toggleMpSite")
            .setLabel(mpSite ? "Desativar Site" : "Ativar Site")
            .setEmoji(`1384035213641912360`)
            .setStyle(2)
    );

    const rowBancos = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("bloquearbancos")
            .setLabel('Bloquear Banco')
            .setEmoji(`1238417761554927617`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("liberarbanco")
            .setLabel('Liberar Banco')
            .setEmoji(Emojis.get('_trash_emoji') ? Emojis.get('_trash_emoji').match(/\d+/)?.[0] : '🗑️')
            .setStyle(2)
            .setDisabled(blockedBanksArray.length <= 0)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("formasdepagamentos")
            .setLabel('Voltar')
            .setEmoji(`1238413255886639104`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `**${Emojis.get('_mp_emoji')} Configurar Mercado Pago**` },
        { type: 14 },
        { type: 10, content: `Aqui, você pode configurar tudo referente ao Mercado Pago. Pode definir ou redefinir seu access token, bloquear ou desbloquear bancos que não deseja aceitar pagamentos.` },
        { type: 14 },
        { type: 10, content: `> ${Emojis.get('_mp_emoji')} **Access Token**\n> -# *Não compartilhe com ninguém*\n\`\`\`${tokenDisplay}\`\`\`` },
        { type: 14 },
        { type: 10, content: `> ${Emojis.get('_fixe_emoji')} **Bancos Bloqueados**\n> \`${BancosBloqueados}\`` },
        { type: 14 },
        { type: 10, content: `> **Status MP:** \`${mpOnOff ? '🟢 Ativado' : '🔴 Desativado'}\`\n> **Status Site:** \`${mpSite ? '🟢 Ativado' : '🔴 Desativado'}\`` },
        { type: 14 }
    ).with({
        components: [rowToken, rowBancos, rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

async function BloquearConta(interaction) {
    const { res } = require("../res");
    
    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarmercadopago")
            .setLabel('Voltar')
            .setEmoji(`1238413255886639104`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `**Contas Bloqueadas**` },
        { type: 14 },
        { type: 10, content: `Configure as contas que serão bloqueadas no sistema de pagamento Mercado Pago, caso o seu bot receba pagamentos de alguma dessas contas, a transação será recusada.` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "bloquearcontaselect",
                placeholder: "Selecione uma opção",
                options: [
                    {
                        label: "Bloquear Conta",
                        value: "bloquearConta",
                        description: "Bloqueie contas específicas de depositarem",
                        emoji: Emojis.get('_silueta_emoji') ? { id: Emojis.get('_silueta_emoji').match(/\d+/)?.[0] } : { name: "👤" }
                    },
                    {
                        label: "Desbloquear Conta",
                        value: "desbloquearConta",
                        description: "Desbloqueie contas específicas de depositarem",
                        emoji: Emojis.get('_multi_silueta_emoji') ? { id: Emojis.get('_multi_silueta_emoji').match(/\d+/)?.[0] } : { name: "👥" }
                    },
                    {
                        label: "Ver Contas Bloqueadas",
                        value: "verContas",
                        description: "Veja as contas que estão bloqueadas",
                        emoji: Emojis.get('_folder_emoji') ? { id: Emojis.get('_folder_emoji').match(/\d+/)?.[0] } : { name: "📁" }
                    }
                ]
            }]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

async function BloquearBancos(interaction) {
    const { refounds } = require("../DataBaseJson");
    const { res } = require("../res");
    
    let refunded = await refounds.fetchAll();
    let opcoes = {};

    for (const element of refunded) {
        let banco = element.data.banco;
        let valor = element.data.transaction_amount;
        let quantidade = element.data.quantidade || 1;

        if (opcoes[banco]) {
            opcoes[banco].value += valor;
            opcoes[banco].quantidade += quantidade;
        } else {
            opcoes[banco] = {
                label: banco,
                value: valor,
                quantidade: quantidade
            };
        }
    }

    let opcoesArray = Object.values(opcoes).map(({ label, value, quantidade }) => {
        return {
            label: label,
            value: label,
            description: `${quantidade} fraudes, total de ${Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
        };
    });

    opcoesArray.sort((a, b) => {
        const totalA = opcoes[a.value]?.value;
        const totalB = opcoes[b.value]?.value;
        return totalB - totalA;
    });

    const blockedBanksArray = configuracao.get(`pagamentos.BancosBloqueados`) || [];

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarmercadopago")
            .setLabel('Voltar')
            .setEmoji(`1238413255886639104`)
            .setStyle(2)
    );

    if (opcoesArray.length === 0) {
        const containerContent = res.main(
            { type: 10, content: `**Bloquear Bancos**` },
            { type: 14 },
            { type: 10, content: `${Emojis.get('negative')} Nenhum banco com fraude registrada para bloquear.` },
            { type: 14 }
        ).with({
            components: [rowVoltar],
            flags: [64]
        });
        await interaction.update(containerContent);
        return;
    }

    const rowLiberar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("liberarbanco")
            .setLabel('Liberar Banco')
            .setEmoji(Emojis.get('_trash_emoji') ? Emojis.get('_trash_emoji').match(/\d+/)?.[0] : '🗑️')
            .setStyle(2)
            .setDisabled(blockedBanksArray.length <= 0)
    );

    const containerContent = res.main(
        { type: 10, content: `**Bloquear Bancos**` },
        { type: 14 },
        { type: 10, content: `Selecione os bancos que deseja bloquear:` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "bloquearbancosselect",
                placeholder: "Selecione um banco para bloquear",
                max_values: opcoesArray.length,
                options: opcoesArray
            }]
        }
    ).with({
        components: [rowLiberar, rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

async function toggleMpOnOff(interaction) {
    const currentStatus = configuracao.get(`pagamentos.MpOnOff`) || false;
    const newStatus = !currentStatus;
    
    configuracao.set(`pagamentos.MpOnOff`, newStatus);
    
    await mpConfigs(interaction);
}

async function toggleMpSite(interaction) {
    const currentStatus = configuracao.get(`pagamentos.MpSite`) || false;
    const newStatus = !currentStatus;
    
    configuracao.set(`pagamentos.MpSite`, newStatus);
    
    await mpConfigs(interaction);
}

module.exports = {
    mpConfigs,
    BloquearBancos,
    BloquearConta,
    toggleMpOnOff,
    toggleMpSite
}
