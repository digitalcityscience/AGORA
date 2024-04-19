<template>
	<Card class="w-full">
		<template #title>Isochrone Areas</template>
		<template #content>
			<div class="w-full py-1" v-if="geometry.selectedIsochrone.length>0">
				<ChipWrapper v-for="(_isochrone,index) in geometry.selectedIsochrone" :key="index" label="Isochrone" @remove="geometry.removeSelectedIsochrone" removable severity="success"/>
			</div>
			<div class="w-full flex justify-between p-1">
				<Button v-if="!selectionOnProgress" size="small" class="text-xs leading-4 grow-0" @click="startCenterSelection">
					<template #icon>
						<i class="material-icons">add_location_alt</i>
					</template>
				</Button>
				<Button v-else size="small" class="text-xs leading-4 grow-0" @click="cancelCenterSelection">
					<template #icon>
						<i class="material-icons">wrong_location</i>
					</template>
				</Button>
				<SelectButton class="grow-0" v-model="selectedTravelMode" :options="traveModeList" optionLabel="name"
					dataKey="value" aria-labelledby="custom">
					<template #option="slotProps">
						<i class="material-icons">{{ slotProps.option.icon }}</i>
					</template>
				</SelectButton>
				<InputNumber v-model="travelTime" input-class="grow" suffix="min" :min="0"></InputNumber>
				<Button class="grow-0" :disabled="centerPoint === undefined" @click="createIsochrone">Create</Button>
			</div>
			<div class="w-full grid grid-cols-3 pt-1" v-if="isochroneOnTheMap && isochroneOnTheMapData">
                <div class="p-1">
                    <Button class="w-full" size="small" @click="addSelectedIsochrone(isochroneOnTheMapData)">Add to list</Button>
                </div>
                <div class="p-1">
                    <Button class="w-full" size="small" @click="cancelIsochroneSelection()">Cancel</Button>
                </div>
			</div>
		</template>
	</Card>
</template>

<script setup lang="ts">
import Card from "primevue/card"
import SelectButton from "primevue/selectbutton";
import InputNumber from "primevue/inputnumber";
import Button from "primevue/button";
import ChipWrapper from "../ChipWrapper.vue";
import { ref } from "vue";
import { type IsochroneForm, type IsochroneCenter, type TravelModes, useGeometryStore } from "../../store/ligfinder/geometry"
import { TerraDraw, TerraDrawMapLibreGLAdapter, TerraDrawPointMode } from "terra-draw";
import { useMapStore } from "../../store/map";
import { type Map } from "maplibre-gl"
import { type FeatureCollection } from "geojson";

interface TravelMode {
    name: string,
    icon: string,
    value: TravelModes
}
const mapStore = useMapStore()
const geometry = useGeometryStore()
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
const selectionOnProgress = ref<boolean>(false)
const traveModeList = ref<TravelMode[]>([{ name: "walk", icon: "directions_walk", value: "walk_network" }, { name: "bike", icon: "directions_bike", value: "bike_network" }, { name: "drive", icon: "directions_car", value: "drive_network" }])
const selectedTravelMode = ref<TravelMode>({ name: "walk", icon: "pi-user", value: "walk_network" })
const centerPoint = ref<IsochroneCenter>()
const travelTime = ref<number>(0)
function createIsochrone(): void {
    if (centerPoint.value === undefined) {
        console.error("There is no center point")
    }
    if (!(travelTime.value>0)){
        console.error("There is not enough travel time")
    }
    if (centerPoint.value?.lat !== undefined && centerPoint.value.lng !== undefined){
        const isochroneInfo: IsochroneForm = {
            time: travelTime.value,
            center: { ...centerPoint.value },
            mode: selectedTravelMode.value.value
        }
        geometry.getIsochrone(isochroneInfo).then((response)=>{
            addIsochroneSource(response)
        }).catch((error=>{ console.error(error); })).finally(()=>{
            cancelCenterSelection()
        })
    }
}
function startCenterSelection(): void{
    selectionOnProgress.value = true
    centerSelectDrawer.start()
    centerSelectDrawer.setMode("point")
    centerSelectDrawer.on("change", centerSelector)
}
function cancelCenterSelection(): void{
    selectionOnProgress.value = false
    centerSelectDrawer.setMode("static")
    centerSelectDrawer.off("change", centerSelector)
    centerSelectDrawer.stop()
    centerPoint.value = undefined
    travelTime.value = 0
}
function centerSelector(): void{
    const snap = centerSelectDrawer.getSnapshot()
    if (snap.length>1){
        centerSelectDrawer.removeFeatures([snap[0].id ?? ""])
    }
    centerPoint.value = { ...{ lng:snap[0].geometry.coordinates[0] as number, lat:snap[0].geometry.coordinates[1] as number } }
}
const isochroneOnTheMap = ref<boolean>(false)
const isochroneOnTheMapData = ref<FeatureCollection>()
function addIsochroneSource(src: FeatureCollection): void{
    const layerStyle = { paint:{ "fill-color":"#abcdef", "fill-opacity":1 } }
    mapStore.addMapDataSource("geojson", "isochrone-temp-source", false, undefined, undefined, src).then(()=>{
        mapStore.addMapLayer("geojson", "isochrone-temp-source", "fill", layerStyle, undefined, undefined, src).then(()=>{
            isochroneOnTheMap.value = true
            isochroneOnTheMapData.value = src
        }).catch((error)=>{ console.log(error) })
    }).catch((error)=>{ console.error(error) })
}
function addSelectedIsochrone(data: FeatureCollection): void{
    const applied = geometry.addToSelectedIsochrone(data)
    if (applied) {
        cancelIsochroneSelection()
    }
}
function cancelIsochroneSelection(): void{
    mapStore.map.removeLayer("isochrone-temp-source")
    mapStore.removeFromLayerList("isochrone-temp-source")
    mapStore.map.removeSource("isochrone-temp-source")
    isochroneOnTheMap.value = false
}
</script>

<style scoped></style>
