const { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");
const { res } = require("../res");
const fs = require("fs");
const path = require("path");
const https = require("https");
const axios = require("axios");

async function efiConfigs(interaction) {
    const sistema = configuracao.get(`pagamentos.sistema_efi`) ? "🟢 Habilitado" : "🔴 Desabilitado";
    
    const secretToken = configuracao.get("pagamentos.secret_token");
    const secretId = configuracao.get("pagamentos.secret_id");
    const certificado = configuracao.get("pagamentos.certificado");
    const chavePix = configuracao.get("pagamentos.chavepix");
    
    let statusCredenciais;
    let statusCertificado = "❌ Não configurado";
    
    if (secretToken && secretId && certificado) {
        statusCredenciais = "🟢 Configuradas";
        statusCertificado = "🟢 Configurado Corretamente";
    } else if (secretToken && secretId) {
        statusCredenciais = "🟡 Falta certificado";
        statusCertificado = "❌ Falta o certificado .p12";
    } else if (secretToken || secretId) {
        statusCredenciais = "🟡 Incompleto";
        statusCertificado = "❌ Não configurado";
    } else {
        statusCredenciais = "❌ Não configurado";
    }

    let saldoInfo = "❌ Não configurado";
    
    if (secretToken && secretId && certificado) {
        try {
            const certificadoPath = path.join(__dirname, '..', 'Lib', `${certificado}.p12`);
            
            if (fs.existsSync(certificadoPath)) {
                const certificadoBuffer = fs.readFileSync(certificadoPath);
                const authData = Buffer.from(`${secretId}:${secretToken}`).toString("base64");
                
                const agent = new https.Agent({ 
                    pfx: certificadoBuffer, 
                    passphrase: "",
                    rejectUnauthorized: true
                });

                const tokenResponse = await axios.post(
                    "https://pix.api.efipay.com.br/oauth/token",
                    { grant_type: "client_credentials" },
                    {
                        headers: {
                            Authorization: `Basic ${authData}`,
                            "Content-Type": "application/json",
                        },
                        httpsAgent: agent,
                        timeout: 10000
                    }
                );

                const access_token = tokenResponse.data.access_token;

                const saldoResponse = await axios.get("https://pix.api.efipay.com.br/v2/gn/saldo", {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                    httpsAgent: agent,
                    timeout: 10000
                });

                const saldo = parseFloat(saldoResponse.data.saldo || 0);
                saldoInfo = `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        } catch (error) {
            saldoInfo = "🟡 Não Foi Possível Consultar";
        }
    }

    const rowActions = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("efi_alterar_credenciais")
            .setLabel('Alterar Credenciais')
            .setEmoji(Emojis.get('_lapis_emoji') ? Emojis.get('_lapis_emoji').match(/\d+/)?.[0] : '✏️')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("efi_toggle_sistema")
            .setLabel(configuracao.get(`pagamentos.sistema_efi`) ? "Desabilitar" : "Habilitar")
            .setEmoji(`1384035207598051431`)
            .setStyle(configuracao.get(`pagamentos.sistema_efi`) ? 4 : 3)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`formasdepagamentos`)
            .setLabel(`Voltar`)
            .setEmoji(`${Emojis.get(`_back_emoji`) || '⬅️'}`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `**Configurar Efi Bank**` },
        { type: 14 },
        { type: 10, content: `Aqui, você pode configurar tudo referente ao Efi Bank. Pode definir ou redefinir suas credenciais, habilitar ou desabilitar o sistema de pagamentos.` },
        { type: 10, content: `**Informações Atuais**\n> - **Status do Sistema:** \`${sistema}\`\n> - **Credenciais:** \`${statusCredenciais}\`\n> - **Certificado:** \`${statusCertificado}\`\n> - **Saldo na Efi:** \`${saldoInfo}\`` },
        { type: 14 }
    ).with({
        components: [rowActions, rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

async function efiToggleSistema(interaction) {
    const atual = configuracao.get(`pagamentos.sistema_efi`) || false;
    configuracao.set("pagamentos.sistema_efi", !atual);
    await efiConfigs(interaction);
}

async function efiModalCredenciais(interaction) {
    const modal = new ModalBuilder()
        .setCustomId(`efi_modal_credenciais`)
        .setTitle(`Credenciais Efi Bank`);

    const clientid = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId("efi_clientid")
            .setLabel("CLIENT ID")
            .setPlaceholder("Client_id_XxxXxXx")
            .setValue(`${configuracao.get(`pagamentos.secret_id`) || ""}`)
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
    );

    const clientsecret = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId("efi_clientsecret")
            .setLabel("CLIENT SECRET")
            .setPlaceholder("Client_secret_XxxXxXx")
            .setValue(`${configuracao.get(`pagamentos.secret_token`) || ""}`)
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
    );

    modal.addComponents(clientid, clientsecret);
    await interaction.showModal(modal);
}

async function efiHandleModalCredenciais(interaction) {
    const clientid = interaction.fields.getTextInputValue("efi_clientid").trim();
    const clientsecret = interaction.fields.getTextInputValue("efi_clientsecret").trim();

    console.log('[EfiBank] Iniciando configuração...');
    console.log('[EfiBank] Client ID:', clientid.substring(0, 10) + '...');

    await interaction.reply({
        content: `${Emojis.get(`checker`) || '✅'} **Etapa 1/3 concluída!**\n> Agora envie o certificado **.p12** neste canal.\n> Você tem 2 minutos para enviar o arquivo.`,
        ephemeral: true
    });

    const filter = (msg) => {
        if (msg.author.id !== interaction.user.id) return false;
        if (!msg.attachments.size) return false;
        const file = msg.attachments.first();
        return file.name.toLowerCase().endsWith('.p12');
    };

    try {
        const collected = await interaction.channel.awaitMessages({
            filter,
            max: 1,
            time: 120000,
            errors: ['time']
        });

        const msg = collected.first();
        const file = msg.attachments.first();
        
        await interaction.editReply({
            content: `${Emojis.get(`loading`) || '⏳'} **Etapa 2/3: Baixando certificado...**`,
            ephemeral: true
        });

        const libPath = path.join(__dirname, '..', 'Lib');
        
        if (!fs.existsSync(libPath)) {
            fs.mkdirSync(libPath, { recursive: true });
        }

        const certificateName = file.name.replace('.p12', '');
        const certificatePath = path.join(libPath, file.name);

        console.log('[EfiBank] Baixando certificado:', file.name);

        try {
            const response = await axios.get(file.url, { 
                responseType: 'arraybuffer',
                headers: { 'Accept': 'application/octet-stream' },
                timeout: 30000
            });

            fs.writeFileSync(certificatePath, Buffer.from(response.data));
            console.log('[EfiBank] Certificado salvo com sucesso');
        } catch (downloadError) {
            console.error('[EfiBank] Erro ao baixar certificado:', downloadError.message);
            throw new Error('DOWNLOAD_FAILED');
        }

        await interaction.editReply({
            content: `${Emojis.get(`loading`) || '⏳'} **Etapa 3/3: Validando credenciais na API Efi...**\n> Isso pode levar alguns segundos...`,
            ephemeral: true
        });
        
        const certificadoBuffer = fs.readFileSync(certificatePath);
        const authData = Buffer.from(`${clientid}:${clientsecret}`).toString("base64");
        
        console.log('[EfiBank] Criando agente HTTPS com certificado...');
        
        let agent;
        try {
            agent = new https.Agent({ 
                pfx: certificadoBuffer, 
                passphrase: "",
                rejectUnauthorized: true
            });
        } catch (agentError) {
            console.error('[EfiBank] Erro ao criar agente HTTPS:', agentError.message);
            throw new Error('INVALID_CERTIFICATE');
        }

        console.log('[EfiBank] Solicitando token de acesso...');

        let tokenResponse;
        try {
            tokenResponse = await axios.post(
                "https://pix.api.efipay.com.br/oauth/token",
                { grant_type: "client_credentials" },
                {
                    headers: {
                        Authorization: `Basic ${authData}`,
                        "Content-Type": "application/json",
                    },
                    httpsAgent: agent,
                    timeout: 15000
                }
            );
        } catch (tokenError) {
            console.error('[EfiBank] Erro ao obter token:', tokenError.response?.status, tokenError.response?.data || tokenError.message);
            
            if (tokenError.response?.status === 401) {
                throw new Error('INVALID_CREDENTIALS');
            } else if (tokenError.response?.status === 403) {
                throw new Error('FORBIDDEN');
            } else if (tokenError.code === 'ECONNREFUSED' || tokenError.code === 'ETIMEDOUT') {
                throw new Error('CONNECTION_FAILED');
            } else if (tokenError.message.includes('certificate')) {
                throw new Error('CERTIFICATE_ERROR');
            }
            throw new Error('TOKEN_FAILED');
        }

        const access_token = tokenResponse.data.access_token;
        console.log('[EfiBank] Token obtido com sucesso!');
        
        console.log('[EfiBank] Buscando chaves PIX...');
        
        let chavepix = '';
        try {
            const chavesPixResponse = await axios.get("https://pix.api.efipay.com.br/v2/gn/evp", {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                },
                httpsAgent: agent,
                timeout: 15000
            });

            if (chavesPixResponse.data.chaves && chavesPixResponse.data.chaves.length > 0) {
                chavepix = chavesPixResponse.data.chaves[0];
                console.log('[EfiBank] Chave PIX encontrada:', chavepix);
            } else {
                console.log('[EfiBank] Nenhuma chave encontrada, criando nova...');
                const novaChaveResponse = await axios.post("https://pix.api.efipay.com.br/v2/gn/evp", {}, {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                    httpsAgent: agent,
                    timeout: 15000
                });
                chavepix = novaChaveResponse.data.chave;
                console.log('[EfiBank] Nova chave PIX criada:', chavepix);
            }
        } catch (pixError) {
            console.error('[EfiBank] Erro ao gerenciar chave PIX:', pixError.response?.data || pixError.message);
            throw new Error('PIX_KEY_FAILED');
        }

        console.log('[EfiBank] Salvando configurações...');
        configuracao.set(`pagamentos.certificado`, certificateName);
        configuracao.set(`pagamentos.secret_id`, clientid);
        configuracao.set(`pagamentos.chavepix`, chavepix);
        configuracao.set(`pagamentos.secret_token`, clientsecret);

        await msg.delete().catch(() => {});

        console.log('[EfiBank] Configuração concluída com sucesso!');

        await interaction.editReply({
            content: `${Emojis.get(`checker`) || '✅'} **Configuração do Efi Bank concluída com sucesso!**\n\n> ${Emojis.get('pix') || '💳'} **Chave Pix:** \`${chavepix}\`\n> ${Emojis.get('_fixe_emoji') || '📌'} **Certificado:** \`${certificateName}.p12\`\n> ${Emojis.get('checker') || '✅'} **Status:** Sistema pronto para uso!`,
            ephemeral: true
        });

    } catch (error) {
        console.error('[EfiBank] Erro geral:', error);

        let errorMessage = '';
        
        if (error.message === 'time') {
            errorMessage = `${Emojis.get(`negative`) || '❌'} **Tempo esgotado!**\n\n> Você não enviou o certificado .p12 a tempo.\n> Por favor, tente novamente.`;
        } else if (error.message === 'DOWNLOAD_FAILED') {
            errorMessage = `${Emojis.get(`negative`) || '❌'} **Erro ao baixar o certificado!**\n\n> Não foi possível baixar o arquivo .p12.\n> Tente enviar novamente.`;
        } else if (error.message === 'INVALID_CERTIFICATE') {
            errorMessage = `${Emojis.get(`negative`) || '❌'} **Certificado inválido!**\n\n> O arquivo .p12 está corrompido ou inválido.\n> Baixe novamente do painel Efi Bank.`;
        } else if (error.message === 'INVALID_CREDENTIALS') {
            errorMessage = `${Emojis.get(`negative`) || '❌'} **Credenciais inválidas!**\n\n> O **Client ID** ou **Client Secret** estão incorretos.\n> Verifique no painel Efi Bank e tente novamente.\n\n[Tutorial de configuração](https://www.youtube.com/watch?v=phi1GmiQuXM)`;
        } else if (error.message === 'FORBIDDEN') {
            errorMessage = `${Emojis.get(`negative`) || '❌'} **Acesso negado!**\n> Suas credenciais não têm permissão para acessar a API PIX.\n> Verifique se sua conta Efi está ativa e com PIX habilitado.`;
        } else if (error.message === 'CONNECTION_FAILED') {
            errorMessage = `${Emojis.get(`negative`) || '❌'} **Erro de conexão!**\n\n> Não foi possível conectar à API do Efi Bank.\n> Verifique sua conexão com a internet e tente novamente.`;
        } else if (error.message === 'CERTIFICATE_ERROR') {
            errorMessage = `${Emojis.get(`negative`) || '❌'} **Erro no certificado!**\n\n> O certificado .p12 não corresponde às credenciais fornecidas.\n> Certifique-se de usar o certificado correto da sua conta Efi.`;
        } else if (error.message === 'TOKEN_FAILED') {
            errorMessage = `${Emojis.get(`negative`) || '❌'} **Erro ao obter token!**\n\n> Não foi possível autenticar na API Efi.\n> Verifique se as credenciais e certificado estão corretos.`;
        } else if (error.message === 'PIX_KEY_FAILED') {
            errorMessage = `${Emojis.get(`negative`) || '❌'} **Erro ao gerenciar chave PIX!**\n\n> As credenciais são válidas, mas houve erro ao buscar/criar a chave PIX.\n> Verifique se sua conta tem PIX habilitado no painel Efi.`;
        } else {
            errorMessage = `${Emojis.get(`negative`) || '❌'} **Erro desconhecido!**\n\n> Ocorreu um erro inesperado durante a configuração.\n> Detalhes: \`${error.message}\`\n\n[Tutorial de configuração](https://www.youtube.com/watch?v=phi1GmiQuXM)`;
        }

        await interaction.editReply({
            content: errorMessage,
            ephemeral: true
        }).catch(console.error);
    }
}

module.exports = {
    efiConfigs,
    efiToggleSistema,
    efiModalCredenciais,
    efiHandleModalCredenciais
}
