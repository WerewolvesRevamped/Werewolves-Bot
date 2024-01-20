/**
    Paths
    Paths to repos and websites
**/
module.exports = function() {
    /**
    Repo Paths
    **/
    this.iconRepo = "WerewolvesRevamped/Werewolves-Icons";
    this.iconRepoBranch = "main"
    this.iconRepoBaseUrl = `https://raw.githubusercontent.com/${iconRepo}/${iconRepoBranch}/`;
    this.roleRepo = "WerewolvesRevamped/Werewolves-Roles";
    this.roleRepoBranch = "main";
    this.roleRepoBaseUrl = `https://raw.githubusercontent.com/${roleRepo}/${roleRepoBranch}/`;
    /**
    Website Paths
    **/
    this.website = "https://werewolves.me/";
    this.cardBaseUrl = `${website}cards/card.php?name=`;

}