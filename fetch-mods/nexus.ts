import Nexus from "@megapiggy/nexus-api";

export async function initializeNexus(nexusApiKey: string){
    const nexus = await Nexus.create(nexusApiKey, "Smol Ame Mods Database", "1.0.0", "smolame", 5000);

    return async function getNexusModInfo(id: number){
      return await nexus.getModInfo(id, "smolame")
    }
}