const { estatisticas } = require("../DataBaseJson");

class EstatisticasStorm {

    async GuildClients() {
        const todosOsUserids = estatisticas.fetchAll().map((user) => user.data.userid)
        const usuariosUnicosSet = new Set(todosOsUserids);
        const usuariosUnicos = Array.from(usuariosUnicosSet);
        return usuariosUnicos
    }

    async GuildMembers(GuildClients, client) {
        let quantidadeMembros
        await client.guilds.fetch(GuildClients)
            .then(guild => {
                if (guild) {
                    quantidadeMembros = guild.memberCount;

                } else {
                    return 0
                }
            })
            .catch(error => console.error(error));
        return quantidadeMembros
    }

    async GuildName(GuildClients, client) {
        let quantidadeMembros
        await client.guilds.fetch(GuildClients)
            .then(guild => {
                if (guild) {
                    quantidadeMembros = guild.name;

                } else {
                    return 0
                }
            })
            .catch(error => console.error(error));
        return quantidadeMembros
    }

    async SalesToday(userID = null) {
        const dataAtual = Date.now();
        const comprasUltimas24Horas = estatisticas.fetchAll().filter((user) => {
            const timestampCompra = user.data.data;
            const diferencaTempo = dataAtual - timestampCompra;
            const usuarioEspecifico = userID ? user.data.userid === userID : true;
            return diferencaTempo <= 86400000 && usuarioEspecifico;
        });
        const resultado = comprasUltimas24Horas.reduce(
            (acc, user) => {
                const { valor, quantidade } = user.data;

                acc.uuidsDasCompras.push(user.ID);
                acc.rendimentoTotal += valor;
                acc.produtosEntregue += quantidade;
                return acc;
            },
            {
                uuidsDasCompras: [],
                rendimentoTotal: 0,
                quantidadeTotal: comprasUltimas24Horas.length,
                produtosEntregue: 0
            }
        );
        return resultado
    }

    async SalesWeek(userID = null) {
        const dataAtual = Date.now();
        const comprasUltimas7Dias = estatisticas.fetchAll().filter((user) => {
            const timestampCompra = user.data.data;
            const diferencaTempo = dataAtual - timestampCompra;
            const usuarioEspecifico = userID ? user.data.userid === userID : true;
            return diferencaTempo <= 7 * 24 * 60 * 60 * 1000 && usuarioEspecifico;
        });
        const resultado = comprasUltimas7Dias.reduce(
            (acc, user) => {
                const { valor, quantidade } = user.data;

                acc.uuidsDasCompras.push(user.ID);
                acc.rendimentoTotal += valor;
                acc.produtosEntregue += quantidade;
                return acc;
            },
            {
                uuidsDasCompras: [],
                rendimentoTotal: 0,
                quantidadeTotal: comprasUltimas7Dias.length,
                produtosEntregue: 0
            }
        );
        return resultado
    }

    async SalesMonth(userID = null) {
        const dataAtual = Date.now();
        const todasAsCompras = estatisticas.fetchAll();
        const comprasFiltradas = todasAsCompras.filter((user) => {
            const timestampCompra = user.data.data;
            const diferencaTempo = dataAtual - timestampCompra;

            const usuarioEspecifico = userID ? user.data.userid === userID : true;

            return diferencaTempo <= 30 * 24 * 60 * 60 * 1000 && usuarioEspecifico;
        });

        const resultado = comprasFiltradas.reduce(
            (acc, user) => {
                const { valor, quantidade } = user.data;

                acc.uuidsDasCompras.push(user.ID);
                acc.rendimentoTotal += valor;
                acc.produtosEntregue += quantidade;
                return acc;
            },
            {
                uuidsDasCompras: [],
                rendimentoTotal: 0,
                quantidadeTotal: comprasFiltradas.length,
                produtosEntregue: 0
            }
        );

        return resultado;
    }

    async SalesTotal(userID = null) {
        const todasAsCompras = estatisticas.fetchAll();
        const comprasFiltradas = userID
            ? todasAsCompras.filter((user) => user.data.userid === userID)
            : todasAsCompras;

        const resultado = comprasFiltradas.reduce(
            (acc, user) => {
                const { valor, quantidade } = user.data;

                acc.uuidsDasCompras.push(user.ID);
                acc.rendimentoTotal += valor;
                acc.produtosEntregue += quantidade;
                return acc;
            },
            {
                uuidsDasCompras: [],
                rendimentoTotal: 0,
                quantidadeTotal: comprasFiltradas.length,
                produtosEntregue: 0
            }
        );

        return resultado;
    }


    async TotalQuanty(userID = null) {
        const todasAsCompras = estatisticas.fetchAll();
        const comprasFiltradas = userID
            ? todasAsCompras.filter((user) => user.data.userid === userID)
            : todasAsCompras;

        const todosOsValores = comprasFiltradas.map((user) => user.data.quantidade);
        const somaDosValores = todosOsValores.reduce((total, valor) => total + valor, 0);

        return somaDosValores;
    }

    async TotalSales(userID = null) {
        const todasAsCompras = estatisticas.fetchAll();
        const comprasFiltradas = userID
            ? todasAsCompras.filter((user) => user.data.userid === userID)
            : todasAsCompras;

        const todosOsValores = comprasFiltradas.map((user) => user.data.valor);
        const somaDosValores = todosOsValores.reduce((total, valor) => total + valor, 0);

        return somaDosValores;
    }

    async TotalOrders(userID = null) {
        const todosOsPedidos = estatisticas.fetchAll();
        const pedidosFiltrados = userID
            ? todosOsPedidos.filter((user) => user.data.userid === userID)
            : todosOsPedidos;
        return pedidosFiltrados.length;
    }


    async Ranking(qtd, tipo, userID = null) {
        const todosOsUsuarios = estatisticas.fetchAll();
        const somaPorUsuario = {};
        todosOsUsuarios.forEach((user) => {
            const userID = user.data.userid;
            const valor = user.data.valor;
            const quantidade = user.data.quantidade;
            const qtdCompra = user.data.qtdCompra;

            if (!somaPorUsuario[userID]) {
                somaPorUsuario[userID] = {
                    valorTotal: 0,
                    quantidadeTotal: 0,
                    qtdCompraTotal: 0,
                };
            }

            somaPorUsuario[userID].valorTotal += valor;
            somaPorUsuario[userID].quantidadeTotal += quantidade;
            somaPorUsuario[userID].qtdCompraTotal++;
        });
        const usuariosOrdenados = Object.keys(somaPorUsuario).map((userID) => ({
            userID,
            valorTotal: somaPorUsuario[userID].valorTotal,
            qtdProdutosComprados: somaPorUsuario[userID].quantidadeTotal,
            qtdCompraTotal: somaPorUsuario[userID].qtdCompraTotal,
        }));
        usuariosOrdenados.sort((a, b) => b[tipo] - a[tipo]);
        const topUsuarios = usuariosOrdenados.slice(0, qtd).map((user, index) => ({
            ...user,
            posicao: index + 1,
        }));

        const usuarioEspecifico = userID
            ? topUsuarios.find((user) => user.userID === userID)
            : null;


        return usuarioEspecifico ? usuarioEspecifico : topUsuarios;
    }

    async LastOrder(userID = null) {
        const todasAsCompras = estatisticas.fetchAll();
        const comprasFiltradas = userID
            ? todasAsCompras.filter((user) => user.data.userid === userID)
            : todasAsCompras;

        const ultimaCompra = comprasFiltradas.reduce((ultima, compra) => {
            const timestampCompra = typeof compra.data.data === 'string'
                ? parseInt(compra.data.data, 10)
                : compra.data.data;

            const timestampUltima = ultima
                ? typeof ultima.data.data === 'string'
                    ? parseInt(ultima.data.data, 10)
                    : ultima.data.data
                : 0;

            return timestampCompra > timestampUltima ? compra : ultima;
        }, null);

        return ultimaCompra;
    }

    async FirstOrder(userID = null) {
        const todasAsCompras = estatisticas.fetchAll();
        const comprasFiltradas = userID
            ? todasAsCompras.filter((user) => user.data.userid === userID)
            : todasAsCompras;

        const primeiraCompra = comprasFiltradas.reduce((primeira, compra) => {
            const timestampCompra = typeof compra.data.data === 'string'
                ? parseInt(compra.data.data, 10)
                : compra.data.data;

            const timestampPrimeira = primeira
                ? typeof primeira.data.data === 'string'
                    ? parseInt(primeira.data.data, 10)
                    : primeira.data.data
                : Infinity;

            return timestampCompra < timestampPrimeira ? compra : primeira;
        }, null);

        return primeiraCompra;
    }

    async GastouMais(userID = null, valor) {
        const todasAsCompras = estatisticas.fetchAll();

 
        const usuariosGastaramMaisQueValor = todasAsCompras.reduce((result, user) => {
            if (user.data.valor >= valor) {
                const existingUser = result.find((u) => u.userid === user.data.userid);
    
                if (existingUser) {
                    existingUser.soma += user.data.valor;
                } else {
                    result.push({
                        userid: user.data.userid,
                        soma: user.data.valor
                    });
                }
            }
            return result;
        }, []);
    
        return usuariosGastaramMaisQueValor;
    }




}

module.exports = EstatisticasStorm;