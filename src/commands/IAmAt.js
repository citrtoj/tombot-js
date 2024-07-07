const RegexCommand = require("../RegexCommand");

const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const Discord = require("discord.js");

const getCoordinatesForCropping = (
  sourceWidth,
  sourceHeight,
  destWidth,
  destHeight
) => {
  let resObj = {
    sx: 0,
    sy: 0,
    sw: sourceWidth,
    sh: sourceHeight,
  };
  if (destHeight <= 0 || sourceHeight <= 0) {
    throw new Error("Heights cannot be 0!");
  }
  if (sourceWidth <= 0 || destWidth <= 0) {
    throw new Error("Widths cannot be 0!");
  }
  if (sourceWidth / sourceHeight >= destWidth / destHeight) {
    resObj.sw = (resObj.sh * destWidth) / destHeight;
    resObj.sx = (sourceWidth - resObj.sw) / 2;
  } else {
    resObj.sh = (destHeight * resObj.sw) / destWidth;
    resObj.sy = (sourceHeight - resObj.sh) / 2;
  }
  return resObj;
};

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
};

const prepositions = [
  "on the edge of",
  "under",
  "on top of",
  "behind",
  "in front of",
  "under",
  "over",
  "inside",
  "in",
  "outside of",
  "outside",
  "across from",
  "next to",
  "near",
  "on",
  "at",
  "up",
];
const REGEX = new RegExp(
  "\\b(tombot)[,.?!]*? (((i am|i'm) *(" +
    prepositions.join("|") +
    "))(s*)(.*)\n?)",
  "gimu"
);

const ERROR_MESSAGE = "Couldn't get there, sorry.";

const getImageFromMessage = (message) => {
  if (message.attachments.size > 0) {
    const attachment = message.attachments.find(
      (attachment) =>
        attachment.contentType && attachment.contentType.startsWith("image/")
    );

    if (!attachment) return null;
    return attachment.url;
  }
  return null;
};

const getImageFromMessageOrPrevMessage = async (message) => {
  const URL = getImageFromMessage(message);
  if (URL) {
    return URL;
  }

  if (message.reference) {
    try {
      let referencedMessage = await message.channel.messages.fetch(
        message.reference.messageId
      );
      return getImageFromMessage(referencedMessage);
    } catch (err) {
      return null;
    }
  }
};

module.exports = new RegexCommand()
  .setPattern(REGEX)
  .setGroupsRequirement(true)
  .setCalledFunction(async (message, matches) => {
    const location = matches[7].trim();
    const topText = matches[3].trim();

    console.log(matches);

    await message.channel.send(`*Travelling to ${location}...*`);

    const imgflipUsername = process.env.IMGFLIP_USERNAME;
    const imgflipToken = process.env.IMGFLIP_TOKEN;

    const googleAPIKey = process.env.GOOGLE_API_KEY;
    const googleCX = process.env.GOOGLE_CX;

    const canvasRes = {
      width: 1280,
      height: 720,
    };

    let backgroundURL;
    let imgflipURL;

    const attachmentURL = await getImageFromMessageOrPrevMessage(message);
    if (attachmentURL) {
      backgroundURL = attachmentURL;
    } else {
      try {
        const imgSearchResponse = await axios.get(
          `https://customsearch.googleapis.com/customsearch/v1?q=${location}&cx=${googleCX}&key=${googleAPIKey}&searchType=image`
        );
        let background =
          imgSearchResponse.data.items[
            Math.floor(Math.random() * imgSearchResponse.data.items.length)
          ];
        backgroundURL = background.link;
      } catch (e) {
        message.channel.send(
          ERROR_MESSAGE + " (Could not obtain background image link)"
        );
        console.error("Could not obtain background image link.", e);
        return;
      }
    }

    try {
      const imgflipTemplate = "343044476";
      const imgflipResponse = await axios.get(
        `https://api.imgflip.com/caption_image?template_id=${imgflipTemplate}&username=${imgflipUsername}&password=${imgflipToken}&text0=${topText}&text1=${location}`
      );
      imgflipURL = imgflipResponse.data.data.url;
    } catch {
      message.channel.send(
        ERROR_MESSAGE + " (Could not obtain ImgFlip image link)"
      );
      console.error("Could not obtain ImgFlip image link.", e);
      return;
    }

    try {
      const canvas = createCanvas(1280, 720);
      const secondCanvas = createCanvas(1280, 720);
      const ctx = canvas.getContext("2d");

      const bgImage = await loadImage(backgroundURL);
      const imgflipImage = await loadImage(imgflipURL);

      const backgroundResolution = {
        width: bgImage.width,
        height: bgImage.height,
      };

      const cropCoords = getCoordinatesForCropping(
        backgroundResolution.width,
        backgroundResolution.height,
        canvasRes.width,
        canvasRes.height
      );
      ctx.drawImage(
        bgImage,
        cropCoords.sx,
        cropCoords.sy,
        cropCoords.sw,
        cropCoords.sh,
        0,
        0,
        canvasRes.width,
        canvasRes.height
      );

      const secondCtx = secondCanvas.getContext("2d");
      secondCtx.drawImage(imgflipImage, 0, 0, 1280, 720);
      const chromaKeyedImage = chromaKey(
        secondCtx.getImageData(0, 0, 1280, 720)
      );
      secondCtx.putImageData(chromaKeyedImage, 0, 0);

      ctx.drawImage(secondCanvas, 0, 0, 1280, 720);
      const messageToSend = new Discord.AttachmentBuilder(canvas.toBuffer(), {
        name: "iAmAt.png",
      });
      message.channel.send({ files: [messageToSend] });
    } catch (e) {
      message.channel.send(
        ERROR_MESSAGE + " (Error getting and superimposing images)"
      );
      console.error("Error getting and superimposing images.", e);
      return;
    }
    console.log("Reached end of iAmAt function");
  });
