const { QRCodeStyling } = require('qr-code-styling-node/lib/qr-code-styling.common');
const canvas = require('canvas');
const { configuracao } = require('../DataBaseJson');

/**
 * @param {string} data
 * @param {string} imagePath
 */

class qrGenerator {
    constructor(
        {
            imagePath: imagePath,
        }
    ) {
        this.imagePath = imagePath
    }

    generate = async function (data) {

        try {
            this.options = createOptions(data, this.imagePath);

            console.log('[QRCODE LIB] Opções criadas:', JSON.stringify({
                principal: this.options.dotsOptions.color,
                lateral: this.options.cornersDotOptions.color,
                background: this.options.backgroundOptions.color
            }));

            this.qrCodeImage = createQRCodeStyling(canvas, this.options);

            return await getRawData(this.qrCodeImage);
        } catch (error) {
            console.error('[QRCODE LIB] Erro ao gerar QRCode:', error);
            return {
                status: 'error',
                response: error
            };
        }

    }

}

function createOptions(data, image) {
    const qrConfig = configuracao.get("QRCode") || {};
    
    const principal = validarCor(qrConfig.principal) || "#000000";
    const lateral = validarCor(qrConfig.lateral) || "#0A3D3E";
    const brilho = validarCor(qrConfig.brilho) || "#B19CD9";

    console.log('[QRCODE LIB] Cores validadas:', { principal, lateral, brilho });

    return {
        width: 464,
        height: 464,
        data, 
        image,
        margin: 10,
        dotsOptions: {
            color: principal,
            type: "dots"
        },
        backgroundOptions: {
            color: "#ffffff"
        },
        imageOptions: {
            crossOrigin: "anonymous",
            imageSize: 0.3,
            margin: 5
        },
        cornersDotOptions: {
            color: lateral,
            type: 'dot'
        },
        cornersSquareOptions: {
            color: lateral,
            type: 'extra-rounded'
        }
    };
}

function validarCor(cor) {
    if (!cor || typeof cor !== 'string') return null;
    
    cor = cor.trim();
    
    if (!cor.startsWith('#')) {
        cor = '#' + cor;
    }
    
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    if (hexRegex.test(cor)) {
        return cor.toUpperCase();
    }
    
    console.warn('[QRCODE LIB] Cor inválida:', cor);
    return null;
}

function createQRCodeStyling(nodeCanvas, options) {
    return new QRCodeStyling({
        nodeCanvas, ...options
    });
}

async function getRawData(qrCodeImage) {
    return qrCodeImage.getRawData("png").then(r => {
        return {
            status: 'success',
            response: r.toString('base64')
        }
    }).catch(e => {
        return {
            status: 'error',
            response: e
        }
    });
}

module.exports.qrGenerator = qrGenerator;