
module.exports = function() {
    
    const LATEST_DB_VERSION = 5;
    
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
        if(stats.db_version < 3) await update_3();  
        if(stats.db_version < 4) await update_4();  
        if(stats.db_version < 5) await update_5();  
        
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
    
    /**
    Update #3
    adds 'activation' columns to groups
    **/
    async function update_3() {
        log("⤴️ Running DB Update #3");
        await sqlProm("ALTER TABLE `groups` ADD COLUMN `activation` int(11) NOT NULL DEFAULT 0 AFTER `parsed`");
        await sqlProm("ALTER TABLE `active_groups` ADD COLUMN `activation` int(11) NOT NULL DEFAULT 0 AFTER `counter`");
    }
    
    /**
    Update #4
    adds modifier table
    **/
    async function update_4() {
        log("⤴️ Running DB Update #4");
		await sqlProm("CREATE TABLE IF NOT EXISTS `modifiers` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `id` text NOT NULL, `name` text NOT NULL, PRIMARY KEY (`ai_id`))")
    }
    
    /**
    Update #5
    adds 'opened' column to grouos
    **/
    async function update_5() {
        log("⤴️ Running DB Update #5");
        await sqlProm("ALTER TABLE `active_groups` ADD COLUMN `opened` int(11) NOT NULL DEFAULT 0 AFTER `activation`");
    }
    

}
