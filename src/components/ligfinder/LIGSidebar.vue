<template>
	<SidebarLayout :id="sidebarID" position="left" :collapsed=false classes="lg:w-2/5 2xl:w-1/4 3xl:w-1/4" width="33vw">
		<template #header>
				<div class="h-full flex flex-col justify-center px-1">
					<p class="font-bold text-xl text-slate-50 align-middle">{{ $t('ligfinder.title') }}</p>
				</div>
		</template>
		<div class="w-full">
			<div class="py-1">
				<LIGParcelSyleSelection></LIGParcelSyleSelection>
			</div>
			<div class="py-1">
				<LIGCriteriaFilter></LIGCriteriaFilter>
			</div>
			<div class="py-1">
				<LIGAreaFilter></LIGAreaFilter>
			</div>
			<div>
				<LIGGRZFilter></LIGGRZFilter>
			</div>
			<div class="py-1">
				<LIGGeometryFilter></LIGGeometryFilter>
			</div>
			<div class="py-1">
				<LIGParcelMaximizer></LIGParcelMaximizer>
			</div>
		</div>
		<template #footer>
			<div class="apply-filter w-full flex justify-around py-2">
				<Button @click="applier">
					<span v-if="ligFilterStore.isFilterApplying" class="pi pi-spinner animate-spin mr-1"></span>
					{{ $t('ligfinder.filter.apply') }}</Button>
				<Button @click="resetAppliedFilters" severity="danger">{{ $t('ligfinder.filter.reset') }}</Button>
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
import { useToast } from "primevue";
import { useParcelStore } from "../../store/ligfinder/parcel";

const LIGGeometryFilter = defineAsyncComponent(async () => await import("./LIGGeometryFilter.vue"))
const LIGCriteriaFilter = defineAsyncComponent(async () => await import("./LIGCriteriaFilter.vue"))
const LIGAreaFilter = defineAsyncComponent(async () => await import("./LIGMetricsFilter.vue"))
const LIGGRZFilter = defineAsyncComponent(async () => await import("./LIGGRZFilter.vue"))
const LIGParcelSyleSelection = defineAsyncComponent(async () => await import("./LIGParcelSyleSelection.vue"))
const LIGParcelMaximizer = defineAsyncComponent(async () => await import("./LIGParcelMaximizer.vue"))

const toast = useToast()
const resultStore = useResultStore()
const ligFilterStore = useLigfinderMainStore()
const mapStore = useMapStore()
const parcelStore = useParcelStore()
const sidebarID = "ligfinder-sidebar"
const iconElement = document.createElement("span")
iconElement.classList.add("material-icons-outlined")
iconElement.textContent = "filter_alt"
const sidebarControl = new SidebarControl("", sidebarID, document.createElement("div"), iconElement)
mapStore.map.addControl(sidebarControl, "top-left")
function applier(): void{
    ligFilterStore.applyAllFilters(`${import.meta.env.VITE_PARCEL_DATASET_LAYERNAME}`).then(()=>{
        resultStore.isFilterApplied = true
        resultStore.lastAppliedFilter = resultStore.createAppliedFilterBody()
        if (parcelStore.maximizedParcelsOnMap) {
            parcelStore.cancelTempMaximizedParcels(false)
        }
        if (ligFilterStore.isMaximizerActive) {
            parcelStore.getResults()
        }
        const tableBar = document.getElementById("ligfinder-result-table")
        if (tableBar !== null && !tableBar.classList.contains("collapsed")) {
            tableBar.classList.add("collapsed")
        }
    }).catch((error)=>{
        console.error(error)
        toast.add({ severity: "error", summary: "Error", detail: error, life: 10000 })
    })
}
function resetAppliedFilters(): void{
    ligFilterStore.resetFilters()
    resultStore.resetResultInfo()
}
const isTableDataLoading = ref<boolean>(false)
function getTable(): void {
    isTableDataLoading.value = true
    resultStore.fetchAppliedFilterResult().then((response) => {
        resultStore.appliedFilterResult = response
        isTableDataLoading.value = false
        const tableBar = document.getElementById("ligfinder-result-table")
        if (tableBar !== null && tableBar.classList.contains("collapsed")) {
            tableBar.classList.remove("collapsed")
        }
    }).catch((error) => {
        console.error(error)
        toast.add({ severity: "error", summary: "Error", detail: "Failed to fetch table result", life: 10000 })
        isTableDataLoading.value = false
    });
}
</script>

<style scoped>
</style>
