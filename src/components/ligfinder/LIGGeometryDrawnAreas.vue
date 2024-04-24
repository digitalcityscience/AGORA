<template>
	<Card class="w-full">
		<template #title>{{ $t('ligfinder.filter.geometry.drawn.title')}}</template>
		<template #content>
			<div class="w-full py-1" v-if="geometry.selectedDrawnGeometry.length>0">
				<ChipWrapper v-for="(feature,index) in geometry.selectedDrawnGeometry" :key="feature.id" :label="`Area-${index}`" @remove="removeFromSelectedDrawnGeometries(feature)" removable severity="success"/>
			</div>
			<div class="w-full grid lg:grid-cols-1 2xl:grid-cols-3">
				<div class="p-1" v-if="!drawTool.drawOnProgress && !drawTool.editOnProgress">
					<Button class="w-full" size="small" @click="startDraw">{{ $t('ligfinder.filter.geometry.drawn.start')}}</Button>
				</div>
				<div class="p-1" v-if="(drawTool.drawOnProgress || drawTool.editOnProgress)">
					<Button class="w-full" size="small"  :disabled="!(drawTool.drawOnProgress || drawTool.editOnProgress)" @click="drawTool.stopDrawMode">{{ $t('ligfinder.filter.geometry.drawn.cancel')}}</Button>
				</div>
				<div class="p-1" v-if="!drawTool.editOnProgress && drawTool.drawOnProgress">
					<Button class="w-full" size="small" :disabled="!drawTool.drawOnProgress" @click="drawTool.editMode">{{ $t('ligfinder.filter.geometry.drawn.edit')}}</Button>
				</div>
				<div class="p-1" v-else>
					<Button class="w-full" size="small" :disabled="!drawTool.editOnProgress" @click="startDraw">{{ $t('ligfinder.filter.geometry.drawn.continue')}}</Button>
				</div>
				<div class="p-1">
					<Button class="w-full" size="small" :disabled="drawTool.drawMode !== 'polygon' " @click="addToDrawnArea">{{ $t('ligfinder.filter.geometry.drawn.add')}}</Button>
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
                } catch (error) {
                    console.error(error)
                }
            })
            drawTool.stopDrawMode()
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
