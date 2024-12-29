
/**
temp module
**/
module.exports = function() {

    this.idEmojis = [
        /** System **/ 
        ["","📌"], 
        ["","✅"], 
        ["","⛔"], 
        ["","❌"], 
        ["","❓"], 
        ["","🇦"], 
        ["","🇧"], 
        ["","🇨"], 
        ["","🇩"], 
        ["","🇪"], 
        ["","🇫"], 
        /** Game Masters **/ 
        ["242983689921888256","🛠️"], // Ts
        ["277156693765390337","🏹"], // Vera
        ["458727748504911884","🦎"], // Jay
        ["331803222064758786","🥝"], // Marten
        ["234474456624529410","🎨"], // Captain Luffy
        ["356510817094598658","🐢"], // Mr. Turtle
        ["544125116640919557","▪️"], // Ethan.
        ["334066065112039425","🔥"], // Steinator
        ["490180990237540352","🧋"], // the kremblin
        ["334136126745083907","🐓"], // Jean D. Arch
        ["161551993704284171","🐼"], // kruthers
        ["242983689921888256", "🐟"], // fish
        /** LEGACY **/
        ["152875086213283841","🐘"],  // Dennis
        ["633338331220148225","🌌"], // Sharl Eclair
        ["215427550577557504","👁‍🗨"], // MatMeistress
        ["489047121840963585","🐙"], // Alphaviki
        /** RESERVED **/
        ["406536328965128194","🦆"], // aleeeeeeeeex
        ["729439643451523073","<:meeple:1312192403129499659>"], // invincitank
    ];

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
                "help": ["h"],
                "impersonate": ["imp"],
                "webhook": ["bot","<"],
                "cc": ["c","ccs"],
                "roll": ["rand","random","randomize"],
                "players": ["p","player"],
                "sheet": ["sh","game"],
                "delete": ["d"],
                "bulkdelete": ["bd"],
                "list_alive": ["a","alive","alive_list","alive-list","listalive","list-alive"],
                "list_dead": ["ld","dead","dead_list","dead-list","listdead","list-dead","lg","g","ghost","ghost_list","ghost-list","listghost","list-ghost","list_ghost","list_ghosts"],
                "list_alphabetical": ["la"],
                "list_signedup": ["l","list","signedup","signedup_list","signedup-list","listsignedup","list-signedup"],
                "signup": ["join","sign-up","sign_up","unsignup","signout","participate","sign-out","sign_out","leave","unjoin","signups"],
                "options": ["stat","stats","option"],
                "info": ["i"],
                "infopin": ["ip","info_pin"],
                "infoedit": ["ie","info_edit"],
                "infoadd": ["ia","info_add"],
                "info_classic": ["ic"],
                "info_classic_simplified": ["ics"],
                "info_fancy": ["if"],
                "info_fancy_simplified": ["ifs"],
                "roles": ["role","r"],
                "connection": ["con","connect","whisper","whispers"],
                "gamephase": ["gp","game_phase","game-phase"],
                "modify": ["mod"],
                "say": [">"],
                "ping": ["?"],
                "elect": ["el", "elected"],
                "list_substitutes": ["subs","list_subs","substitutes"],
                "force_demote_all": ["fda"],
                "force_demote_signedup": ["fdsn"],
                "image": ["img"],
                "infomanage": ["im"],
                "groups": ["group","grp","grps"],
                "attributes": ["attribute","attr"],
                "locations": ["location", "loc", "locs"],
                "teams": ["team","tm"],
                "details": ["il","id"],
                "killq": ["kq"],
                "dr": ["discord_role","drole"],
                "host_information": ["hi","host_info"],
                "alias": ["al","aliases"],
                "packs": ["pack","pk"],
                "coins": ["coin", "tokens", "token", "cn"],
                "loot": ["lt"],
                "loot_force": ["lf"],
                "inventory": ["inv", "invent"],
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