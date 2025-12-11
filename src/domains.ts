import domains from "../domain_structure.json";

export interface Domain {
    meta: string;
    data: Array<LGBArtData | NutzungDomainData>;
}
export interface LGBArtData {
    key: string;
    art: string[];
    label: string;
    label_en: string;
    children: LGBTypData[];
}
export interface LGBTypData {
    key: string;
    art: string[];
    typ: string[];
    label: string;
    label_en: string;
}
export interface NutzungDomainData {
    key: string
    nutzungvalue: string[];
    label: string;
    label_en: string;
    children: NutzungItemData[];
}
export interface NutzungItemData {
    key: string;
    nutzungvalue: string[];
    label: string;
    label_en: string;
}
const FILTERED_KEYS = new Set(["art-086", "art-087", "art-088"]);

const typedDomains = domains as unknown as Domain;
const filteredDomains: Domain = {
    ...typedDomains,
    data: typedDomains.data.filter((item) => !FILTERED_KEYS.has(item.key)),
};

export default filteredDomains;
