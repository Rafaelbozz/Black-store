const fs = require('fs');

const cacheFilePath = 'emojis.json';

let emojiCache = {};

function carregarCache() {
    try {
        const data = fs.readFileSync(cacheFilePath, 'utf8');
        emojiCache = JSON.parse(data);
    } catch (error) {
        emojiCache = {};
    }
}

function salvarCache() {
    const data = JSON.stringify(emojiCache);
    fs.writeFileSync(cacheFilePath, data, 'utf8');
}

function encontrarProximoNumero() {
    let proximoNumero = 1;
    while (emojiCache[proximoNumero]) {
        proximoNumero++;
    }
    return proximoNumero;
}

function adicionarEmoji(emoji) {
    const proximoNumero = encontrarProximoNumero();
    emojiCache[proximoNumero] = emoji;
    salvarCache();
}

function editarEmoji(numero, novoEmoji) {
    if (numero in emojiCache) {
        emojiCache[numero] = novoEmoji;
        salvarCache();
    } else {
   
    }
}

function obterEmoji(numero) {
    return emojiCache[numero] || null;
}

function obterTodosEmojis() {
    return Object.entries(emojiCache).map(([numero, emoji]) => `${numero} - ${emoji}`);
  }

  function verificarEmoji(numero) {
    return numero in emojiCache;
  }


module.exports = { obterEmoji, editarEmoji, adicionarEmoji, carregarCache, obterTodosEmojis, verificarEmoji };