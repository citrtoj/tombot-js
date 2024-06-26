import OpenAI from "openai";
import RegexCommand from "../RegexCommand";

var GPTMessages = new Map();

const MESSAGE_CHUNK_LENGTH = 2000;
const DEFAULT_START_MESSAGE = {
  role: "user",
  content:
    "Pretend you are Tom Scott, the educational YouTuber. Reply to every message from now on as if you were him.",
};

const GPT = new RegexCommand()
  .setPattern(/\b^(?:(tomgpt[,. ]*?\s*))(.*)/gimsu)
  .setGroupsRequirement(true)
  .setCalledFunction(async (message, groups) => {
    let prompt = groups[2];
    console.log(prompt);
    console.log(groups);
    const initMessageArray = () => {
      GPTMessages.set(message.channel.id, [DEFAULT_START_MESSAGE]);
    };

    try {
      if (prompt.trim().toLowerCase() === "reset") {
        initMessageArray();
        return;
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_TOKEN,
      });

      if (!process.env.DEFAULT_GPT_MODEL) {
        throw new Error("No GPT model configured in .env file. Aborting...");
      }

      if (!GPTMessages.has(message.channel.id)) {
        initMessageArray();
      }

      const messageArray = GPTMessages.get(message.channel.id);

      messageArray.push({
        role: "user",
        content: prompt,
      });

      const completion = await openai.chat.completions.create({
        model: process.env.DEFAULT_GPT_MODEL,
        messages: messageArray,
      });
      var gptResponse = completion.choices[0].message.content.trim();

      // split into 2000-character chunks, disregarding humane word breaks
      for (var i = 0; i < gptResponse.length; i += MESSAGE_CHUNK_LENGTH) {
        await message.channel.send(
          gptResponse.substring(i, i + MESSAGE_CHUNK_LENGTH)
        );
      }

      messageArray.push({
        role: "assistant",
        content: gptResponse,
      });
    } catch (e) {
      console.log(e);
      await message.channel.send(`Sorry, TomGPT request failed. (${e})`);
      GPTMessages.get(message.channel.id).pop();
    }

    // trim history to 20 messages
    while (GPTMessages.get(message.channel.id).length > 20) {
      GPTMessages.get(message.channel.id).splice(1, 1);
    }
  });

module.exports = GPT;
