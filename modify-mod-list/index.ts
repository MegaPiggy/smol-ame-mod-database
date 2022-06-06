import * as core from "@actions/core";

enum Input {
  form = "form",
  mods = "mods",
  gitHubToken = "github-token",
}

enum Output {
  mods = "mods",
  editedExistingMod = "edited-existing-mod",
}

// Mod info from mods.json.
type ModInfo = {
  name: string;
  id: string;
  nexusId?: number;
  repo: string;
  required?: boolean;
  utility?: boolean;
  parent?: string;
};

// From .github/ISSUE_TEMPLATE/add-mod.yml.
type IssueForm = {
  name?: string;
  id?: string;
  repoUrl?: string;
  nexusUrl?: string;
  utility?: string;
  parent?: string;
};

async function run() {
  const { name, repoUrl, id, parent, utility, nexusUrl }: IssueForm = JSON.parse(
    core.getInput(Input.form)
  );

  if (!name || !repoUrl || !id) {
    throw new Error("Invalid form format");
  }

  const repo = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)\/?.*/)?.[1];

  if (!repo) {
    throw new Error("Invalid repo URL " + repoUrl);
  }

  const mods: ModInfo[] = JSON.parse(core.getInput(Input.mods));

  const newMod: ModInfo = {
    name,
    id,
    repo,
  };

  if (parent) {
    newMod.parent = parent;
  }

  if (utility) {
    newMod.utility = Boolean(utility);
  }

  const nexusId = repoUrl.match(/nexusmods\.com\/smolame\/mods\/([^\/]+)\/?.*/)?.[1];

  if (nexusId) {
    newMod.nexusId = Number(nexusId);
  }

  const existingMod = mods.find(
    (modFromList) => id === modFromList.id
  );

  if (existingMod) {
    existingMod.name = newMod.name;
    existingMod.repo = newMod.repo;
    existingMod.parent = newMod.parent;
    existingMod.utility = newMod.utility;
    existingMod.nexusId = newMod.nexusId;
  }

  const newMods: ModInfo[] = existingMod ? mods : [...mods, newMod];

  core.setOutput(Output.mods, JSON.stringify(newMods, null, 2));
  if (existingMod) {
    core.setOutput(Output.editedExistingMod, true);
  }
}

run();
