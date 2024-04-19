<template>
	<SidebarLayout :id="sidebarID" position="left" :collapsed=false classes="lg:w-1/3 2xl:w-1/4 3xl:w-1/4" width="33vw">
		<template #header>
				<div class="h-full flex flex-col justify-center px-1">
					<p class="font-bold text-xl text-slate-50 align-middle">LIGFinder</p>
				</div>
		</template>
		<div class="w-full">
			<div class="py-1">
				<LIGCriteriaFilter></LIGCriteriaFilter>
			</div>
			<div class="py-1">
				<LIGAreaFilter></LIGAreaFilter>
			</div>
			<div class="py-1">
				<LIGGeometryFilter></LIGGeometryFilter>
			</div>
		</div>
		<template #footer>
			<div class="apply-filter w-full flex justify-around py-2">
				<Button @click="applier">Apply</Button>
				<Button @click="ligFilterStore.resetFilters" severity="danger">Reset All</Button>
			</div>
		</template>
	</SidebarLayout>
</template>

<script setup lang="ts">
import SidebarLayout from "../SidebarLayout.vue";
import Button from "primevue/button";
import { useMapStore } from "../../store/map";
import { useLigfinderMainStore } from "../../store/ligfinder/main"
import { SidebarControl } from "../../core/helpers/sidebarControl";
import { defineAsyncComponent } from "vue";

const LIGGeometryFilter = defineAsyncComponent(async () => await import("./LIGGeometryFilter.vue"))
const LIGCriteriaFilter = defineAsyncComponent(async () => await import("./LIGCriteriaFilter.vue"))
const LIGAreaFilter = defineAsyncComponent(async () => await import("./LIGMetricsFilter.vue"))

const ligFilterStore = useLigfinderMainStore()
const mapStore = useMapStore()
const sidebarID = "ligfinder-sidebar"
const sidebarControl = new SidebarControl("", sidebarID, document.createElement("div"))
mapStore.map.addControl(sidebarControl, "top-left")
function applier(): void{
    ligFilterStore.applyAllFilters().then(()=>{ console.info("filter applied", mapStore.map.getFilter(`${import.meta.env.VITE_PARCEL_DATASET_LAYERNAME}`)) }).catch((error)=>{ console.error(error) })
}
</script>

<style scoped>
</style>
