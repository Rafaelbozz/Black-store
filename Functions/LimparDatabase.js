const fs = require('fs');

function limparDatabase() {
    const caminhoArquivo = './DataBaseJson/carrinhos.json';
    const dadosVazios = '{}';

    fs.writeFile(caminhoArquivo, dadosVazios, (err) => {
        if (err) {
            console.error('Erro ao limpar a database:', err);
            return;
        }
        console.log('Database limpa com sucesso.');
    });
}

module.exports = {
    limparDatabase
};
