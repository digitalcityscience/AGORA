<template>
	<SidebarLayout :id="sidebarID" position="left" :collapsed=false classes="lg:w-2/5 2xl:w-1/4 3xl:w-1/4" width="33vw">
		<template #header>
				<div class="h-full flex flex-col justify-center px-1">
					<p class="font-bold text-xl text-slate-50 align-middle">{{ $t('ligfinder.title') }}</p>
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
				<Button @click="applier">{{ $t('ligfinder.filter.apply') }}</Button>
				<Button @click="resetAplliedFilters" severity="danger">{{ $t('ligfinder.filter.reset') }}</Button>
				<Button v-if="resultStore.isFilterApplied" @click="getTable()">
					<span v-if="isTableDataLoading" class="pi pi-spinner animate-spin mr-1"></span>
					{{ $t('ligfinder.filter.getTable') }}
				</Button>
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
import { defineAsyncComponent, ref } from "vue";
import { useResultStore } from "../../store/ligfinder/result";

const LIGGeometryFilter = defineAsyncComponent(async () => await import("./LIGGeometryFilter.vue"))
const LIGCriteriaFilter = defineAsyncComponent(async () => await import("./LIGCriteriaFilter.vue"))
const LIGAreaFilter = defineAsyncComponent(async () => await import("./LIGMetricsFilter.vue"))

const resultStore = useResultStore()
const ligFilterStore = useLigfinderMainStore()
const mapStore = useMapStore()
const sidebarID = "ligfinder-sidebar"
const iconElement = document.createElement("span")
iconElement.classList.add("material-icons-outlined")
iconElement.textContent = "filter_alt"
const sidebarControl = new SidebarControl("", sidebarID, document.createElement("div"), iconElement)
mapStore.map.addControl(sidebarControl, "top-left")
function applier(): void{
    ligFilterStore.applyAllFilters().then(()=>{
        console.info("filter applied", mapStore.map.getFilter(`${import.meta.env.VITE_PARCEL_DATASET_LAYERNAME}`))
        resultStore.isFilterApplied = true
        resultStore.lastAppliedFilter = resultStore.createAppliedFilterBody()
    }).catch((error)=>{ console.error(error) })
}
function resetAplliedFilters(): void{
    ligFilterStore.resetFilters()
    resultStore.resetResultInfo()
}
const isTableDataLoading = ref<boolean>(false)
function getTable(): void {
    isTableDataLoading.value = true
    resultStore.fetchAppliedFilterResult().then((response) => {
        resultStore.appliedFilterResult = response
        isTableDataLoading.value = false
        console.info(response)
    }).catch((error) => {
        console.error(error)
        isTableDataLoading.value = false
    });
}
</script>

<style scoped>
</style>
