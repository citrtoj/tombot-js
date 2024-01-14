import OpenAI from "openai";
const RegexCommand = require("../RegexCommand");


var GPTMessages = new Map();


const GPT = new RegexCommand().setPattern(
    /\b^(?:(tomgpt[,. ]*?\s*))(.*)/gimu
).setGroupsRequirement(true).setCalledFunction(
    async (message, groups) => {
        let prompt = groups[2];
        if (/^reset$/gimu.exec(prompt.trim()) !== null) {
            if (GPTMessages.has(message.channel.id)) {
                GPTMessages.set(message.channel.id, []);
            }
        }
        if (!GPTMessages.has(message.channel.id)) {
            GPTMessages.set(message.channel.id, []);
        }
        try {
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_TOKEN
            })
            if (process.env.DEFAULT_GPT_MODEL === undefined || process.env.DEFAULT_GPT_MODEL === "") {
                throw new Error("No GPT model configured in .env file. Aborting...");
            }
            if (GPTMessages.get(message.channel.id).length === 0) {
                GPTMessages.get(message.channel.id).push({
                    "role": "user",
                    "content": "Pretend you are Tom Scott, the educational YouTuber. Reply to every message from now on as if you were him."
                } );
            }
            GPTMessages.get(message.channel.id).push({
                "role": "user",
                "content": prompt
            } );
            const completion = await openai.chat.completions.create({
                model: process.env.DEFAULT_GPT_MODEL,
                messages: GPTMessages.get(message.channel.id)
            });
            var gptResponse = completion.choices[0].message.content.trim();
            // split into 2000-character chunks, disregarding words and everything
            const chunkSize = 2000;
            var chunks = [];

            for (var i = 0; i < gptResponse.length; i += chunkSize) {
                await message.channel.send(gptResponse.substring(i, i + chunkSize));
            }

            GPTMessages.get(message.channel.id).push( {
                "role": "assistant",
                "content": gptResponse
            })
        }
        catch (e) {
            console.log(e);
            await message.channel.send(`Sorry, TomGPT request failed. (${e})`);
            GPTMessages.get(message.channel.id).pop();
        }
        while (GPTMessages.get(message.channel.id).length > 20) {
            GPTMessages.get(message.channel.id).splice(1, 1);
        }
    }

);

module.exports = GPT;