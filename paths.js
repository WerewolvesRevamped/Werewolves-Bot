/**
    Paths
    Paths to repos and websites
**/
module.exports = function() {
    /**
    Github Paths
    **/
    const githubRaw = "https://raw.githubusercontent.com/";
    this.githubAPI = "https://api.github.com/";
    /**
    Repo Paths
    **/
    const wwrOrg = "WerewolvesRevamped";
    const iconRepo = `${wwrOrg}/${config.icons_repo}`;
    const iconRepoBranch = "main"
    this.iconRepoBaseUrl = `${githubRaw}${iconRepo}/${iconRepoBranch}/`;
    this.roleRepo = `${wwrOrg}/${config.roles_repo}`;
    this.roleRepoBranch = "main";
    this.roleRepoBaseUrl = `${githubRaw}${roleRepo}/${roleRepoBranch}/`;
    this.roleRepoSecondary = config.roles_repo_secondary ? `${wwrOrg}/${config.roles_repo_secondary}` : null;
    this.roleRepoSecondaryBranch = "main";
    this.roleRepoSecondaryBaseUrl = config.roles_repo_secondary ? `${githubRaw}${roleRepoSecondary}/${roleRepoSecondaryBranch}/` : null;
    this.promptsUrl = `${githubRaw}${roleRepo}/${roleRepoBranch}/prompts.json`;
    /** Files **/
    this.iconLUTPath = `${iconRepoBaseUrl}replacements.csv`;
    this.colorsLUTPath = `${iconRepoBaseUrl}colors.csv`;
    this.rolepathsPath = `${roleRepoBaseUrl}_paths/roles`;
    this.rolepathsPathSecondary = config.roles_repo_secondary ? `${roleRepoSecondaryBaseUrl}_paths/roles` : null;
    this.infopathsPath = `${roleRepoBaseUrl}_paths/info`;
    this.infopathsPathSecondary = config.roles_repo_secondary ? `${roleRepoSecondaryBaseUrl}_paths/info` : null;
    this.grouppathsPath = `${roleRepoBaseUrl}_paths/groups`;
    this.grouppathsPathSecondary = config.roles_repo_secondary ? `${roleRepoSecondaryBaseUrl}_paths/groups` : null;
    this.attributepathsPath = `${roleRepoBaseUrl}_paths/attributes`;
    this.attributepathsPathSecondary = config.roles_repo_secondary ? `${roleRepoSecondaryBaseUrl}_paths/attributes` : null;
    this.teamspathsPath = `${roleRepoBaseUrl}_paths/teams`;
    this.teamspathsPathSecondary = config.roles_repo_secondary ? `${roleRepoSecondaryBaseUrl}_paths/teams` : null;
    
    this.setspathsPath = `${roleRepoBaseUrl}_paths/sets`;
    this.locationpathsPath = `${roleRepoBaseUrl}_paths/locations`;
    this.pollpathsPath = `${roleRepoBaseUrl}_paths/polls`;
    this.displayspathsPath = `${roleRepoBaseUrl}_paths/displays`;
    /**
    Website Paths
    **/
    this.websiteDomain = `werewolves.me`;
    this.website = `https://${websiteDomain}/`;
    this.cardBaseUrl = `https://scripts.${websiteDomain}/cards/card.php?name=`;
    /**
    Packs
    **/
    this.themePackBase = `https://raw.githubusercontent.com/${wwrOrg}/Packs/refs/heads/main/Theme/`;
    this.urlPackBase = `https://raw.githubusercontent.com/${wwrOrg}/Packs/refs/heads/main/URL/`;
}