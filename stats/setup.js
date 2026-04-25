/**
Auto generates stats when applicable
**/

module.exports = function() {
  
    /**
    Generate Stats
    automatically generates discord parts for the various stats
    **/
    this.generateStats = async function() {
        // iterate through stats
        for(let i = 0; i < availableStats.length; i++) {
            let curStat = availableStats[i];
            let statValue = getStatFromId(curStat.id);
            if(!curStat.autoGenerate || stats[curStat.property] !== undefined) continue;
            console.log(curStat.name, stats[curStat.property]);
            // handle different cases
            switch(curStat.type) {
                case "roleID":
                    const role = await mainGuild.roles.create({ name: curStat.autoGenerate, reason: "Auto Stat Generation" });
                    await sqlSetStatProm(curStat.id, role.id);
                    console.log(`Auto generated ${curStat.name} as ${role.id}`);
                break;
            }
        }
    }
  
}