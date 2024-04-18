import { defineStore, acceptHMRUpdate } from "pinia"
import { ref } from "vue"
import { type FeatureCollection, type Feature } from "geojson"
export interface IsochroneCenter {
    lng: number,
    lat: number
}
export interface BaseAdministrativeFeaturePropertyItem {
    gid: number,
    name: string
}
export interface AdministrativeBoundariesListItem {
    id: number,
    name: string,
    "table_name": string,
}
interface AdministrativeBoundariesAPIResponse {
    data: AdministrativeBoundariesListItem[]
}
export interface AdministrativeFeatureCollection extends AdministrativeBoundariesListItem {
    data: FeatureCollection
}
export interface AdministrativeFeature extends AdministrativeBoundariesListItem {
    data: Feature
}
export type TravelModes = "walk_network" | "drive_network" | "bike_network"
export interface IsochroneForm {
    time: number,
    center: { "lng": number, "lat": number },
    mode: TravelModes
}
export const useGeometryStore = defineStore("geometry", () => {
    // ADMINISTRATIVE GEOMETRY
    const administrativeBoundariesList = ref<AdministrativeBoundariesListItem[]>()
    async function getAdministrativeBoundariesList(): Promise<AdministrativeBoundariesAPIResponse>{
        const response = await fetch(`${import.meta.env.VITE_AGORA_API_BASE_URL}/administrative/list`,
            {
                method: "GET",
                redirect: "follow",
                headers: new Headers({
                    "Content-Type": "application/json",
                })
            })
        return await response.json()
    }
    const administrativeDataList = ref<AdministrativeFeatureCollection[]>([])
    async function getAdministrativeBoundaryData(id: number): Promise<FeatureCollection> {
        const response = await fetch(`${import.meta.env.VITE_AGORA_API_BASE_URL}/administrative/data/${id}`,
            {
                method: "GET",
                redirect: "follow",
                headers: new Headers({
                    "Content-Type": "application/json",
                })
            })
        return await response.json()
    }
    const selectedAdministrativeFeaturesList = ref<AdministrativeFeature[]>([])
    /**
     * Adds an administrative feature to the selected administrative features list.
     * @param item - The administrative feature to add to the list.
     * @returns A boolean indicating whether the feature was successfully added (`true`) or not (`false`).
     */
    function addToselectedAdministrativeFeaturesList(item: AdministrativeFeature): boolean {
        console.log(item)
        if (selectedAdministrativeFeaturesList.value.length>0){
            let alreadySelected = false
            selectedAdministrativeFeaturesList.value.forEach((feature) => {
                if ((feature.table_name === item.table_name) && (feature.data.properties!.gid === item.data.properties!.gid)){
                    alreadySelected = true
                }
            })
            if (alreadySelected){
                throw new Error("Feature already selected")
            } else {
                selectedAdministrativeFeaturesList.value.push(item)
                return true
            }
        } else {
            selectedAdministrativeFeaturesList.value.push(item)
            return true
        }
    }
    /**
     * Removes an administrative feature from the selected administrative features list.
     * @param item - The administrative feature to remove from the list.
     * @returns A boolean indicating whether the feature was successfully removed (`true`) or not (`false`).
     */
    function removeFromSelectedAdministrativeFeaturesList(item: AdministrativeFeature): boolean {
        const index = selectedAdministrativeFeaturesList.value.findIndex(feature =>
            feature.table_name === item.table_name && feature.data.properties!.gid === item.data.properties!.gid)
        if (index !== -1) {
            console.log("todelete", selectedAdministrativeFeaturesList.value[index])
            console.log("totalbefore", selectedAdministrativeFeaturesList.value.length)
            selectedAdministrativeFeaturesList.value.splice(index, 1);
            console.log("totalafter", selectedAdministrativeFeaturesList.value.length)
            return true;
        } else {
            return false;
        }
    }
    // DRAWN GEOMETRY
    const selectedDrawnGeometry = ref<Feature[]>([])
    /**
     * Adds an administrative feature to the selected administrative features list.
     * @param item - The feature to add to the list.
     * @returns A boolean indicating whether the feature was successfully added (`true`) or not (`false`).
     */
    function addToSelectedDrawnGeometry(item: Feature): boolean {
        if (selectedDrawnGeometry.value.length > 0){
            let alreadySelected = false
            selectedDrawnGeometry.value.forEach((feature) => {
                if (feature.id === item.id){
                    alreadySelected = true
                }
            })
            if (alreadySelected){
                throw new Error("Feature already selected")
            } else {
                selectedDrawnGeometry.value.push(item)
                console.log(selectedDrawnGeometry.value)
                return true
            }
        } else {
            selectedDrawnGeometry.value.push(item)
            console.log(selectedDrawnGeometry.value)
        }
        return true
    }
    /**
     * Removes an administrative feature from the selected administrative features list.
     * @param item - The feature to remove from the list.
     * @returns A boolean indicating whether the feature was successfully removed (`true`) or not (`false`).
     */
    function removeFromSelectedDrawnGeometry(item: Feature): boolean {
        const index = selectedDrawnGeometry.value.findIndex(feature => feature.id === item.id)
        if (index !== -1) {
            selectedDrawnGeometry.value.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }
    // ISOCHRONE GEOMETRY
    async function getIsochrone(data: IsochroneForm): Promise<FeatureCollection>{
        const response = await fetch(`${import.meta.env.VITE_AGORA_API_BASE_URL}/geometry/isochrone`,
            {
                method: "POST",
                redirect: "follow",
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify(data)
            })
        return await response.json()
    }
    return {
        administrativeBoundariesList,
        getAdministrativeBoundariesList,
        administrativeDataList,
        getAdministrativeBoundaryData,
        selectedAdministrativeFeaturesList,
        addToselectedAdministrativeFeaturesList,
        removeFromSelectedAdministrativeFeaturesList,
        selectedDrawnGeometry,
        addToSelectedDrawnGeometry,
        removeFromSelectedDrawnGeometry,
        getIsochrone
    }
})

/* eslint-disable */
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useGeometryStore, import.meta.hot))
}
