<template>
    <div class="mapview">
        <MapContainer></MapContainer>
        <WorkspaceListing :workspaces="geoserverStore.workspaceList"></WorkspaceListing>
        <MapLayerListing></MapLayerListing>
        <MapDrawingTool></MapDrawingTool>
        <LIGSidebar></LIGSidebar>
        <LIGResultTable></LIGResultTable>
        <Toast/>
    </div>
</template>

<script setup lang="ts">

import { defineAsyncComponent, onMounted } from "vue";
import { useGeoserverStore } from "../store/api/geoserver";
import MapContainer from "../components/map/MapContainer.vue";
const WorkspaceListing = defineAsyncComponent(async () => await import("../components/data/WorkspaceListing.vue"));
const MapLayerListing = defineAsyncComponent(async () => await import("../components/map/layer/MapLayerListing.vue"));
const MapDrawingTool = defineAsyncComponent(async () => await import("../components/map/utils/MapDrawingTool.vue"))
const LIGSidebar = defineAsyncComponent(async () => await import("../components/ligfinder/LIGSidebar.vue"))
const LIGResultTable = defineAsyncComponent(async() => await import("../components/ligfinder/LIGResultTable.vue"))
const Toast = defineAsyncComponent(async () => await import("primevue/toast"))

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
    position: relative;
}
</style>
