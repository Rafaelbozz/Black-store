const { ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require('discord.js');
const { configuracao, estatisticas } = require('../DataBaseJson');
const axios = require('axios');
const { JsonDatabase } = require('wio.db');
const fs = require('fs');
const https = require('https');

async function enviarMensagem(channel, embed) {
    const row222 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('asSs')
                .setLabel('Mensagem do Sistema')
                .setStyle(2)
                .setDisabled(true)
        );
    try {
        await channel.send({ components: [row222], embeds: [embed] });
    } catch (error) {
        console.error('Erro ao enviar a mensagem:', error);
    }
}

async function Varredura(client) {
    const systemLogsChannelId = configuracao.get('ConfigChannels.systemlogs');
    const mpApiToken = configuracao.get('pagamentos.MpAPI');
    const efiBankCertificado = configuracao.get('pagamentos.certificado');
    const efiBankSecretId = configuracao.get('pagamentos.secret_id');
    const efiBankSecretToken = configuracao.get('pagamentos.secret_token');

    if (!systemLogsChannelId) {
        console.error('Canal de logs do sistema não configurado.');
        return;
    }

    const systemLogsChannel = await client.channels.fetch(systemLogsChannelId);
    if (!systemLogsChannel) {
        console.error('Canal de logs do sistema não encontrado.');
        return;
    }

    const refoundsDB = new JsonDatabase({
        databasePath: "./DataBaseJson/refounds.json"
    });

    if (mpApiToken) {
        const embedAntiFraudeMP = new EmbedBuilder()
            .setColor('#1c44ff')
            .setAuthor({ name: `Sistema Anti-Fraude (Mercado Pago)`, iconURL: `https://cdn.discordapp.com/emojis/1371629226129756171.png?size=2048` })
            .setDescription(`Seu BOT está realizando uma varredura nos pagamentos do **Mercado Pago** para verificar a existência de quaisquer reembolsos suspeitos.`)
            .setFooter({ text: `Atenciosamente, Equipe Nexus Solutions - Updates`, iconURL: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGQFtaMOUetLi9yNY92MtbLwJqoO1kDS2jHB4oRMBehRo1PzKGg2_TAbiIUxC1hgpNnA4&usqp=CAU` })
            .setTimestamp();
        await enviarMensagem(systemLogsChannel, embedAntiFraudeMP);

        try {
            const refundResponse = await axios.get('https://api.mercadopago.com/v1/payments/search', {
                params: {
                    'access_token': mpApiToken,
                    'status': 'refunded'
                }
            });
            const refundData = refundResponse.data.results;

            if (refundData.length > 0) {
                for (const element of refundData) {
                    const isRefunded = await refoundsDB.get(`mp_${element.id}`);
                    if (!isRefunded) {
                        await refoundsDB.set(`mp_${element.id}`, `Reembolsado`);
                        let id = element.external_reference || 'Não encontrado';
                        const embedReembolso = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle(`🚨 Reembolso Detectado (Mercado Pago)`)
                            .setDescription(`Um reembolso foi detectado no sistema de pagamentos do Mercado Pago.`)
                            .addFields(
                                { name: `**ID do pagamento**`, value: `\`${element.id}\``, inline: true },
                                { name: `**ID do usuário**`, value: `\`${id}\``, inline: true },
                                { name: `**Valor**`, value: `\`R$ ${Number(element.transaction_amount).toFixed(2)}\``, inline: true },
                                { name: `**Data**`, value: `<t:${Math.ceil(new Date(element.date_created).getTime() / 1000)}:R>`, inline: true },
                                { name: `**Status**`, value: `\`${element.status}\``, inline: true },
                                { name: `**Tipo de pagamento**`, value: `\`${element.payment_type_id}\``, inline: true },
                                { name: `**Tipo de operação**`, value: `\`${element.operation_type}\``, inline: true },
                            );
                        await enviarMensagem(systemLogsChannel, embedReembolso);
                        const estatisticasData = estatisticas.fetchAll();
                        for (const element2 of estatisticasData) {
                            if (element2.data.idpagamento === element.id) {
                                estatisticas.delete(element2.ID);
                                console.log(`Estatística do pagamento ${element.id} removida devido a reembolso.`);
                            }
                        }
                    }
                }
            } else {
                console.log('Nenhum reembolso detectado no Mercado Pago.');
            }
        } catch (error) {
            console.error('Erro ao verificar reembolsos do Mercado Pago:', error.response?.data || error.message);
            await enviarMensagem(systemLogsChannel, new EmbedBuilder().setColor('Red').setDescription(`:x: Erro ao verificar reembolsos do Mercado Pago: \`${error.message}\``));
        }
    } else {
        console.log('Token da API do Mercado Pago não configurado. Pulando varredura do Mercado Pago.');
    }


    if (efiBankCertificado && efiBankSecretId && efiBankSecretToken) {
        const embedAntiFraudeEfiBank = new EmbedBuilder()
            .setColor('#1c44ff')
            .setAuthor({ name: `Sistema Anti-Fraude (Efi Bank)`, iconURL: `https://cdn.discordapp.com/emojis/1371629226129756171.png?size=2048` })
            .setDescription(`Seu BOT está realizando uma varredura nos pagamentos do **Efi Bank** para verificar a existência de estornos e devoluções (**incluindo acionamentos de MED**).`)
            .setFooter({ text: `Atenciosamente, Equipe Nexus Solutions - Updates`, iconURL: `https://media.licdn.com/dms/image/v2/D560BAQGuwG8Q-cvQhQ/company-logo_200_200/company-logo_200_200/0/1727957710773/sejaefi_logo?e=2147483647&v=beta&t=C1W1SwyRH8TD3bMVpJi2ItZg3MannHHwHs9mLsFcuH0` })
            .setTimestamp();
        await enviarMensagem(systemLogsChannel, embedAntiFraudeEfiBank);

        try {
            const certificadoPath = `./Lib/${efiBankCertificado}.p12`;
            let certificadoBuffer;
            try {
                certificadoBuffer = fs.readFileSync(certificadoPath);
            } catch (readError) {
                console.error(`Erro ao ler o certificado P12 do Efi Bank em ${certificadoPath}: ${readError.message}`);
                await enviarMensagem(systemLogsChannel, new EmbedBuilder().setColor('Red').setDescription(`:x: Erro: Certificado Efi Bank não encontrado ou inválido em \`${certificadoPath}\`.`));
                return;
            }

            const httpsAgent = new https.Agent({
                pfx: certificadoBuffer,
                passphrase: "",
            });

            const authData = JSON.stringify({ grant_type: "client_credentials" });
            const authCredentials = `${efiBankSecretId}:${efiBankSecretToken}`;
            const basicAuth = Buffer.from(authCredentials).toString("base64");

            const authConfig = {
                method: "POST",
                url: "https://pix.api.efipay.com.br/oauth/token",
                headers: {
                    Authorization: `Basic ${basicAuth}`,
                    "Content-Type": "application/json",
                },
                httpsAgent: httpsAgent,
                data: authData,
            };

            const authResponse = await axios(authConfig);
            const accessToken = authResponse.data.access_token;

            const today = new Date();
            const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));
            const dataInicial = sevenDaysAgo.toISOString().split('.')[0] + 'Z';
            const dataFinal = new Date().toISOString().split('.')[0] + 'Z';
            
            const listPixConfig = {
                method: 'GET',
                url: `https://pix.api.efipay.com.br/v2/cob?inicio=${dataInicial}&fim=${dataFinal}`,
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                httpsAgent: httpsAgent,
            };

            const listPixResponse = await axios(listPixConfig);
            const pixCobranças = listPixResponse.data.cobs;

            if (pixCobranças.length > 0) {
                let estornosDetectados = 0;
                for (const cob of pixCobranças) {
                    if (cob.status === 'DEVOLVIDA') {
                        const isRecorded = await refoundsDB.get(`efi_${cob.txid}`);
                        if (!isRecorded) {
                            await refoundsDB.set(`efi_${cob.txid}`, 'DEVOLVIDA');
                            estornosDetectados++;

                            const embedEstorno = new EmbedBuilder()
                                .setColor('#ff0000')
                                .setTitle(`🚨 Rembolso Detectado (Efi Bank)`)
                                .setDescription(`Uma transação Pix foi estornada/devolvida no Efi Bank. **Isso pode ser resultado de um acionamento de MED (Mecanismo Especial de Devolução).**`)
                                .addFields(
                                    { name: `**TXID (ID Pix)**`, value: `\`${cob.txid}\``, inline: true },
                                    { name: `**Valor Original**`, value: `\`R$ ${Number(cob.valor.original).toFixed(2)}\``, inline: true },
                                    { name: `**Status**`, value: `\`${cob.status}\``, inline: true },
                                    { name: `**Data da Criação**`, value: `<t:${Math.ceil(new Date(cob.calendario.criacao).getTime() / 1000)}:R>`, inline: true },
                                    { name: `**Mensagem do Pagador**`, value: `\`${cob.solicitacaoPagador || 'Não informado'}\``, inline: false },
                                );
                            await enviarMensagem(systemLogsChannel, embedEstorno);

                            const estatisticasData = estatisticas.fetchAll();
                            for (const stat of estatisticasData) {
                                if (stat.data.idpagamento === cob.txid) {
                                    estatisticas.delete(stat.ID);
                                    console.log(`Estatística do pagamento ${cob.txid} removida devido a estorno Efi Bank.`);
                                }
                            }
                        }
                    }
                }
                if (estornosDetectados === 0) {
                    console.log('Nenhum estorno (incluindo MED) detectado no Efi Bank.');
                }
            } else {
                console.log('Nenhuma cobrança Pix encontrada no período para o Efi Bank.');
            }

        } catch (error) {
            console.error('Erro ao verificar estornos do Efi Bank:', error.response?.data || error.message);
            await enviarMensagem(systemLogsChannel, new EmbedBuilder().setColor('Red').setDescription(`:x: Erro ao verificar estornos do Efi Bank: \`${error.message}\``));
        }
    } else {
        console.log('Credenciais do Efi Bank (certificado, secret_id, secret_token) não configuradas. Pulando varredura do Efi Bank.');
    }
}

module.exports = {
    Varredura
};