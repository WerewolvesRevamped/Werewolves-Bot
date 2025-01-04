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
    const iconRepo = `${wwrOrg}/Werewolves-Icons`;
    const iconRepoBranch = "main"
    this.iconRepoBaseUrl = `${githubRaw}${iconRepo}/${iconRepoBranch}/`;
    this.roleRepo = `${wwrOrg}/Werewolves-Roles`;
    this.roleRepoBranch = "main";
    this.roleRepoBaseUrl = `${githubRaw}${roleRepo}/${roleRepoBranch}/`;
    this.roleRepoSecondary = `${wwrOrg}/WWR-AdditionalRoles`;
    this.roleRepoSecondaryBranch = "main";
    this.roleRepoSecondaryBaseUrl = `${githubRaw}${roleRepoSecondary}/${roleRepoSecondaryBranch}/`;
    /** Files **/
    this.iconLUTPath = `${iconRepoBaseUrl}replacements.csv`;
    this.colorsLUTPath = `${iconRepoBaseUrl}colors.csv`;
    this.rolepathsPath = `${roleRepoBaseUrl}_paths/roles`;
    this.rolepathsPathSecondary = `${roleRepoSecondaryBaseUrl}_paths/roles`;
    this.infopathsPath = `${roleRepoBaseUrl}_paths/info`;
    this.infopathsPathSecondary = `${roleRepoSecondaryBaseUrl}_paths/info`;
    this.grouppathsPath = `${roleRepoBaseUrl}_paths/groups`;
    this.grouppathsPathSecondary = `${roleRepoSecondaryBaseUrl}_paths/groups`;
    this.attributepathsPath = `${roleRepoBaseUrl}_paths/attributes`;
    this.attributepathsPathSecondary = `${roleRepoSecondaryBaseUrl}_paths/attributes`;
    this.teamspathsPath = `${roleRepoBaseUrl}_paths/teams`;
    this.teamspathsPathSecondary = `${roleRepoSecondaryBaseUrl}_paths/teams`;
    
    this.setspathsPath = `${roleRepoBaseUrl}_paths/sets`;
    this.locationpathsPath = `${roleRepoBaseUrl}_paths/locations`;
    this.pollpathsPath = `${roleRepoBaseUrl}_paths/polls`;
    /**
    Website Paths
    **/
    this.website = "https://werewolves.me/";
    this.cardBaseUrl = `${website}cards/card.php?name=`;
}