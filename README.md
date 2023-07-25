# Smol Ame Mod Database

Uses the mod list in [`mods.json` of the `source`](https://github.com/MegaPiggy/smol-ame-mod-database/blob/source/mods.json) branch, fetches the required data for each mod. That data is then added to [`database.json` in the `main` branch](https://github.com/MegaPiggy/smol-ame-mod-database/blob/main/database.json). The process happens automatically every once in a while.

Mods listed in this database are used to generate the mods section of the [mods website](https://smolamemods.netlify.app/).

## [Click here to add your mod to the database](https://github.com/MegaPiggy/smol-ame-mod-database/issues/new?assignees=MegaPiggy&labels=add-mod&template=add-mod.yml&title=%5BYour+mod+name+here%5D)

Or, if you want, you can [edit the mod list yourself and open a PR](https://github.com/MegaPiggy/smol-ame-mod-database/edit/source/mods.json)

## Thanks
Special thanks to [Raicuparta](https://github.com/Raicuparta/) for making the [Outer Wilds Mod Database](https://github.com/ow-mods/ow-mod-db), which this was ~stolen from~ inspired by.

## How it works

GitHub Actions are used to periodically update the database. Check the [Update Releases workflow](https://github.com/MegaPiggy/smol-ame-mod-database/blob/source/.github/workflows/update-releases.yml) and the [TypeScript code](https://github.com/MegaPiggy/smol-ame-mod-database/tree/source/fetch-mods) that fetches the data about each mod and generates the database.

## Repository secrets

If you fork this repository, you'll need to add a few secrets for everything to work.

### `GH_TOKEN`

GitHub token with repo permissions. Format:

```
ghp_XXX
```

### `DISCORD_HOOK_URL`

Discord web hook URL where all the notifications are sent. Format:

```
https://discord.com/api/webhooks/XXX/YYY
```

### `DISCORD_MOD_HOOK_URLS`

JSON object where keys are the id of a mod, and the values are the Discord hook urls of the channel where update notifications should be sent to. Format:

```
{
  "idA": "https://discord.com/api/webhooks/XXX/YYY",
  "idB": "https://discord.com/api/webhooks/WWW/ZZZ"
}
```

### `NEXUS_KEY`

Nexus API Key that is used to grab the download counts and creation/update dates from a mod. You can get the key [here](https://www.nexusmods.com/users/myaccount?tab=api) Format:

```
XXX
```
