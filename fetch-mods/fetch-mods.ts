import { IModInfo } from "@megapiggy/nexus-api";
import { getOctokit } from "./get-octokit";
import { toJsonString } from "./to-json-string";

const REPO_URL_BASE = "https://github.com";
const NEXUS_URL_BASE = "https://nexusmods.com/smolame/mods";

export async function fetchMods(modsJson: string, getNexusModInfo: (id: number) => Promise<IModInfo>) {
  const modInfos: ModInfo[] = JSON.parse(modsJson);
  const octokit = getOctokit();

  type OctokitRelease = Awaited<
    ReturnType<typeof octokit.rest.repos.listReleases>
  >["data"][number];
  type ReleaseList = OctokitRelease[];

  const results = [];
  for (let modInfo of modInfos) {
    try {
      const [owner, repo] = modInfo.repo.split("/");

      const getReadme = async () => {
        try {
          const readme = (
            await octokit.rest.repos.getReadme({
              owner,
              repo,
            })
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

      const fullReleaseList = (
        await octokit.paginate(octokit.rest.repos.listReleases, {
          owner,
          repo,
          per_page: 100,
        })
      )
        .sort((releaseA, releaseB) =>
          new Date(releaseA.created_at) < new Date(releaseB.created_at) ? 1 : -1
        )
        .filter((release) => !release.draft);

      const prereleaseList = fullReleaseList.filter(
        (release) => release.prerelease &&
        release.assets[0]
      );
      const releaseList = fullReleaseList.filter(
        (release) =>
          !release.prerelease &&
          release.assets[0]
      );

      const latestReleaseFromList = releaseList[0];
      console.log("latestReleaseFromList", latestReleaseFromList);

      let latestReleaseFromApi: OctokitRelease | null = null;

      try {
        latestReleaseFromApi = (
          await octokit.rest.repos.getLatestRelease({
            owner,
            repo,
          })
        ).data;

        console.log("latestReleaseFromApi", latestReleaseFromApi);
      } catch (error) {
        console.log(`Failed to get latest release from API: ${error}`);
      }

      // There are two ways to get the latest release:
      // - picking the last item in the full release list;
      // - using the result of the latest release api endpoint.
      // Some times, they disagree. So I'll pick the youngest one as the latest release.
      let useReleaseFromList = false;
      if (!latestReleaseFromApi && latestReleaseFromList) {
        useReleaseFromList = true;
      } else if (latestReleaseFromApi && !latestReleaseFromList) {
        useReleaseFromList = false;
      } else if (
        latestReleaseFromList &&
        latestReleaseFromApi &&
        new Date(latestReleaseFromList.created_at) >
          new Date(latestReleaseFromApi.created_at)
      ) {
        useReleaseFromList = true;
      }

      const latestRelease = useReleaseFromList
        ? latestReleaseFromList
        : latestReleaseFromApi;

      if (!latestRelease) {
        throw new Error(
          "Failed to find latest release from either release list or latest release endpoint"
        );
      }

      results.push({
        releaseList,
        prereleaseList,
        modInfo,
        readme,
        latestRelease,
      });
    } catch (error) {
      console.log("Error reading mod info", error);
    }
  }

  function getCleanedUpRelease(release: OctokitRelease) {
    const asset = release.assets.find((asset) => asset.browser_download_url.endsWith("dll") || 
    asset.browser_download_url.endsWith("exe")) ?? release.assets[0];

    let downloadCount = 0;
    for (let i = 0; i < release.assets.length; i++) {
      downloadCount += release.assets[i].download_count;
    }

    return {
      downloadUrl: asset.browser_download_url,
      downloadCount: downloadCount,
      version: release.tag_name,
      date: asset.created_at,
      description: release.body,
    };
  }

  function getCleanedUpReleaseList(releaseList: ReleaseList) {
    return releaseList
      .filter(({ assets }) => assets.length > 0)
      .map(getCleanedUpRelease);
  }

  const modReleaseResults = await Promise.allSettled<Mod>(
    results.map(
      async ({
        modInfo,
        latestRelease,
        releaseList,
        prereleaseList,
        readme,
      }) => {
        try {
          const releases = getCleanedUpReleaseList(releaseList);
          const prereleases = getCleanedUpReleaseList(prereleaseList);
          const cleanLatestRelease = getCleanedUpRelease(latestRelease);
          const repo = `${REPO_URL_BASE}/${modInfo.repo}`;
          let nexusUrl =  undefined;
          let nexusDownloadCount = 0;
          let nexusCreationTime = undefined;
          let nexusUpdateTime = undefined;
          if (modInfo.nexusId){
            const nexusModInfo = await getNexusModInfo(modInfo.nexusId);
            nexusUrl = `${NEXUS_URL_BASE}/${modInfo.nexusId}`;
            nexusDownloadCount = nexusModInfo.mod_downloads;
            nexusCreationTime = nexusModInfo.created_time.replace(".000+00:00","Z");
            nexusUpdateTime = nexusModInfo.updated_time.replace(".000+00:00","Z");
          }

          console.log("releases", toJsonString(releases));
          console.log("prereleases", toJsonString(prereleases));
          console.log("cleanLatestRelease", toJsonString(cleanLatestRelease));

          const totalDownloadCount = [...releases, ...prereleases].reduce(
            (accumulator, release) => {
              return accumulator + release.downloadCount;
            },
            0
          ) + nexusDownloadCount;

          const splitRepo = modInfo.repo.split("/");
          const githubRepository = (
            await octokit.rest.repos.get({
              owner: splitRepo[0],
              repo: splitRepo[1],
            })
          ).data;

          const firstRelease =
            releases[releases.length - 1] ?? cleanLatestRelease;
          const latestPrerelease = prereleases[0];

          const mod: Mod = {
            name: modInfo.name,
            id: modInfo.id,
            description: githubRepository.description || "",
            author: githubRepository.owner.login,
            required: modInfo.required,
            utility: modInfo.utility,
            parent: modInfo.parent,
            downloadUrl: cleanLatestRelease.downloadUrl,
            nexusUrl,
            downloadCount: totalDownloadCount,
            latestReleaseDate: cleanLatestRelease.date,
            firstReleaseDate: firstRelease.date,
            nexusCreationTime,
            nexusUpdateTime,
            repo,
            version: cleanLatestRelease.version,
            readme,
            latestReleaseDescription: cleanLatestRelease.description || "",
            latestPrereleaseDescription: latestPrerelease?.description || "",
            prerelease: latestPrerelease
              ? {
                  version: latestPrerelease.version,
                  downloadUrl: latestPrerelease.downloadUrl,
                  date: latestPrerelease.date,
                }
              : undefined,
          };

          if (mod.description) {
            mod.description = mod.description.replace(" Mod for Smol Ame using SALT.", "").replace(" for Smol Ame game", "").replace(" for smol ame", "");
          }

          return mod;
        } catch (error) {
          const errorMessage = `Error fetching mod ${modInfo.id} : ${error}`;
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
      }
    )
  );

  const modReleases = modReleaseResults
    .filter(filterFulfilledPromiseSettleResults)
    .map((result) => result.value);

  return modReleases.filter(filterTruthy);
}

function filterTruthy<TItem>(item: TItem | null): item is TItem {
  return Boolean(item);
}

function filterFulfilledPromiseSettleResults<T>(
  result: PromiseSettledResult<T>
): result is PromiseFulfilledResult<T> {
  return result.status === "fulfilled";
}
