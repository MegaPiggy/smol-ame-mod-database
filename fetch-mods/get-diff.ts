import { happenedWithinDayCount } from "./happened-within-day-count";

export type DiffItem =
  | {
      nextMod: Mod;
      diffType: "add";
    }
  | {
      previousMod: Mod;
      diffType: "remove";
    }
  | {
      previousMod: Mod;
      nextMod: Mod;
      diffType: "update";
    }
  | {
      previousMod?: Mod;
      nextMod: Mod;
      diffType: "update-prerelease";
    };

export function getDiff(previousDatabase: Mod[], nextDatabase: Mod[]) {
  const diff: DiffItem[] = [];

  for (const nextDatabaseMod of nextDatabase) {
    const previousDatabaseMod = previousDatabase.find(
      (mod) => mod.id === nextDatabaseMod.id
    );

    if (happenedWithinDayCount(nextDatabaseMod.latestReleaseDate, 1)) {
      if (!previousDatabaseMod) {
        diff.push({
          diffType: "add",
          nextMod: nextDatabaseMod,
        });
        continue;
      }

      if (previousDatabaseMod.version !== nextDatabaseMod.version) {
        diff.push({
          diffType: "update",
          previousMod: previousDatabaseMod,
          nextMod: nextDatabaseMod,
        });
      }
    }

    if (
      nextDatabaseMod.prerelease &&
      previousDatabaseMod?.prerelease?.version !==
        nextDatabaseMod.prerelease.version
    ) {
      if (happenedWithinDayCount(nextDatabaseMod.prerelease.date, 1)) {
        diff.push({
          diffType: "update-prerelease",
          previousMod: previousDatabaseMod,
          nextMod: nextDatabaseMod,
        });
      }
    }
  }

  for (const previousDatabaseMod of previousDatabase) {
    const nextDatabaseMod = nextDatabase.find(
      (mod) => mod.id === previousDatabaseMod.id
    );

    if (!nextDatabaseMod) {
      diff.push({
        diffType: "remove",
        previousMod: previousDatabaseMod,
      });
      continue;
    }
  }

  for (const diffItem of diff) {
    switch (diffItem.diffType) {
      case "add":
        console.log(
          `Mod ${diffItem.nextMod.name} by ${diffItem.nextMod.author} was added`
        );
        break;
      case "remove":
        console.log(
          `Mod ${diffItem.previousMod.name} by ${diffItem.previousMod.author} was removed`
        );
        break;
      case "update":
        console.log(
          `Mod ${diffItem.nextMod.name} by ${diffItem.nextMod.author} was updated from ${diffItem.previousMod.version} to ${diffItem.nextMod.version}`
        );
      case "update-prerelease":
        console.log(
          `Prerelease of ${diffItem.nextMod.name} by ${diffItem.nextMod.author} was updated from ${diffItem.previousMod?.prerelease?.version} to ${diffItem.nextMod.prerelease?.version}`
        );
        break;
    }
  }

  return diff;
}
