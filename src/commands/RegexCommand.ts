const { Message } = require("discord.js");

class RegexCommand {
    regexPatterns : Array<RegExp>;
    requiresGroups: boolean;
    requiresRegexIndex: boolean;
    commandFunction: (message?: any, matches?: Array<String>, regexIndex?: Number) => void;

    constructor() {
        this.regexPatterns = [];
        this.requiresGroups = false;
        this.requiresRegexIndex = false;
        this.commandFunction = () => {
            console.log("Executing default command!");
        }
    }
    setPattern(pattern : RegExp) {
        this.regexPatterns = [pattern];
        return this;
    }
    setPatterns(patterns: RegExp[]) {
        this.regexPatterns = patterns;
        return this;
    }
    setCalledFunction(fxn : (x?: any) => void) {
        this.commandFunction = fxn;
        return this;
    }
    setGroupsRequirement(boolValue : boolean) {
        if (boolValue === false) {
            this.requiresRegexIndex = false;
        }
        this.requiresGroups = boolValue;
        return this;
    }
    setRegexIndexRequirement(boolValue : boolean) {
        if (boolValue === true) {
            this.requiresGroups = true;
        }
        this.requiresRegexIndex = boolValue;
        return this;
    }
    exec(message: any) {
        try {
            for (let i = 0; i < this.regexPatterns.length; ++i) {
                let matches = this.regexPatterns[i].exec(message.content);
                this.regexPatterns[i].lastIndex = 0;
                if (matches !== null) {
                    if (this.requiresRegexIndex == true) {
                        this.commandFunction(message, matches, i);
                    }
                    else if (this.requiresGroups === true) {
                        this.commandFunction(message, matches);
                    }
                    else {
                        this.commandFunction(message);
                    }
                    break;
                }
            }
        }
        catch (e) {
            console.log("Error: ", e);
        }
    }
}

module.exports = RegexCommand;