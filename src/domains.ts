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
export default domains as unknown as Domain;
