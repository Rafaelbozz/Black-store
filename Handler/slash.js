const fs = require("fs")
const path = require("path")

module.exports = {

  run: (client) => {

    const SlashsArray = []
    const commandNames = new Set();

    console.log(`\x1b[36m[Slash]\x1b[0m Iniciando carregamento de comandos...`);

    const pastaComandos = path.join(__dirname, '../ComandosSlash');
    
    if (!fs.existsSync(pastaComandos)) {
      console.error(`\x1b[31m[Slash]\x1b[0m Pasta ComandosSlash não encontrada!`);
      return;
    }

    const subpastas = fs.readdirSync(pastaComandos);
    console.log(`\x1b[36m[Slash]\x1b[0m Encontradas ${subpastas.length} subpastas`);

    subpastas.forEach(subpasta => {
      const caminhoSubpasta = path.join(pastaComandos, subpasta);
      
      if (!fs.statSync(caminhoSubpasta).isDirectory()) return;
      
      const arquivos = fs.readdirSync(caminhoSubpasta);
      
      arquivos.forEach(arquivo => {
        if (!arquivo.endsWith('.js')) return;
        
        try {
          const comando = require(path.join(caminhoSubpasta, arquivo));
          
          if (!comando?.name) {
            console.log(`\x1b[33m[Slash]\x1b[0m Comando sem nome: ${arquivo}`);
            return;
          }

          if (commandNames.has(comando.name)) {
            console.log(`\x1b[33m[Slash]\x1b[0m ⚠ Comando duplicado ignorado: ${comando.name} (${arquivo})`);
            return;
          }
          
          commandNames.add(comando.name);
          client.slashCommands.set(comando.name, comando);
          SlashsArray.push(comando);
          
          console.log(`\x1b[32m[Slash]\x1b[0m ✓ ${comando.name}`);
        } catch (error) {
          console.error(`\x1b[31m[Slash]\x1b[0m Erro ao carregar ${arquivo}:`, error.message);
        }
      });
    });

    console.log(`\x1b[36m[Slash]\x1b[0m Total de ${SlashsArray.length} comandos únicos carregados!`);

    client.on("ready", async () => {
      try {
        console.log(`\x1b[36m[Slash]\x1b[0m Registrando ${SlashsArray.length} comandos no Discord...`);
        await client.application.commands.set(SlashsArray);
        console.log(`\x1b[32m[Slash]\x1b[0m ✓ ${SlashsArray.length} comandos registrados com sucesso!`);
      } catch (error) {
        console.error(`\x1b[31m[Slash]\x1b[0m Erro ao registrar comandos:`, error);
        console.error(`\x1b[31m[Slash]\x1b[0m Detalhes:`, error.rawError);
      }
    })
  }
}
