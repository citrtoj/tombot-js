# TomBot-JS
A JS+TS rewrite of a Discord bot of mine [originally written in Python](https://github.com/citrtoj/tombot-python) for a personal Discord server.

## Features
- Human-like commands based on regex patterns (e.g. "TomBot, show me a \<prompt\> GIF", "TomBot, define/what is \<prompt\>", "Tombot, choose between \<prompts...\>")
- Meme generation, based on the [Tom Scott "I am at..." meme]("https://knowyourmeme.com/memes/tom-scott-i-am-at-x") ("Tombot, I am at \<prompt\>"), using the Imgflip API and an image search API
- Various other commands such as temperature/currency conversion, definitions of words/phrases, and so on

## Notes
- Before running, create a `.env` file with the help of the included `.env.template` file, which lists the required tokens along with links to the respective websites and the commands making use of them
- Build using `npm run build`, start using `npm run start`, start with nodemon using `npm run start:dev`