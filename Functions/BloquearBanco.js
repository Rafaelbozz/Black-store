const { configuracao } = require("../DataBaseJson");
const axios = require('axios');

async function BloquearBanco(client, bank, id, yy, msg) {
    const nomeAmigavel = {
        'Nu Pagamentos S.A.': 'nu',
        'Mercadopago.com Representações Ltda.': 'mp',
        'Banco do Brasil S.A.': 'bdb',
        'Caixa Econômica Federal': 'caixa',
        'Banco Itaú Unibanco S.A.': 'itau',
        'Banco Bradesco S.A.': 'bradesco',
        'Banco Inter S.A.': 'inter',
        'Neon Pagamentos S.A.': 'neon',
        'Original S.A.': 'original',
        'Next': 'next',
        'Agibank': 'agibank',
        'Santander (Brasil) S.A.': 'santander',
        'C6 Bank S.A.': 'c6',
        'Banrisul': 'banrisul',
        'PagSeguro Internet S.A.': 'pagseguro',
        'Picpay Serviços S.A.': 'picpay',
        'Modalmais': 'modalmais'
    };

    function obterNomeSimplificado(entidade) {
        return nomeAmigavel[entidade] || entidade;
    }

    const ggggggg = configuracao.get('pagamentos.BancosBloqueados')
    const arrayLowerCase = ggggggg.map(item => item.toLowerCase());
    const nomeSimplificadoPayer = obterNomeSimplificado(bank)

    if (arrayLowerCase.includes(nomeSimplificadoPayer) == true) {

        await axios.post(`https://api.mercadopago.com/v1/payments/${id}/refunds`, {}, {
            headers: {
                'Authorization': `Bearer ${configuracao.get('pagamentos.MpAPI')}`
            }
        });

        return { status: 400, message: `Banco Bloqueado` }

    }
}

module.exports = { BloquearBanco }