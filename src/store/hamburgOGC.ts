import { type FeatureCollection, type Feature } from "geojson";
import { defineStore, acceptHMRUpdate } from "pinia";
import { ref } from "vue";
export interface Collections {
    title: string;
    description: string;
    crs: string[];
    collections: Collection[];
    links: Link[];
}
export interface Collection {
    title: string;
    id: string;
    extent: Extent;
    itemType: string;
    crs: string[];
    storageCrs: string;
    links: Link[];
    itemCount: number;
}
export interface Extent {
    spatial?: SpatialExtent;
    temporal?: TemporalExtent
}
export interface SpatialExtent {
    bbox: number[][];
    crs: string;
}
export interface TemporalExtent {
    interval: string[][];
    trs: string;
}
export interface Link {
    rel: string;
    type: string;
    title: string;
    href: string;
}
export interface HamburgOGCFeatureCollection extends FeatureCollection {
    numberReturned: number;
    numberMatched: number;
    timeStamp: string;
    links: Link[];
}
export interface BezirkeFeatureCollection extends HamburgOGCFeatureCollection {
    features: BezirkeFeature[];
}
export interface StadtteileFeatureCollection extends HamburgOGCFeatureCollection {
    features: StadtteileFeature[];
}
export interface GemarkungenFeatureCollection extends HamburgOGCFeatureCollection {
    features: GemarkungenFeature[];
}
export interface IDExtendedFeature extends Feature {
    id?: number
}
export interface BezirkeFeature extends IDExtendedFeature {
    properties: {
        bezirk: string;
        bezirk_name: string;
    }
}
export interface StadtteileFeature extends IDExtendedFeature {
    properties: {
        bezirk: string;
        bezirk_name: string;
        stadtteil_schluessel: string;
        stadtteil_name: string;
        stadtteil_nummer: string
    }
}
export interface GemarkungenFeature extends IDExtendedFeature {
    properties: {
        gmn: string,
        name: string,
        bezirk: string
    }
}
export const useHamburgOgcStore = defineStore("hamburgAPI", () => {
    const collectionList=ref<Collections>()
    /**
     * Retrieves a list of collections from the Hamburg OGC API.
     * @returns A promise that resolves with the list of collections.
     */
    async function getCollections(): Promise<Collections>{
        const url = new URL("https://api.hamburg.de/datasets/v1/verwaltungsgrenzen/collections?f=json")
        const response = await fetch(url, {
            method: "GET",
            redirect: "follow",
            headers: new Headers({
                "Content-Type": "application/json",
            }),
        });
        return await response.json();
    }
    /**
     * Retrieves detailed information about a specific collection from the Hamburg OGC API.
     * @param collection The collection for which to retrieve detailed information.
     * @returns A promise that resolves with detailed information about the collection.
     */
    async function getCollection(collection: Collection): Promise<Collection>{
        const link = collection.links.find(link => link.rel === "self");
        if (link === undefined) {
            throw new Error("No self link found");
        }
        const response = await fetch(link.href+"?f=json", {
            method: "GET",
            redirect: "follow",
            headers: new Headers({
                "Content-Type": "application/json",
            }),
        });
        return await response.json();
    }
    /**
     * Retrieves items (features) from a specific collection of the Hamburg OGC API.
     * @param collection The collection from which to retrieve items.
     * @returns A promise that resolves with the items (features) from the collection.
     */
    async function getCollectionItems(collection: Collection): Promise<BezirkeFeatureCollection|StadtteileFeatureCollection|GemarkungenFeatureCollection>{
        const link = collection.links.find(link => link.rel === "items");
        if (link === undefined) {
            throw new Error("No item link found");
        }
        const url = new URL(link.href)
        url.searchParams.set("f", "json")
        url.searchParams.set("limit", collection.itemCount.toString())
        const response = await fetch(url, {
            method: "GET",
            redirect: "follow",
            headers: new Headers({
                "Content-Type": "application/geo+json",
            }),
        });
        return await response.json();
    }
    return {
        collectionList,
        getCollections,
        getCollection,
        getCollectionItems
    };
});

/* eslint-disable */
if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useHamburgOgcStore, import.meta.hot)
	);
}
