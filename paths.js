/**
    Paths
    Paths to repos and websites
**/
module.exports = function() {
    /**
    Github Paths
    **/
    this.githubRaw = "https://raw.githubusercontent.com/";
    this.githubAPI = "https://api.github.com/";
    /**
    Repo Paths
    **/
    this.wwrOrg = "WerewolvesRevamped";
    this.iconRepo = `${wwrOrg}/Werewolves-Icons`;
    this.iconRepoBranch = "main"
    this.iconRepoBaseUrl = `${githubRaw}${iconRepo}/${iconRepoBranch}/`;
    this.roleRepo = `${wwrOrg}/Werewolves-Roles`;
    this.roleRepoBranch = "main";
    this.roleRepoBaseUrl = `${githubRaw}${roleRepo}/${roleRepoBranch}/`;
    /** Files **/
    this.iconLUTPath = `${iconRepoBaseUrl}replacements.csv`;
    this.colorsLUTPath = `${iconRepoBaseUrl}colors.csv`;
    this.rolepathsPath = `${roleRepoBaseUrl}_paths/roles`;
    this.infopathsPath = `${roleRepoBaseUrl}_paths/info`;
    this.grouppathsPath = `${roleRepoBaseUrl}_paths/groups`;
    this.setspathsPath = `${roleRepoBaseUrl}_paths/sets`;
    this.locationpathsPath = `${roleRepoBaseUrl}_paths/locations`;
    /**
    Website Paths
    **/
    this.website = "https://werewolves.me/";
    this.cardBaseUrl = `${website}cards/card.php?name=`;
}