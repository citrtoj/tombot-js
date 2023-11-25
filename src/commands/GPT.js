const { Configuration, OpenAIApi } = require("openai");
const RegexCommand = require("../RegexCommand");

var GPTMessages = new Map();

const GPT = new RegexCommand().setPattern(
    /\b^(?:(tomgpt[,. ]*?\s*))(.*)/gimu
).setGroupsRequirement(true).setCalledFunction(
    async (message, groups) => {
        let prompt = groups[2];
        if (/^reset$/gimu.exec(prompt.trim()) !== null) {
            if (typeof global.GPTMessages !== 'undefined') {
                if (global.GPTMessages.has(message.channel.id)) {
                    global.GPTMessages.set(message.channel.id, []);
                }
            }
        }
        const configuration = new Configuration({
          apiKey: process.env.OPENAI_TOKEN,
        });
        const openai = new OpenAIApi(configuration);
        if (typeof GPTMessages === 'undefined') {
            GPTMessages = new Map();
        }
        if (!GPTMessages.has(message.channel.id)) {
            GPTMessages.set(message.channel.id, []);
        }
        try {
            if (GPTMessages.get(message.channel.id).length === 0) {
                GPTMessages.get(message.channel.id).push({
                    "role": "user",
                    "content": "Pretend you have a background in theoretical computer science. Reply to any question with a correct mathematical proof for the answer."
                } );
            }
            GPTMessages.get(message.channel.id).push({
                "role": "user",
                "content": prompt
            } );
            
            const completion = await openai.createChatCompletion({
                model: process.env.DEFAULT_GPT_MODEL || "gpt-3-turbo",
                messages: GPTMessages.get(message.channel.id)
            });
            await message.channel.send(completion.data.choices[0].message.content.trim());
            GPTMessages.get(message.channel.id).push( {
                "role": "assistant",
                "content": completion.data.choices[0].message.content.trim()
            })
        }
        catch (e) {
            console.log(e);
            await message.channel.send("Sorry, TomGPT request failed.");
            GPTMessages.get(message.channel.id).pop();
        }
        while (GPTMessages.get(message.channel.id).length > 100) {
            GPTMessages.get(message.channel.id).splice(1, 1);
        }
    }

);

module.exports = GPT;