type ModInfo = {
  id: string;
  nexusId?: number;
  name: string;
  description?: string;
  author?: string;
  repo: string;
  required?: boolean;
  utility?: boolean;
  parent?: string;
};

type Release = {
  downloadUrl: string;
  downloadCount: number;
  version: string;
};

interface Mod extends Release {
  name: string;
  id: string;
  description: string;
  author: string;
  repo: string;
  nexusUrl?: string;
  required?: boolean;
  utility?: boolean;
  parent?: string;
  readme?: {
    downloadUrl?: string;
    htmlUrl?: string;
  };
  prerelease?: {
    version: string;
    downloadUrl: string;
    date: string;
  };
  latestReleaseDate: string;
  firstReleaseDate: string;
  latestReleaseDescription: string;
  latestPrereleaseDescription: string;
}
