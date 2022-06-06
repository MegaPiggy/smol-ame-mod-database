import { Octokit } from "@octokit/action";
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";

function createOctokit() {
  const OctokitWithPlugins = Octokit.plugin(retry, throttling);
  return new OctokitWithPlugins({
    retry: {
      // Make it retry for everything, even 404s,
      // since the GH API some times randomly returns 404 in the latest release.
      doNotRetry: [],
    },
    throttle: {
      onRateLimit: (retryAfter: number, options: any) => {
        console.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );

        if (options.request.retryCount === 0) {
          // only retries once
          console.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onAbuseLimit: (retryAfter: number, options: any) => {
        // does not retry, only logs a warning
        console.warn(
          `Abuse detected for request ${options.method} ${options.url}`
        );
      },
    },
  });
}

let octokit: ReturnType<typeof createOctokit> | undefined;

export function getOctokit() {
  if (!octokit) {
    octokit = createOctokit();
  }
  return octokit;
}
