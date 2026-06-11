const { QRCodeStyling } = require('qr-code-styling-node/lib/qr-code-styling.common');
const canvas = require('canvas');

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

        this.options = createOptions(data, this.imagePath);

        this.qrCodeImage = createQRCodeStyling(canvas, this.options);

        return await getRawData(this.qrCodeImage);

    }

}

function createOptions(data, image) {
    return {
        width: 464,
        height: 464,
        data, image,
        margin: 10,
        dotsOptions: {
            color: "#000000",
            type: "dots"
        },
        backgroundOptions: {
            color: "#ffffff",
        },
        imageOptions: {
            crossOrigin: "anonymous",
            imageSize: 0.3,
            margin: 5
        },
        cornersDotOptions: {
            color: "#000000",
            type: 'dot'
        },
        cornersSquareOptions: {
            color: "#000000",
            type: 'extra-rounded'
        },
        cornersDotOptionsHelper: {
            color: "#000000",
            type: 'extra-rounded'
        }
    };
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