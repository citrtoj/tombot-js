var Message = require("discord.js").Message;
var RegexCommand = /** @class */ (function () {
    function RegexCommand() {
        this.regexPatterns = [];
        this.requiresGroups = false;
        this.requiresRegexIndex = false;
        this.commandFunction = function () {
            console.log("Executing default command!");
        };
    }
    RegexCommand.prototype.setPattern = function (pattern) {
        this.regexPatterns = [pattern];
        return this;
    };
    RegexCommand.prototype.setPatterns = function (patterns) {
        this.regexPatterns = patterns;
        return this;
    };
    RegexCommand.prototype.setCalledFunction = function (fxn) {
        this.commandFunction = fxn;
        return this;
    };
    RegexCommand.prototype.setGroupsRequirement = function (boolValue) {
        if (boolValue === false) {
            this.requiresRegexIndex = false;
        }
        this.requiresGroups = boolValue;
        return this;
    };
    RegexCommand.prototype.setRegexIndexRequirement = function (boolValue) {
        if (boolValue === true) {
            this.requiresGroups = true;
        }
        this.requiresRegexIndex = boolValue;
        return this;
    };
    RegexCommand.prototype.exec = function (message) {
        try {
            for (var i = 0; i < this.regexPatterns.length; ++i) {
                var matches = this.regexPatterns[i].exec(message.content);
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
    };
    return RegexCommand;
}());
module.exports = RegexCommand;
