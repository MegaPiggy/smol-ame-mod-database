import { getOctokit } from "./get-octokit";

export async function getPreviousDatabase() {
  const octokit = getOctokit();

  const previousDatabaseResponse: any = (
    await octokit.rest.repos.getContent({
      // TODO get owner and repo from current action repo.
      owner: "MegaPiggy",
      repo: "smol-ame-mod-database",
      path: "database.json",
      ref: "main",
      mediaType: {
        format: "raw",
      },
    })
  ).data;

  const previousDatabase: Mod[] = JSON.parse(previousDatabaseResponse).releases;

  return previousDatabase;
}
