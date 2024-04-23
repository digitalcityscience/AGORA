import { defineStore, acceptHMRUpdate } from "pinia"
import { ref } from "vue"
import { type FeatureCollection, type Feature } from "geojson"
import { useMapStore } from "../map"
import { type MapMouseEvent, type Map } from "maplibre-gl"
import { TerraDraw, TerraDrawMapLibreGLAdapter, TerraDrawPointMode } from "terra-draw"
import { useDrawStore } from "../draw"
export interface IsochroneCenter {
    lng: number,
    lat: number
}
interface TravelMode {
    name: string,
    icon: string,
    value: TravelModes
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
interface ExtendedFeatureCollection extends FeatureCollection{
    union: boolean,
    tableName: string
}
export interface UnionSelectionItem {
    name: string,
    value: "union"|"intersection"
}
export interface GeometryFilterAPIResponse {
    gids: number[]
}
export const useGeometryStore = defineStore("geometry", () => {
    const mapStore = useMapStore()
    const drawTool = useDrawStore()
    // ADMINISTRATIVE GEOMETRY
    const activeAdministrativeArea = ref<AdministrativeBoundariesListItem | null>(null)
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
                updateSelectedAreasTempLayer()
                return true
            }
        } else {
            selectedAdministrativeFeaturesList.value.push(item)
            updateSelectedAreasTempLayer()
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
            selectedAdministrativeFeaturesList.value.splice(index, 1);
            updateSelectedAreasTempLayer()
            return true;
        } else {
            return false;
        }
    }

    function changeActiveAdminLayerOnMap(): void{
        if (activeAdministrativeArea.value !== null) {
            const activeData = administrativeDataList.value.filter((item) => { return item.table_name === activeAdministrativeArea.value!.table_name })
            updateActiveAdminLayer(activeData[0].data)
        } else {
            const emptyGeojson: FeatureCollection = {
                type: "FeatureCollection",
                features:[]
            }
            updateActiveAdminLayer(emptyGeojson)
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
                updateSelectedAreasTempLayer()
                console.log(selectedDrawnGeometry.value)
                return true
            }
        } else {
            selectedDrawnGeometry.value.push(item)
            updateSelectedAreasTempLayer()
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
    const selectionOnProgress = ref<boolean>(false)
    const traveModeList = ref<TravelMode[]>([{ name: "walk", icon: "directions_walk", value: "walk_network" }, { name: "bike", icon: "directions_bike", value: "bike_network" }, { name: "drive", icon: "directions_car", value: "drive_network" }])
    const selectedTravelMode = ref<TravelMode>({ name: "walk", icon: "pi-user", value: "walk_network" })
    const centerPoint = ref<IsochroneCenter>()
    const travelTime = ref<number>(0)
    const centerSelectDrawer = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map: mapStore.map as unknown as Map }),
        modes: [
            new TerraDrawPointMode({
                styles: {
                    pointColor: "#AA4545",
                    pointWidth: 12
                }
            })
        ]
    })
    function createIsochrone(): void {
        if (centerPoint.value === undefined) {
            console.error("There is no center point")
        }
        if (!(travelTime.value > 0)) {
            console.error("There is not enough travel time")
        }
        if (centerPoint.value?.lat !== undefined && centerPoint.value.lng !== undefined) {
            const isochroneInfo: IsochroneForm = {
                time: travelTime.value,
                center: { ...centerPoint.value },
                mode: selectedTravelMode.value.value
            }
            getIsochrone(isochroneInfo).then((response) => {
                addIsochroneSource(response)
            }).catch((error => { console.error(error); })).finally(() => {
                cancelCenterSelection()
            })
        }
    }
    function startCenterSelection(): void {
        selectionOnProgress.value = true
        drawTool.stopDrawMode()
        centerSelectDrawer.start()
        centerSelectDrawer.setMode("point")
        centerSelectDrawer.on("change", centerSelector)
    }
    function cancelCenterSelection(): void {
        console.log("canceling center selection")
        selectionOnProgress.value = false
        centerSelectDrawer.setMode("static")
        centerSelectDrawer.off("change", centerSelector)
        centerSelectDrawer.stop()
        centerPoint.value = undefined
        travelTime.value = 0
    }
    function centerSelector(): void {
        const snap = centerSelectDrawer.getSnapshot()
        if (snap.length > 1) {
            centerSelectDrawer.removeFeatures([snap[0].id ?? ""])
        }
        centerPoint.value = { ...{ lng: snap[0].geometry.coordinates[0] as number, lat: snap[0].geometry.coordinates[1] as number } }
    }
    const isochroneOnTheMap = ref<boolean>(false)
    const isochroneOnTheMapData = ref<FeatureCollection>()
    function addIsochroneSource(src: FeatureCollection): void {
        const layerStyle = { paint: { "fill-color": "#abcdef", "fill-opacity": 1 } }
        mapStore.addMapDataSource("geojson", "isochrone-temp-source", false, undefined, undefined, src).then(() => {
            mapStore.addMapLayer("geojson", "isochrone-temp-source", "fill", layerStyle, undefined, undefined, src).then(() => {
                isochroneOnTheMap.value = true
                isochroneOnTheMapData.value = src
            }).catch((error) => { console.log(error) })
        }).catch((error) => { console.error(error) })
    }
    function addSelectedIsochrone(data: FeatureCollection): void {
        const applied = addToSelectedIsochrone(data)
        if (applied) {
            cancelIsochroneSelection()
        }
    }
    function cancelIsochroneSelection(): void {
        console.log("canceling isochrone selection")
        console.log(centerSelectDrawer.enabled)
        if (mapStore.map.getLayer("isochrone-temp-source") !== undefined){
            mapStore.map.removeLayer("isochrone-temp-source")
            mapStore.removeFromLayerList("isochrone-temp-source")
            mapStore.map.removeSource("isochrone-temp-source")
            isochroneOnTheMap.value = false
        }
        if (centerSelectDrawer.enabled){
            cancelCenterSelection()
        }
    }
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
    const selectedIsochrone = ref<Feature[]>([])
    function addToSelectedIsochrone(item: FeatureCollection): boolean {
        const itemList: Feature[] = []
        item.features.forEach((feature) => {
            itemList.push(feature)
        })
        selectedIsochrone.value = itemList
        updateSelectedAreasTempLayer()
        return true
    }
    function removeSelectedIsochrone(): void{
        selectedIsochrone.value = []
    }
    // GEOMETRY FILTER
    async function createGeometryFilter(): Promise<GeometryFilterAPIResponse> {
        const featureCollection: ExtendedFeatureCollection = createSelectedGeometryGeoJSON(true) as ExtendedFeatureCollection
        if (featureCollection.features.length===0){
            return await Promise.resolve({ gids:[] })
        }
        const response = await fetch(`${import.meta.env.VITE_AGORA_API_BASE_URL}/geometry/filter`,
            {
                method: "POST",
                redirect: "follow",
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify(featureCollection)
            })
        if (!response.ok) {
            // Handle non-2xx responses
            const errorText = await response.text(); // Using text() as the response might not always be JSON
            throw new Error(`Failed to fetch geometry filter: ${response.status} ${errorText}`);
        }
        return await response.json()
    }
    function createGeometryFilterExpression(idList: number[]): any[]{
        if (idList.length>0){
            return ["in", ["get", "gid"], ["literal", idList]]
        } else {
            return []
        }
    }
    const geometryFilterResult = ref<string[]>([])
    function addToGeometryFilterResult(item: string[]): void {
        geometryFilterResult.value = item
        updateSelectedAreasTempLayer()
    }
    function clearGeometryFilterResult(): void{
        geometryFilterResult.value = []
    }
    const unionSelectionList = ref<UnionSelectionItem[]>([{ name:"union", value:"union" }, { name:"intersection", value:"intersection" }])
    const isUnion = ref<UnionSelectionItem>({ name:"union", value:"union" })
    function createSelectedGeometryGeoJSON(isExtended: boolean): ExtendedFeatureCollection|FeatureCollection{
        const allSelectedFeatures: Feature[] = []
        selectedAdministrativeFeaturesList.value.forEach((feature) => {
            allSelectedFeatures.push(feature.data)
        })
        selectedDrawnGeometry.value.forEach((feature) => {
            allSelectedFeatures.push(feature)
        })
        selectedIsochrone.value.forEach((feature) => {
            allSelectedFeatures.push(feature)
        })
        if (isExtended){
            const featureCollection: ExtendedFeatureCollection = {
                type: "FeatureCollection",
                features: allSelectedFeatures,
                union:isUnion.value.value === "union",
                tableName:"parcel"
            }
            return featureCollection
        } else {
            const featureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: allSelectedFeatures
            }
            return featureCollection
        }
    }
    function createSelectedAreasTempLayer(): void{
        const features: FeatureCollection = createSelectedGeometryGeoJSON(false) as FeatureCollection
        const layerStyle: Record<string, any> = {
            paint:{
                "fill-color": "#FF0000",
                "fill-opacity": 0.2,
                "fill-outline-color": "#000000"
            }
        }
        mapStore.addMapDataSource("geojson", "selectedAreasTempLayer", false, undefined, undefined, features).then(()=>{
            mapStore.addMapLayer("geojson", "selectedAreasTempLayer", "fill", layerStyle, undefined, undefined, features).then(()=>{}).catch((error)=>{ console.error(error) })
        }).catch((error)=>{ console.error(error) })
    }
    function updateSelectedAreasTempLayer(): void{
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!(mapStore.map.getSource("selectedAreasTempLayer"))){
            createSelectedAreasTempLayer()
        }
        mapStore.map.getSource("selectedAreasTempLayer").setData(createSelectedGeometryGeoJSON(false) as FeatureCollection)
    }
    function deleteSelectedAreasTempLayer(): void{
        mapStore.map.removeLayer("selectedAreasTempLayer")
        mapStore.map.removeSource("selectedAreasTempLayer")
        mapStore.removeFromLayerList("selectedAreasTempLayer")
    }
    // active administrative area layer operations
    function adminAreaClickEventHandler(e: any): void{
        (e as MapMouseEvent).originalEvent.stopPropagation()
        console.log("event", e as Event)
        console.log(mapStore.map.getLayersOrder())
        const activeDataFeaturesList = administrativeDataList.value.filter((item) => { return item.table_name === activeAdministrativeArea.value?.table_name })
        const clickedFeatureGID = e.features[0].properties.gid
        if (activeDataFeaturesList.length > 0) {
            const clickedItemFeature: Feature = activeDataFeaturesList[0].data.features.filter((feature)=>{ return feature.properties!.gid === clickedFeatureGID })[0]
            const clickedItem: AdministrativeFeature = { data:{ ...clickedItemFeature }, id:activeAdministrativeArea.value!.id, name:activeAdministrativeArea.value!.name, table_name:activeAdministrativeArea.value!.table_name }
            console.log("from click event: ", clickedItem)
            let alreadySelected = false
            selectedAdministrativeFeaturesList.value.forEach((feature) => {
                if ((feature.table_name === clickedItem.table_name) && (feature.data.properties!.gid === clickedItem.data.properties!.gid)){
                    alreadySelected = true
                }
            })
            if (alreadySelected){
                removeFromSelectedAdministrativeFeaturesList(clickedItem)
            } else {
                addToselectedAdministrativeFeaturesList(clickedItem)
            }
        }
    }
    function createActiveAdminLayer(data: FeatureCollection): void{
        const layerStyle: Record<string, any> = {
            paint:{
                "fill-color": "#BE9FCF",
                "fill-opacity": 0.6,
                "fill-outline-color": "#FF0000"
            }
        }
        mapStore.addMapDataSource("geojson", "active-admin", false, undefined, undefined, data).then(()=>{
            mapStore.addMapLayer("geojson", "active-admin", "fill", layerStyle, undefined, undefined, data).then(()=>{
                mapStore.map.on("click", "active-admin", adminAreaClickEventHandler)
            }).catch((error)=>{ console.error(error) })
        }).catch((error)=>{ console.error(error) })
    }
    function updateActiveAdminLayer(data: FeatureCollection): void{
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!(mapStore.map.getSource("active-admin"))){
            createActiveAdminLayer(data)
        }
        mapStore.map.getSource("active-admin").setData(data)
    }
    function deleteActiveAdminLayer(): void{
        mapStore.map.removeLayer("active-admin")
        mapStore.map.removeSource("active-admin")
        mapStore.removeFromLayerList("active-admin")
        mapStore.map.off("click", adminAreaClickEventHandler)
    }

    // reset selected areas
    function resetSelectedAreas(): void{
        removeSelectedIsochrone()
        selectedAdministrativeFeaturesList.value.forEach((feature) => {
            removeFromSelectedAdministrativeFeaturesList(feature)
        })
        selectedDrawnGeometry.value.forEach((feature) => {
            removeFromSelectedDrawnGeometry(feature)
        })
    }
    return {
        activeAdministrativeArea,
        administrativeBoundariesList,
        getAdministrativeBoundariesList,
        administrativeDataList,
        getAdministrativeBoundaryData,
        selectedAdministrativeFeaturesList,
        addToselectedAdministrativeFeaturesList,
        removeFromSelectedAdministrativeFeaturesList,
        changeActiveAdminLayerOnMap,
        selectedDrawnGeometry,
        addToSelectedDrawnGeometry,
        removeFromSelectedDrawnGeometry,
        getIsochrone,
        selectedIsochrone,
        addToSelectedIsochrone,
        removeSelectedIsochrone,
        centerSelectDrawer,
        centerPoint,
        traveModeList,
        isochroneOnTheMap,
        isochroneOnTheMapData,
        travelTime,
        selectedTravelMode,
        createIsochrone,
        startCenterSelection,
        cancelCenterSelection,
        addSelectedIsochrone,
        cancelIsochroneSelection,
        selectionOnProgress,
        createGeometryFilter,
        createGeometryFilterExpression,
        geometryFilterResult,
        addToGeometryFilterResult,
        clearGeometryFilterResult,
        isUnion,
        unionSelectionList,
        createSelectedGeometryGeoJSON,
        createSelectedAreasTempLayer,
        updateSelectedAreasTempLayer,
        deleteSelectedAreasTempLayer,
        createActiveAdminLayer,
        updateActiveAdminLayer,
        deleteActiveAdminLayer,
        resetSelectedAreas
    }
})

/* eslint-disable */
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useGeometryStore, import.meta.hot))
}
