import { IModInfo } from "@megapiggy/nexus-api";
import { getOctokit } from "./get-octokit";

const saltRepo = {
  owner: "MegaPiggy",
  repo: "SALT",
};

const saltMod = {
  id: "salt",
  name: "SALT",
  description: "The mod loader and mod framework for Smol Ame",
  author: "MegaPiggy",
  required: true,
  utility: true,
  nexusUrl: "https://www.nexusmods.com/smolame/mods/1",
}

export async function fetchSALT(nexusModInfo: IModInfo) {
  const octokit = getOctokit();

  const saltRepository = saltRepo.owner+'/'+saltRepo.repo;

  const getReadme = async () => {
    try {
      const readme = (
        await octokit.rest.repos.getReadme(saltRepo)
      ).data;
      return {
        htmlUrl: readme.html_url || undefined,
        downloadUrl: readme.download_url || undefined,
      };
    } catch {
      console.log("no readme found");
    }
  };

  const readme = await getReadme();

  const saltReleases =  (await octokit.paginate(
    octokit.rest.repos.listReleases,
    {
      ...saltRepo,
      per_page: 100,
    }
  ))
  .sort((releaseA, releaseB) => new Date(releaseA.created_at) < new Date(releaseB.created_at) ? 1 : -1)
  .filter((release) => !release.draft);
  const saltLatestRelease = saltReleases[0];
  const saltFirstRelease =
    saltReleases[saltReleases.length - 1] ?? saltLatestRelease;
  const saltDownloadCount = saltReleases.reduce(
    (saltDownloadAccumulator, { assets }) => {
      const assetsDownloadCount = assets
        .filter(
          ({ name }) => name.endsWith("exe")
        )
        .reduce((assetsDownloadAccumulator, { download_count }) => {
          return assetsDownloadAccumulator + download_count;
        }, 0);

      return saltDownloadAccumulator + assetsDownloadCount;
    },
    0
  );

  const assets = saltLatestRelease.assets;
  const exeAsset = assets.find((asset) => asset.name.endsWith(".exe"));

  const totalDownloadCount = saltDownloadCount + nexusModInfo.mod_downloads;
  const nexusCreationTime = nexusModInfo.created_time.replace(".000+00:00","Z");
  const nexusUpdateTime = nexusModInfo.updated_time.replace(".000+00:00","Z");

  return {
    id: saltMod.id,
    name: saltMod.name,
    description: saltMod.description,
    author: saltMod.author,
    required: saltMod.required,
    utility: saltMod.utility,
    downloadUrl: exeAsset?.browser_download_url,
    nexusUrl: saltMod.nexusUrl,
    downloadCount: totalDownloadCount,
    latestReleaseDate: saltLatestRelease.created_at,
    firstReleaseDate: saltFirstRelease.created_at,
    nexusCreationTime,
    nexusUpdateTime,
    repo: saltRepository,
    version: saltLatestRelease.tag_name,
    readme
  }
}

function filterTruthy<TItem>(item: TItem | null): item is TItem {
  return Boolean(item);
}
