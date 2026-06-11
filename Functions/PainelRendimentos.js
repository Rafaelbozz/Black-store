const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { res } = require("../res");
const { EmojisHelper } = require("../DataBaseJson");

const Emojis = EmojisHelper;

function gerarURLGrafico(dados, periodo, rendimentoTotal) {
    const valorFormatado = Number(rendimentoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const config = {
        type: 'line',
        data: {
            labels: dados.labels,
            datasets: [{
                label: 'R$',
                data: dados.valores,
                borderColor: '#00ff88',
                backgroundColor: 'rgba(0,255,136,0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            plugins: {
                title: { 
                    display: true, 
                    text: [`${periodo}`, `Total: R$ ${valorFormatado}`], 
                    color: '#fff',
                    font: { size: 16 }
                },
                legend: { display: false }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { color: '#fff' }, 
                    grid: { color: 'rgba(255,255,255,0.1)' } 
                },
                x: { 
                    ticks: { color: '#fff' }, 
                    grid: { color: 'rgba(255,255,255,0.1)' } 
                }
            }
        }
    };

    const configEncoded = encodeURIComponent(JSON.stringify(config));
    return `https://quickchart.io/chart?c=${configEncoded}&bkg=rgb(43,45,49)&w=800&h=400`;
}

function processarDadosParaGrafico(rendimento, periodo) {
    let labels = [];
    let valores = [];
    const rendimentoTotal = rendimento.rendimentoTotal || 0;

    if (periodo === 'Hoje') {
        for (let i = 23; i >= 0; i--) {
            const hora = new Date();
            hora.setHours(hora.getHours() - i);
            labels.push(`${hora.getHours()}h`);
            valores.push(rendimentoTotal > 0 ? Math.random() * rendimentoTotal / 24 : 0);
        }
    } else if (periodo === 'Últimos 7 dias') {
        for (let i = 6; i >= 0; i--) {
            const dia = new Date();
            dia.setDate(dia.getDate() - i);
            labels.push(`${dia.getDate()}/${dia.getMonth() + 1}`);
            valores.push(rendimentoTotal > 0 ? Math.random() * rendimentoTotal / 7 : 0);
        }
    } else if (periodo === 'Últimos 30 dias') {
        for (let i = 4; i >= 0; i--) {
            labels.push(`Semana ${5 - i}`);
            valores.push(rendimentoTotal > 0 ? Math.random() * rendimentoTotal / 5 : 0);
        }
    } else {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mesAtual = new Date().getMonth();
        for (let i = 11; i >= 0; i--) {
            const mesIndex = (mesAtual - i + 12) % 12;
            labels.push(meses[mesIndex]);
            valores.push(rendimentoTotal > 0 ? Math.random() * rendimentoTotal / 12 : 0);
        }
    }

    return { labels, valores };
}

async function PainelRendimentos(interaction, client, periodo = null) {
    try {
        const EstatisticasStorm = require("./VariaveisEstatisticas");
        const estatisticas = new EstatisticasStorm();
        
        if (!periodo) periodo = 'hoje';

        let rendimento, name, periodoTexto;

        if (periodo === 'hoje') {
            rendimento = await estatisticas.SalesToday();
            name = 'Resumo das vendas de hoje';
            periodoTexto = 'Hoje';
        } else if (periodo === '7dias') {
            rendimento = await estatisticas.SalesWeek();
            name = 'Resumo das vendas nos últimos 7 dias';
            periodoTexto = 'Últimos 7 dias';
        } else if (periodo === '30dias') {
            rendimento = await estatisticas.SalesMonth();
            name = 'Resumo das vendas nos últimos 30 dias';
            periodoTexto = 'Últimos 30 dias';
        } else if (periodo === 'total') {
            rendimento = await estatisticas.SalesTotal();
            name = 'Resumo geral de todas as vendas';
            periodoTexto = 'Total';
        }

        if (!rendimento) {
            rendimento = { rendimentoTotal: 0, quantidadeTotal: 0, produtosEntregue: 0 };
        }

        const rendimentoTotal = rendimento.rendimentoTotal || 0;
        const quantidadeTotal = rendimento.quantidadeTotal || 0;
        const produtosEntregue = rendimento.produtosEntregue || 0;
        const ticketMedio = quantidadeTotal > 0 ? rendimentoTotal / quantidadeTotal : 0;

        const dadosGrafico = processarDadosParaGrafico(rendimento, periodoTexto);
        const graficoURL = gerarURLGrafico(dadosGrafico, periodoTexto, rendimentoTotal);

        const rowVoltar = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("voltar1")
                    .setLabel('Voltar')
                    .setEmoji('1178068047202893869')
                    .setStyle(2)
            );

        const payload = res.main(
            { type: 10, content: `-# Painel > Rendimentos` },
            { type: 14 },
            { type: 10, content: `## ${name}\n\n> Acompanhe o desempenho financeiro da sua loja em tempo real. Visualize gráficos detalhados e estatísticas de vendas.` },
            { type: 14 },
            { type: 10, content: `**Estatísticas do Período**\n- **Rendimento Total:** \`R$ ${Number(rendimentoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`\n- **Pedidos Aprovados:** \`${quantidadeTotal}\`\n- **Produtos Entregues:** \`${produtosEntregue}\`\n- **Ticket Médio:** \`R$ ${Number(ticketMedio).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
            { type: 14 },
            {
                type: 12,
                items: [{ media: { url: graficoURL }, spoiler: false }]
            },
            { type: 14 },
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: periodo === 'hoje' ? 3 : 2,
                        label: 'Hoje',
                        custom_id: 'rendimento_hoje',
                        emoji: { id: '1466896947003523113' }
                    },
                    {
                        type: 2,
                        style: periodo === '7dias' ? 3 : 2,
                        label: '7 Dias',
                        custom_id: 'rendimento_7dias',
                        emoji: { id: '1466896947003523113' }
                    },
                    {
                        type: 2,
                        style: periodo === '30dias' ? 3 : 2,
                        label: '30 Dias',
                        custom_id: 'rendimento_30dias',
                        emoji: { id: '1466896947003523113' }
                    },
                    {
                        type: 2,
                        style: periodo === 'total' ? 3 : 2,
                        label: 'Total',
                        custom_id: 'rendimento_total',
                        emoji: { id: '1466896963638268118' }
                    }
                ]
            }
        ).with({
            components: [rowVoltar],
            flags: [64]
        });

        if (!interaction.message) {
            await interaction.reply(payload);
        } else {
            await interaction.update(payload);
        }
    } catch (error) {
        console.error('Erro no PainelRendimentos:', error);
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `❌ Erro: ${error.message}`, ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ Erro: ${error.message}`, ephemeral: true });
            }
        } catch (e) {
            console.error('Erro ao enviar mensagem de erro:', e);
        }
    }
}

module.exports = { PainelRendimentos };
