const { EmbedBuilder } = require("discord.js");
const { configuracao } = require("../DataBaseJson");
const axios = require("axios");
const fs = require("fs");
const https = require("https");

/**
 * Realiza reembolso automático quando há problemas com o pedido
 * @param {Object} params - Parâmetros do reembolso
 * @param {Object} params.client - Cliente do Discord
 * @param {Object} params.entrega - Dados da entrega (deve conter: { ID, data: { id, method } })
 * @param {Object} params.yy - Dados do carrinho
 * @param {number} params.valor - Valor a ser reembolsado
 * @param {string} params.motivo - Motivo do reembolso
 * @param {number} params.estoqueDisponivel - Estoque disponível (opcional)
 * @returns {Promise<boolean>} - Retorna true se o reembolso foi bem-sucedido
 */
async function ReembolsoAutomatico({ client, entrega, yy, valor, motivo, estoqueDisponivel = null }) {
    let reembolsoSucesso = false;
    let metodoPagamento = entrega.data.method;
    let mensagemErro = null;

    try {
        if (metodoPagamento === 'pix' && entrega.data.id !== 'Aprovado Manualmente') {
            await axios.post(`https://api.mercadopago.com/v1/payments/${entrega.data.id}/refunds`, {}, {
                headers: {
                    'Authorization': `Bearer ${configuracao.get('pagamentos.MpAPI')}`
                }
            });
            reembolsoSucesso = true;
            
        } else if (metodoPagamento === 'misticpay' && entrega.data.id !== 'Aprovado Manualmente') {
            const clientId = configuracao.get('pagamentos.mistclientid');
            const clientSecret = configuracao.get('pagamentos.misticsecret');
            
            if (clientId && clientSecret) {
                await axios.post('https://api.misticpay.com/api/transactions/refund', {
                    transactionId: entrega.data.id
                }, {
                    headers: { 
                        'ci': clientId, 
                        'cs': clientSecret, 
                        'Content-Type': 'application/json' 
                    },
                    timeout: 10000
                });
                reembolsoSucesso = true;
            } else {
                mensagemErro = 'Credenciais Mistic Pay não configuradas';
            }
            
        } else if (metodoPagamento === 'efibank' && entrega.data.id !== 'Aprovado Manualmente') {
            try {
                const certificadoPath = `./Lib/${configuracao.get("pagamentos.certificado")}.p12`;
                const certificado = fs.readFileSync(certificadoPath);
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
                
                const accessToken = tokenRes.data.access_token;
                
                const cobResponse = await axios.get(`https://pix.api.efipay.com.br/v2/cob/${entrega.data.id}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    httpsAgent,
                    timeout: 10000
                });
                
                if (cobResponse.data.pix && cobResponse.data.pix.length > 0) {
                    const pixRecebido = cobResponse.data.pix[0];
                    const e2eid = pixRecebido.endToEndId;
                    const valorRecebido = parseFloat(pixRecebido.valor);
                    
                    const timestamp = Date.now().toString();
                    const random = Math.random().toString(36).substring(2, 9);
                    const idDevolucao = `DEV${timestamp}${random}`.substring(0, 35);
                    
                    const devolucaoResponse = await axios.put(
                        `https://pix.api.efipay.com.br/v2/pix/${e2eid}/devolucao/${idDevolucao}`,
                        { valor: valorRecebido.toFixed(2) },
                        {
                            headers: { 
                                Authorization: `Bearer ${accessToken}`,
                                "Content-Type": "application/json"
                            },
                            httpsAgent,
                            timeout: 10000
                        }
                    );
                    
                    if (devolucaoResponse.data.status === 'EM_PROCESSAMENTO' || devolucaoResponse.data.status === 'DEVOLVIDO') {
                        reembolsoSucesso = true;
                    } else {
                        mensagemErro = `Status inesperado: ${devolucaoResponse.data.status}`;
                    }
                } else {
                    mensagemErro = 'Nenhum PIX recebido encontrado para esta cobrança';
                }
                
            } catch (efiError) {
                mensagemErro = efiError.response?.data?.mensagem || efiError.response?.data?.message || efiError.message;
            }
            
        } else if (metodoPagamento === 'imap') {
            mensagemErro = 'Método IMAP não suporta reembolso automático';
            
        } else if (entrega.data.id === 'Aprovado Manualmente') {
            mensagemErro = 'Pagamento aprovado manualmente - reembolso manual necessário';
        }
        
    } catch (error) {
        mensagemErro = error.response?.data?.message || error.message;
        reembolsoSucesso = false;
    }

    try {
        const embedCliente = new EmbedBuilder()
            .setColor(configuracao.get(`Cores.Erro`) || '#ff0000')
            .setAuthor({ name: yy.guild.name, iconURL: yy.guild.iconURL })
            .setTitle(`Reembolso Automático`)
            .setDescription(`Olá, infelizmente alguém comprou o produto antes de você e não teve estoque suficiente, seu dinheiro foi reembolsado automaticamente pelo nosso sistema.`)
            .addFields({
                name: `Informações da Compra`,
                value: [
                    `- ID do Pedido: \`${entrega.data.id}\``,
                    `- Produto: \`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo}\``,
                    `- Valor: \`R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``,
                    `- Status do Reembolso: ${reembolsoSucesso ? '`🟢 Sucesso`' : '`🟡 Pendente (Abra Ticket pra pedir o reembolso manual)`'}`
                ].join('\n')
            })
            .setFooter({ text: yy.guild.name, iconURL: yy.guild.iconURL })
            .setTimestamp();

        try {
            const member = await client.users.fetch(yy.user.id);
            await member.send({ embeds: [embedCliente] });
        } catch (error) {
        }

        try {
            const threadChannel = await client.channels.fetch(entrega.ID);
            const messages = await threadChannel.messages.fetch({ limit: 100 });
            await threadChannel.bulkDelete(messages).catch(() => {});
            
            const embedCarrinho = new EmbedBuilder()
                .setColor(reembolsoSucesso ? '#40fc04' : '#ff6b00')
                .setAuthor({ name: yy.guild.name, iconURL: yy.guild.iconURL })
                .setTitle('Sistema de Reembolso - Ilusion Shield')
                .setDescription(
                    reembolsoSucesso 
                        ? `Olá <@${yy.user.id}>! Identificamos que o estoque deste produto acabou momentos antes da finalização do seu pedido, pois outro cliente realizou a compra simultaneamente.\n\nNão se preocupe! Seu pagamento foi **reembolsado automaticamente**.`
                        : `Olá <@${yy.user.id}>! Identificamos que o estoque deste produto acabou momentos antes da finalização do seu pedido, pois outro cliente realizou a compra simultaneamente.\n\nInfelizmente, não foi possível processar o reembolso automaticamente. Por favor, **entre em contato com o suporte** para solicitar o reembolso manual.`
                )
                .addFields(
                    {
                        name: 'Informações da Compra',
                        value: [
                            `- **Produto:** \`${yy.infos.produto} - ${yy.infos.campo}\``,
                            `- **Quantidade:** \`${yy.quantidadeselecionada}\``,
                            `- **Valor:** \`R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``
                        ].join('\n')
                    },
                    {
                        name: 'Status do Reembolso',
                        value: reembolsoSucesso 
                            ? '`Realizado com Sucesso`' 
                            : `\`Reembolso Manual Necessário\`${mensagemErro ? `\n**Motivo:** \`${mensagemErro}\`` : ''}\n-# Informe ao suporte o ID do pedido: \`${entrega.data.id}\``
                    }
                )
                .setFooter({ text: 'Sistema de Segurança', iconURL: yy.guild.iconURL })
                .setTimestamp();

            await threadChannel.send({ embeds: [embedCarrinho] });

            setTimeout(async () => {
                try {
                    await threadChannel.delete();
                } catch (error) {
                }
            }, 120000);
        } catch (error) {
        }

        try {
            const lk = yy.replys;
            const channelStaff = await client.channels.fetch(lk.channelid);
            const msgStaff = await channelStaff.messages.fetch(lk.idmsg);
            
            const embedStaff = new EmbedBuilder()
                .setColor(reembolsoSucesso ? '#40fc04' : '#ff0000')
                .setAuthor({ 
                    name: `Pedido #${entrega.data.id}`, 
                    iconURL: 'https://cdn.discordapp.com/emojis/1249486723520397314.png' 
                })
                .setTitle(reembolsoSucesso ? 'Reembolso Automático Realizado' : 'Reembolso Manual Necessário')
                .setDescription(`O usuário <@${yy.user.id}> teve o pagamento reembolsado devido à falta de estoque. ${reembolsoSucesso ? 'O reembolso foi processado automaticamente pelo sistema.' : 'O reembolso automático falhou e requer ação manual.'}`)
                .addFields(
                    { 
                        name: 'Detalhes do Pedido', 
                        value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` 
                    },
                    { 
                        name: 'Status do Reembolso', 
                        value: reembolsoSucesso ? '`Reembolsado automaticamente`' : `\`Reembolso manual necessário\`${mensagemErro ? `\n**Motivo:** \`${mensagemErro}\`` : ''}` 
                    }
                )
                .setFooter({ text: yy.guild.name, iconURL: yy.guild.iconURL })
                .setTimestamp();
            
            await msgStaff.reply({ embeds: [embedStaff] });
        } catch (error) {
        }

    } catch (error) {
    }

    return reembolsoSucesso;
}

module.exports = {
    ReembolsoAutomatico
};
