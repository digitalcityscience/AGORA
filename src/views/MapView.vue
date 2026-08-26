<template>
    <div class="mapview">
        <MapSideFrame side="left"></MapSideFrame>
        <div class="mapview-map">
            <MapContainer></MapContainer>
        </div>
        <MapSideFrame side="right"></MapSideFrame>
        <WorkspaceListing :workspaces="geoserverStore.workspaceList"></WorkspaceListing>
        <MapLayerListing></MapLayerListing>
        <MapDrawingTool></MapDrawingTool>
        <MapFeatureInspector></MapFeatureInspector>
        <LIGSidebar></LIGSidebar>
        <LIGResultTable></LIGResultTable>
    </div>
</template>

<script setup lang="ts">

import { defineAsyncComponent, onMounted } from "vue";
import { useGeoserverStore } from "../store/api/geoserver";
import MapContainer from "../components/map/MapContainer.vue";
import MapSideFrame from "../components/map/MapSideFrame.vue";
const WorkspaceListing = defineAsyncComponent(async () => await import("../components/data/WorkspaceListing.vue"));
const MapLayerListing = defineAsyncComponent(async () => await import("../components/map/layer/MapLayerListing.vue"));
const MapDrawingTool = defineAsyncComponent(async () => await import("../components/map/interactions/MapDrawingTool.vue"))
const MapFeatureInspector = defineAsyncComponent(async () => await import("../components/map/interactions/MapFeatureInspector.vue"))
const LIGSidebar = defineAsyncComponent(async () => await import("../components/ligfinder/LIGSidebar.vue"))
const LIGResultTable = defineAsyncComponent(async() => await import("../components/ligfinder/LIGResultTable.vue"))

const geoserverStore = useGeoserverStore()
onMounted(()=>{
    geoserverStore.getWorkspaceList().then((data)=>{
        geoserverStore.workspaceList = data.workspaces.workspace
    }).catch((error)=>{ console.error(error) })
})
</script>

<style scoped>
.mapview{
    width:100%;
    height:100%;
    min-width: 0;
    min-height: 0;
    position: relative;
    display: grid;
    grid-template-columns: var(--agora-map-frame-width) minmax(0, 1fr) var(--agora-map-frame-width);
    grid-template-rows: minmax(0, 1fr);
}
.mapview-map {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
}
</style>
