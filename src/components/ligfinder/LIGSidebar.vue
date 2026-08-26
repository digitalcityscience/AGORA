<template>
	<BaseSlideoverSidebarComponent
		:id="sidebarID"
		side="left"
		:collapsed="false"
		width-class="w-[min(33rem,34vw)]"
	>
		<template #header>
				<span>{{ $t('ligfinder.title') }}</span>
		</template>
		<div class="ligfinder-content min-w-0 w-full">
			<div class="pb-1">
				<LIGParcelSyleSelection></LIGParcelSyleSelection>
			</div>
			<div class="pb-1">
				<LIGCriteriaFilter></LIGCriteriaFilter>
			</div>
			<div class="pb-1">
				<LIGAreaFilter></LIGAreaFilter>
			</div>
			<div class="pb-1">
				<LIGGRZFilter></LIGGRZFilter>
			</div>
			<div class="pb-1">
				<LIGGeometryFilter></LIGGeometryFilter>
			</div>
			<div class="pb-1">
				<LIGParcelMaximizer></LIGParcelMaximizer>
			</div>
		</div>
		<template #footer>
			<div class="apply-filter flex w-full flex-wrap justify-center gap-2 py-2">
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
	</BaseSlideoverSidebarComponent>
</template>

<script setup lang="ts">
import BaseSlideoverSidebarComponent from "../base/BaseSlideoverSidebarComponent.vue";
import Button from "primevue/button";
import { useLigfinderMainStore } from "../../store/ligfinder/main"
import { defineAsyncComponent, ref } from "vue";
import { useResultStore } from "../../store/ligfinder/result";
import { useToast } from "primevue";
import { useParcelStore } from "../../store/ligfinder/parcel";
import { closeSlideoverSidebar, openSlideoverSidebar } from "../../core/helpers/slideoverSidebarRegistry";

const LIGGeometryFilter = defineAsyncComponent(async () => await import("./LIGGeometryFilter.vue"))
const LIGCriteriaFilter = defineAsyncComponent(async () => await import("./LIGCriteriaFilter.vue"))
const LIGAreaFilter = defineAsyncComponent(async () => await import("./LIGMetricsFilter.vue"))
const LIGGRZFilter = defineAsyncComponent(async () => await import("./LIGGRZFilter.vue"))
const LIGParcelSyleSelection = defineAsyncComponent(async () => await import("./LIGParcelSyleSelection.vue"))
const LIGParcelMaximizer = defineAsyncComponent(async () => await import("./LIGParcelMaximizer.vue"))

const toast = useToast()
const resultStore = useResultStore()
const ligFilterStore = useLigfinderMainStore()
const parcelStore = useParcelStore()
const sidebarID = "ligfinder-sidebar"
function applier(): void{
    ligFilterStore.applyAllFilters(`${import.meta.env.VITE_PARCEL_DATASET_LAYERNAME}`).then(()=>{
        resultStore.isFilterApplied = true
        resultStore.lastAppliedFilter = resultStore.createAppliedFilterBody()
        if (parcelStore.maximizedParcelsOnMap) {
            parcelStore.cancelTempMaximizedParcels(false, false)
        }
        if (ligFilterStore.isMaximizerActive) {
            parcelStore.getResults()
        }
        closeSlideoverSidebar("ligfinder-result-table")
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
        openSlideoverSidebar("ligfinder-result-table")
    }).catch((error) => {
        console.error(error)
        toast.add({ severity: "error", summary: "Error", detail: "Failed to fetch table result", life: 10000 })
        isTableDataLoading.value = false
    });
}
</script>

<style scoped>
.ligfinder-content :deep(.p-panel),
.ligfinder-content :deep(.p-panel-content-container),
.ligfinder-content :deep(.p-panel-content-wrapper),
.ligfinder-content :deep(.p-panel-content) {
	min-width: 0;
	max-width: 100%;
}

.ligfinder-content :deep(.p-panel-content-wrapper),
.ligfinder-content :deep(.p-panel-content) {
	width: 100%;
	box-sizing: border-box;
}
</style>

<style scoped>
</style>
