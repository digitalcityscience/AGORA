<template>
	<SidebarLayout :id="sidebarID" position="right" :collapsed=false classes="lg:w-1/2 2xl:w-1/2 3xl:w-1/2"
		width="40vw">
		<template #header>
			<div class="h-full flex flex-col justify-center px-1">
				<p class="font-bold text-xl text-slate-50 align-middle">LIGFinder Result Table</p>
			</div>
		</template>
		<Card>
			<template #content>
				<div class="w-full">
					<div v-if="resultStore.isFilterApplied">
						<div v-if="resultStore.appliedFilterResult !== undefined">
							<div v-if="filterResultTableItems.length > 0">
								<DataTable :value="filterResultTableItems" paginator :rows="10"
									:rowsPerPageOptions="[10, 20, 50]" class="w-full" size="small" table-class="w-full"
									paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
									currentPageReportTemplate="{first} to {last} of {totalRecords}">
									<template #header>
										You have {{ filterResultTableItems.length }} parcels
									</template>
									<Column v-for="(column, index) in resultStore.tableHeaders"
										:field="`properties.${column.value}`" :header="column.text" :key="index">
									</Column>
								</DataTable>
							</div>
							<div v-else>
								<InlineMessage severity="info">No result for applied filters</InlineMessage>
							</div>
						</div>
					</div>
					<div class="w-full flex justify-around" v-else>
						<InlineMessage severity="info">No filter applied</InlineMessage>
					</div>
				</div>
			</template>
			<template #footer>
				<div class="w-full 2xl:grid 2xl:grid-cols-2" v-if="resultStore.isFilterApplied && resultStore.appliedFilterResult && resultStore.appliedFilterResult?.features.length >0">
					<div class="w-full 2xl:flex 2xl:justify-between 2xl:grid-cols-none lg:grid lg:grid-cols-4 lg:gap-2 2xl:gap-0 p-1 ">
						<div class="w-full lg:col-span-2">
							<InputText class="h-10" type="text" v-model="layerName" placeholder="Layer Name"></InputText>
						</div>
						<div class="w-full flex lg:col-span-2">
							<Button @click="addAsLayer" :disabled="layerName.length === 0" class="lg:w-full 2xl:w-auto" size="small">Add as a Layer</Button>
						</div>
					</div>
					<div class="w-full 2xl:flex 2xl:justify-between 2xl:grid-cols-none lg:grid lg:grid-cols-4 lg:gap-2 2xl:gap-0 p-1 ">
						<div class="w-full lg:col-span-2">
							<InputText class="h-10" type="text" v-model="fileName" placeholder="File Name"></InputText>
						</div>
						<div class="w-full flex lg:col-span-2">
							<Button @click="downloadAsGeojson" :disabled="fileName.length === 0" class="lg:w-full 2xl:w-auto" size="small">Download as GeoJSON</Button>
						</div>

					</div>
				</div>
			</template>
		</Card>
	</SidebarLayout>
</template>

<script setup lang="ts">
import Card from "primevue/card";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InlineMessage from "primevue/inlinemessage";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import SidebarLayout from "../SidebarLayout.vue";
import { useMapStore } from "../../store/map"
import { useResultStore } from "../../store/ligfinder/result"
import { SidebarControl } from "../../core/helpers/sidebarControl";
import { computed, ref } from "vue";
const mapStore = useMapStore()
const resultStore = useResultStore()
const sidebarID = "ligfinder-result-table"
const iconElement = document.createElement("span")
iconElement.classList.add("material-icons-outlined")
iconElement.textContent = "table_chart"
const sidebarControl = new SidebarControl("", sidebarID, document.createElement("div"), iconElement)
const layerName = ref<string>("")
const fileName = ref<string>("")
const filterResultTableItems = computed(() => {
    if (resultStore.appliedFilterResult !== undefined) {
        return resultStore.appliedFilterResult.features
    } else {
        return []
    }
})

mapStore.map.addControl(sidebarControl, "top-left")

function addAsLayer(): void {
    const sanitizedLayerName = layerName.value.replace(/[^a-zA-Z0-9-_]/g, "");
    resultStore.saveAsLayer(sanitizedLayerName)
}
function downloadAsGeojson(): void {
    const sanitizedFileName = fileName.value.replace(/[^a-zA-Z0-9-_]/g, "");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resultStore.appliedFilterResult));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", sanitizedFileName.length > 0 ? `${sanitizedFileName.trim()}.geojson`:"geojson-data.geojson");
    document.body.appendChild(downloadAnchorNode); // required for Firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
</script>

<style scoped></style>
