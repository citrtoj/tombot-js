const RegexCommand = require("./RegexCommand");
const axios = require("axios")
const {iAmAt} = require("./IAmAt.js");
const { Configuration, OpenAIApi } = require("openai");

module.exports = {
    iAmAt: iAmAt,
    //short commands
    gpt: new RegexCommand().setPattern(
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
            if (typeof global.GPTMessages === 'undefined') {
                global.GPTMessages = new Map();
            }
            if (!global.GPTMessages.has(message.channel.id)) {
                global.GPTMessages.set(message.channel.id, []);
            }
            try {
                if (global.GPTMessages.get(message.channel.id).length === 0) {
                    global.GPTMessages.get(message.channel.id).push( { //get() returns reference to object
                        "role": "user",
                        "content": "Pretend you are Tom Scott, the educational YouTuber. Reply to every message from now on as if you were him."
                    } );
                }
                global.GPTMessages.get(message.channel.id).push( {
                    "role": "user",
                    "content": prompt
                } );
                
                const completion = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: global.GPTMessages.get(message.channel.id)
                });
                await message.channel.send(completion.data.choices[0].message.content.trim());
                global.GPTMessages.get(message.channel.id).push( {
                    "role": "assistant",
                    "content": completion.data.choices[0].message.content.trim()
                })
            }
            catch (e) {
                console.log(e);
                await message.channel.send("Sorry, TomGPT request failed.");
                global.GPTMessages.get(message.channel.id).pop(); //last user message
            }
            while (global.GPTMessages.get(message.channel.id).length > 100) {
                global.GPTMessages.get(message.channel.id).splice(1, 1);
            }
        }
    ),
    piss: new RegexCommand().setPattern(/\b\d*?(pee|wees|pees|pisses|urinates|piss|peeing|pissing|peed|urination|urinate|urine|urinated|micturition)\d*?\b/gimu).setCalledFunction( (message) => {
        message.channel.send({ files: ["media/piss.jpg"] });
        if (Math.random() >= 0.69) {
            message.channel.send("https://youtu.be/3CSMF1fh42U");
        }
    } ),
    gif: new RegexCommand().setGroupsRequirement(true).setPattern(
        /\b(?:(tombot show me a)(n?)\s)(.*?)(?: gif)\b/gimu
        ).setCalledFunction(
            async (message, matches) => {
                let prompt = matches[3];
                console.log(prompt);
                const tenorToken = process.env.TENOR_TOKEN;
                try {
                    const response = await axios.get(`https://g.tenor.com/v1/search?q=${prompt}&key=${tenorToken}&limit=10`);
                    await message.channel.send(response.data.results[0].itemurl);
                }
                catch (error) {
                    console.error(error);
                }
            }
        ),
    penis: new RegexCommand().setPattern(/\bpenis\b/gimu).setCalledFunction(  (message) => {
        message.channel.send({files: ["media/penis.png"]})
    } ),
    thanks: new RegexCommand().setPatterns([
        /\b(thanks)[ ,.?!]*?(tombot)\b/gimu,
        /\b(tombot)[,.? !]*?(thanks)\b/gimu
    ]).setCalledFunction( (message) => {
        message.channel.send("You're welcome!");
    } ),
    naked: new RegexCommand().setPattern(
        /\b(tombot).*?(get naked|go naked)\b/gimu
    ).setCalledFunction( (message) => {
        message.channel.send({files: [ "media/wireframe.png" ]});
    } ),
    juggle: new RegexCommand().setPattern(/\b(tombot)[,. ?!]*? (juggle)\b/gimu).setCalledFunction( (message) => {
        message.channel.send( {files : [[
            "media/juggle0.gif", "media/juggle1.gif"
        ][Math.floor(Math.random() * 2)]]} );
    } ),
    tombotChoose: new RegexCommand().setPattern(/\b(?:(tombot[,. ]*?choose( between)?)\s*)(.*)/gimu).setGroupsRequirement(true).setCalledFunction(
        (message, matches) => {
            let promptsList = matches[3].split(',').filter( (word) => {
                    return word !== "";
                }
            ).map(word => {return word.trim()});
            message.channel.send(promptsList[Math.floor(Math.random() * promptsList.length)]);
        }
    ),
    echo: new RegexCommand().setPattern(/\b^(?:(tombot[,. ]*?echo)\s*)(.*)/gimu).setGroupsRequirement(true).setCalledFunction(
        (message, groups) => {
            let prompt = groups[2];
            if (prompt !== "") {
                message.channel.send(prompt);
            }
            message.delete().catch( error => {
                if (error.code !== 10008) {
                    console.error('Failed to delete the message:', error);
                }
            });
        }
    ),
    define: new RegexCommand()
            .setPatterns([
                /\b(?:(tombot,?.*? what does)(n?)\s*)"?(.*?)"?(?: mean\??)/gimu,
                /\b(?:(tombot[,. ]*?define)\s*)(.*)/gimu
            ])
            .setRegexIndexRequirement(true)
            .setCalledFunction( (message, matches, regexIndex) => {
                let prompt = matches[
                    regexIndex == 0 ? 3 : 2 
                ];
                axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${prompt}`).then( (response)=>{
                    let msg = '"' + prompt + '" means:\n' 
                    response.data[0]["meanings"].forEach((meaning) => {
                        msg = msg + "**" + meaning["partOfSpeech"] + "**:\n";
                        meaning["definitions"].forEach((definition) => {
                            msg = msg + "- " + definition["definition"] + "\n";
                        })
                    })
                    message.channel.send(msg);
                }).catch((error) => {
                    message.channel.send({files: ["media/dont_know.mp4"]});
                    console.log(error);
                })
                
            } )
}