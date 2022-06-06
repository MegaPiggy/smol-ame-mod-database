import * as core from "@actions/core";
import { sendDiscordNotifications } from "./send-discord-notifications";
import { fetchMods } from "./fetch-mods";
import { getDiff } from "./get-diff";
import { initializeNexus } from "./nexus";
import { getPreviousDatabase } from "./get-previous-database";
import { fetchSALT } from "./fetch-salt";
import { toJsonString } from "./to-json-string";
import Nexus from "@megapiggy/nexus-api";

enum Input {
  mods = "mods",
  nexusApiKey = "nexus-api-key",
  discordHookUrl = "discord-hook-url",
  discordModHookUrls = "discord-mod-hook-urls",
}

enum Output {
  releases = "releases",
}

function getCleanedUpModList(modList: Mod[]) {
  return modList.map(
    ({ latestReleaseDescription, latestPrereleaseDescription, ...mod }) => mod
  );
}

async function run() {
  try {
    const getNexusModInfo = await initializeNexus(core.getInput(Input.nexusApiKey));

    const saltNexusInfo = await getNexusModInfo(1);
    const salt = await fetchSALT(saltNexusInfo);

    const nextDatabase = await fetchMods(core.getInput(Input.mods), getNexusModInfo);

    const databaseJson = toJsonString({
      salt,
      releases: getCleanedUpModList(nextDatabase),
    });
    core.setOutput(Output.releases, databaseJson);

    const discordHookUrl = core.getInput(Input.discordHookUrl);

    if (discordHookUrl) {
      const previousDatabase = await getPreviousDatabase();
      const diff = getDiff(previousDatabase, nextDatabase);

      const discordModHookUrls: Record<string, string> = JSON.parse(
        core.getInput(Input.discordModHookUrls) || "{}"
      );

      sendDiscordNotifications(
        core.getInput(Input.discordHookUrl),
        diff,
        discordModHookUrls
      );
    }
  } catch (error) {
    core.setFailed(error as any);
    console.log("error", error as any);
  }
}

run();
