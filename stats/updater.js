
module.exports = function() {
    
    const LATEST_DB_VERSION = 2;
    
    /** Update Tables
    Check what DB updates are necessary
    **/
    this.updateTables = async function() {
        if(!connection || (!stats.db_version && stats.db_version !== 0)) {
            log("Couldn't upgrade DB.");
            return;
        }
        
        // wip: this doesnt feel right but idk
        if(stats.db_version < 1) await update_1();
        if(stats.db_version < 2) await update_2();  
        
        // set latest version
        sqlSetStat(statID.DB_VERSION, LATEST_DB_VERSION);
    }
    
    /**
    Update #1
    adds 'haunting' column to locations
    **/
    async function update_1() {
        log("⤴️ Running DB Update #1");
        await sqlProm("ALTER TABLE `locations` ADD COLUMN `haunting` int(11) NOT NULL DEFAULT 0 AFTER `sort_index`");
    }
    
    /**
    Update #2 
    adds 'activation' columns to elements that can be "Haunted"
    **/
    async function update_2() {
        log("⤴️ Running DB Update #2");
        await sqlProm("ALTER TABLE `active_attributes` ADD COLUMN `activation` int(11) NOT NULL DEFAULT 0 AFTER `counter`");
        await sqlProm("ALTER TABLE `players` ADD COLUMN `activation` int(11) NOT NULL DEFAULT 0 AFTER `counter`");
        await sqlProm("ALTER TABLE `roles` ADD COLUMN `activation` int(11) NOT NULL DEFAULT 0 AFTER `identity`");
        await sqlProm("ALTER TABLE `attributes` ADD COLUMN `activation` int(11) NOT NULL DEFAULT 0 AFTER `parsed`");
    }
    
}