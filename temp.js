/**
temp module
**/
module.exports = function() {

    this.idEmojis = [
        ["242983689921888256","🛠️"], // Ts
        ["277156693765390337","🏹"], // Vera
        ["271399293372334081","🚁"], // Chopper
        ["331803222064758786","🥝"], // Marten
        ["152875086213283841","🐘"],  // Dennis
        ["328035409055449089","💠"],  // VoidMist
        ["329977469350445069","🐺"], // Lord of Galaxy
        ["281590363213398016","🍄"], // SpikedJackson
        ["458727748504911884","🦎"], // Jay
        ["244211825820827648","🐸"], // PsychoBelp
        ["413001114292846612","🐛"], // Leilaboo
        ["241953256777973760","🤗"], // BartTheBart
        ["433957826491187202","🦦"], // Steilsson
        ["334066065112039425","🔥"], // Steinator
        ["544125116640919557","▪️"], // Ethan.
        ["234474456624529410","🎨"], // Captain Luffy
        ["356510817094598658","🐢"], // Mr. Turtle
        ["299000787814842368","😃"], // Topkinsme
        ["83012212779646976","🇺🇸"], // Wyatt
        ["633338331220148225","🌌"], // Sharl Eclair
        ["375578492580003840","💚"], // Mojo
        ["161551993704284171","🐼"], // kruthers
        ["215427550577557504","👁‍🗨"], // MatMeistress
        ["334136126745083907","🐓"], // Jean D. Arch
        ["265186558016094208","🍅"], // Relaxed Mato
        ["490180990237540352","🧋"], // the kremblin
        ["139855429357273088","☢️"], // Swurtle
        ["489047121840963585","🐙"], // Alphaviki
        ["839150186613702749","🕯️"], //phantom
        ["405803301251055617","4️⃣"] // harperette
    ];

    this.parseAlias = function(alias) {
        let aliases = {
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
                "killq": ["kq","kill","killqueue"],
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
                "groups": ["group"],
                "attributes": ["attribute","attr"],
                "locations": ["location", "loc", "locs"]
        };
        for(let cmd in aliases) {
            if(aliases[cmd].indexOf(alias) != -1) return cmd;
        }
        return alias;
    }

}