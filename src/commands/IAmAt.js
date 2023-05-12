const appDir = process.cwd();
const { createCanvas, loadImage } = require('canvas');
const imageDownloader = require("image-downloader");
const fs = require("fs");
const { fail } = require("assert");
const RegexCommand = require("./RegexCommand");
const axios = require("axios");
const Discord = require("discord.js");

const cropRes = (sourceWidth, sourceHeight, destWidth, destHeight) => {
    var resObj = {
        sx: 0,
        sy: 0,
        sw: sourceWidth,
        sh: sourceHeight
    }
    if (destHeight <= 0 || sourceHeight <= 0) {
        throw new Error("Heights cannot be 0!");
    }
    if (sourceWidth <= 0 || destWidth <= 0) {
        throw new Error("Widths cannot be 0!");
    }
    if (sourceWidth / sourceHeight >= destWidth / destHeight) {
        //iau height-ul full
        resObj.sw = resObj.sh * destWidth / destHeight;
        resObj.sx = (sourceWidth - resObj.sw) / 2;
    }
    else {
        //iau width-ul full
        resObj.sh = destHeight * resObj.sw / destWidth;
        resObj.sy = (sourceHeight - resObj.sh) / 2;
    }
    return resObj;
}

const chromaKey = (imageData) => {
    let data = imageData;
    for (let i = 0; i < data.data.length; i += 4) {
        let r = data.data[i];
        let g = data.data[i + 1];
        let b = data.data[i + 2];
        if ((r >= 0 && r < 127 && g >= 87 && b <= 120) || data.data[i + 3] < 100) {
            data.data[i + 3] = 0;
        }
    }
    return data;
}

const prepositions = [
    "on the edge of", "under", "on top of", "behind", "in front of", "under", "over", "inside", "in", "outside of", "outside", "across from", "next to", "near", "on", "at", "up"
];
const iAmAtRegex = new RegExp(
    "\\b(tombot)[,.?!]*? (((i am|i'm) *(" + prepositions.join('|') + "))( *)(.*?)\\b$)",
    "gimu"
    );

const failureMessage = "Couldn't get there, sorry."

module.exports = {
    iAmAt: new RegexCommand().setPattern(iAmAtRegex).setGroupsRequirement(true).setCalledFunction( async (message, matches) => {
        const location = matches[7];
        const topText  = matches[3];
        
        await message.channel.send(`*Travelling to ${location}...*`)

        const imgflipUsername = process.env.IMGFLIP_USERNAME;
        const imgflipToken = process.env.IMGFLIP_TOKEN;

        const rapidAPIToken = process.env.RAPIDAPI_TOKEN;
        const canvasRes = {
            width: 1280,
            height: 720
        }

        var backgroundURL = undefined;
        var backgroundResolution = { height: undefined, width: undefined };
        var imgflipURL = undefined;

        //FIRST STEP: get URL of either attachments or background
        try {
            const options = {
                method: 'GET',
                url: 'https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/ImageSearchAPI',
                params: {
                  q: location,
                  pageNumber: '1',
                  pageSize: '5',
                  autoCorrect: 'true'
                },
                headers: {
                  'X-RapidAPI-Key': rapidAPIToken,
                  'X-RapidAPI-Host': 'contextualwebsearch-websearch-v1.p.rapidapi.com'
                }
              };
              
            const imgSearchResponse = await axios.request(options);
            let background = imgSearchResponse.data.value[
                Math.floor(Math.random() * imgSearchResponse.data.value.length)
            ];
            backgroundURL = background.url;
            backgroundResolution = { width: background.width, height: background.height };
        }
        catch {
            message.channel.send(failureMessage + " (Could not obtain background image link)");
            return;
        }

        //SECOND STEP: get URL of imgflip
        try {
            if (true /*message.attachments.size === 0 ; I'll add more to this in the future*/) {
                const imgflipTemplate = "343044476";
                const imgflipResponse = await axios.get(
                    `https://api.imgflip.com/caption_image?template_id=${imgflipTemplate}&username=${imgflipUsername}&password=${imgflipToken}&text0=${topText}&text1=${location}`
                );
                imgflipURL = imgflipResponse.data.data.url;
                //console.log(imgflipURL);
            }
        }
        catch {
            message.channel.send(failureMessage + " (Could not obtain ImgFlip image link)");
            return;
        }
        
        //THIRD STEP: make a canvas of size 1280x720; crop BG image accordingly, greenscreen Tom, paste it on top
        var backgroundImage = undefined;
        try {
            const canvas = createCanvas(1280, 720);
            const secondCanvas = createCanvas(1280, 720);
            const ctx = canvas.getContext("2d");

            const bgImage = await loadImage(backgroundURL);
            const imgflipImage = await loadImage(imgflipURL);

            const cropCoords = cropRes(backgroundResolution.width, backgroundResolution.height, canvasRes.width, canvasRes.height);
            ctx.drawImage(bgImage, cropCoords.sx, cropCoords.sy, cropCoords.sw, cropCoords.sh, 0, 0, canvasRes.width, canvasRes.height);

            const secondCtx = secondCanvas.getContext("2d");
            secondCtx.drawImage(imgflipImage, 0, 0, 1280, 720);
            const chromaKeyedImage = chromaKey(secondCtx.getImageData(0, 0, 1280, 720));
            secondCtx.putImageData(chromaKeyedImage, 0, 0);

            ctx.drawImage(secondCanvas, 0, 0, 1280, 720);
            const messageToSend = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: "iAmAt.png" });
            message.channel.send({files: [messageToSend]})
        }
        catch (e) {
            message.channel.send(failureMessage + " (Superimposing failed)");
            console.error("Superimposing failed.", e);
            return;
        }
        console.log("Reached end of iAmAt function");
})
}