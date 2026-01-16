
/**
temp module
**/
module.exports = function() {

        this.ALIASES = {
                "modrole": ["mr"],
                "substitute": ["sub","unsub","unsubstitute"],
                "spectate": ["s","spec","spectator"],
                "close": ["x"],
                "open": ["@"],
                "gameping": ["@@"],
                "theme": ["th","themes"],
                "demote": ["de"],
                "promote": ["pro"],
                "unhost": ["unho"],
                "host": ["ho"],
                "demote_unhost": ["v"],
                "promote_host": ["^"],
                "polls": ["poll","pl"],
                "emojis": ["emoji","e"],
                "emojis_alive": ["emoji_alive","ea","alive_emojis","alive_emoji","ae"],
                "help": ["h"],
                "impersonate": ["imp"],
                "webhook": ["<"],
                "cc": ["ccs"],
                "confirm": ["c"],
                "roll": ["rand","random","randomize"],
                "players": ["p","player"],
                "sheet": ["sh","game"],
                "delete": ["d"],
                "bulkdelete": ["bd"],
                "list_alive": ["a","alive","alive_list","alive-list","listalive","list-alive"],
                "list_dead": ["ld","dead","dead_list","dead-list","listdead","list-dead"],
                "list_ghost": ["lg","g","ghost","ghost_list","ghost-list","listghost","list-ghost","list_ghost","list_ghosts"],
                "list_alphabetical": ["la"],
                "list_signedup": ["l","list","signedup","signedup_list","signedup-list","listsignedup","list-signedup"],
                "list_mentors": ["mentors"],
                "signup": ["join","sign-up","sign_up","unsignup","signout","participate","sign-out","sign_out","leave","unjoin","signups"],
                "options": ["stat","stats","option"],
                "info": ["i"],
                "infopin": ["ip","info_pin"],
                "infoedit": ["ie","info_edit"],
                "infoadd": ["ia","info_add"],
                "info_technical": ["it"],
                "roles": ["role","r"],
                "connection": ["con","connect","whisper","whispers"],
                "gamephase": ["gp","game_phase","game-phase"],
                "modify": ["mod"],
                "modifiers": ["ms", "md", "modifier"],
                "say": [">"],
                "ping": ["?"],
                "elect": ["el", "elected"],
                "list_substitutes": ["subs","list_subs","substitutes"],
                "force_demote_all": ["fda"],
                "force_demote_signedup": ["fdsn"],
                "image": ["img"],
                "infomanage": ["im"],
                "displays": ["dis"],
                "groups": ["group","grp","grps"],
                "attributes": ["attribute","attr"],
                "locations": ["location", "loc", "locs"],
                "teams": ["team","tm"],
                "details": ["il","id"],
                "killq": ["kq"],
                "dr": ["discord_role","drole"],
                "host_information": ["hi","host_info"],
                "alias": ["al","aliases"],
                "packs": ["pack","pk","sp"],
                "coins": ["coin", "tokens", "token", "cn"],
                "loot": ["lt"],
                "loot_force": ["lf"],
                "inventory": ["inv", "invent"],
                "icon": ["icons","ic"],
                "card": ["&"],
                "xp": ["level", "experience", "levels"],
                "execute_as_set": ["exeas"],
                "death_message": ["dmsgs", "death_messages", "dmsg","dm"],
                "recycle": ["rec", "re"],
                "nickname": ["nick"],
                "booster": ["boosters", "bst"],
                "curse": ["curses", "cur"],
                "reservation": ["reserve", "res"],
                "market": ["mk", "mkt"],
                "schedule": ["sched", "sch"],
                "parse_prompt": ["pp", "prompt_parse"],
                "reevaluate": ["reeval", "reval"],
                "bot": ["cmds", "command", "commands", "cmd"],
                "guarantors": ["guarant", "gua", "guarantor"],
                "status": ["st"],
        };
        
    this.parseAlias = function(alias) {
        for(let cmd in ALIASES) {
            if(ALIASES[cmd].indexOf(alias) != -1) return cmd;
        }
        return alias;
    }
    this.getAliases = function(inCmd) {
        return ALIASES[inCmd];
    }

}