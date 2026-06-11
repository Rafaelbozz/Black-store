const fs = require('fs');
const path = require('path');

module.exports = {
    run: (client) => {
        fs.readdirSync('./Eventos/').forEach(local => {
            const fullPath = path.join('./Eventos/', local);

            if (fs.statSync(fullPath).isDirectory()) {
                const eventFiles = fs.readdirSync(fullPath).filter(arquivo => arquivo.endsWith('.js'));
                for (const file of eventFiles) {
                    const event = require(`../Eventos/${local}/${file}`);

                    if (event.once) {
                        client.once(event.name, (...args) => event.run(...args, client));
                    } else {
                        client.on(event.name, (...args) => event.run(...args, client));
                    }
                }
            }
        });
    }
};