<template>
	<Card class="w-full">
		<template #title>Drawn Areas</template>
		<template #content>
			<div class="w-full" v-if="geometry.selectedDrawnGeometry.length>0">
				<ChipWrapper v-for="(feature,index) in geometry.selectedDrawnGeometry" :key="feature.id" :label="`Area-${index}`" @remove="removeFromSelectedDrawnGeometries(feature)" removable severity="success"/>
			</div>
			<div class="w-full grid grid-cols-3">
				<div class="p-1" v-if="!drawTool.drawOnProgress && !drawTool.editOnProgress">
					<Button class="w-full" size="small" @click="startDraw">Start Draw</Button>
				</div>
				<div class="p-1" v-if="(drawTool.drawOnProgress || drawTool.editOnProgress)">
					<Button class="w-full" size="small"  :disabled="!(drawTool.drawOnProgress || drawTool.editOnProgress)" @click="drawTool.stopDrawMode">Cancel Draw</Button>
				</div>
				<div class="p-1" v-if="!drawTool.editOnProgress && drawTool.drawOnProgress">
					<Button class="w-full" size="small" :disabled="!drawTool.drawOnProgress" @click="drawTool.editMode">Edit Draw</Button>
				</div>
				<div class="p-1" v-else>
					<Button class="w-full" size="small" :disabled="!drawTool.editOnProgress" @click="startDraw">Continue Draw</Button>
				</div>
				<div class="p-1">
					<Button class="w-full" size="small" :disabled="drawTool.drawMode !== 'polygon' " @click="addToDrawnArea">Add Drawn Area</Button>
				</div>
			</div>
		</template>
	</Card>
</template>

<script setup lang="ts">
import Card from "primevue/card"
import Button from "primevue/button"
import ChipWrapper from "../ChipWrapper.vue"
import { useDrawStore } from "../../store/draw"
import { useGeometryStore } from "../../store/ligfinder/geometry";
import { type Feature } from "geojson"

const geometry = useGeometryStore()
const drawTool = useDrawStore()
const drawMode = "polygon"
function startDraw(): void{
    drawTool.drawMode = drawMode
    drawTool.initDrawMode()
}
function addToDrawnArea(): void{
    if (drawMode === "polygon"){
        const drawnAreas = drawTool.getSnapshot()
        if (drawnAreas.length > 0) {
            drawnAreas.forEach((feature)=> {
                try {
                    geometry.addToSelectedDrawnGeometry(feature)
                    drawTool.clearSnapshot()
                } catch (error) {
                    console.error(error)
                }
            })
        } else {
            console.error("there is no polygon to add")
        }
    } else {
        console.error("You are trying to add invalid data type")
    }
}
function removeFromSelectedDrawnGeometries(item: Feature): void {
    try {
        geometry.removeFromSelectedDrawnGeometry(item)
    } catch (error) {
        console.error(error)
    }
}
</script>

<style scoped>

</style>
