<template>
	<SidebarLayout :id="sidebarID" position="right" classes="lg:w-1/2 2xl:w-1/2 3xl:w-1/2"
		width="40vw">
		<template #header>
			<div class="h-full flex flex-col justify-center px-1">
				<p class="font-bold text-xl text-slate-50 align-middle">{{ $t('ligfinder.table.title') }}</p>
			</div>
		</template>
		<Card>
			<template #content>
				<div class="w-full">
					<div v-if="resultStore.isFilterApplied">
						<div v-if="resultStore.appliedFilterResult !== undefined">
							<div v-if="filterResultTableItems.length > 0">
								<DataTable :value="filterResultTableItems" paginator :rows="10" removableSort
									:rowsPerPageOptions="[10, 20, 50]" class="w-full" size="small" table-class="w-full"
									paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink NextPageLink LastPageLink"
									v-model:filters="filters" filter-display="row">
									<template #header>
										{{ $t('ligfinder.table.count',[`${filterResultTableItems.length}`]) }}
									</template>
									<Column :header="$t('ligfinder.table.focus')">
										<template #body="slotProps">
											<Button icon="pi pi-search-plus" @click="focusOnSelectedParcel(slotProps.data)" text rounded aria-label="Include"></Button>
										</template>
									</Column>
									<span v-for="(column,index) in resultStore.tableHeaders" :key="`column-${index}`">
										<Column v-if="column.value === 'bezname'"
											:field="`properties.${column.value}`" :filter-field="column.value==='bezname'?undefined:`properties.${column.value}`" :header="column.text" :key="`bezname-${index}`">
											<template #filter="{ filterModel, filterCallback }">
												<span v-if="column.value === 'bezname'">
													<InputText size="small" v-model="filterModel.value" type="text" @input="filterCallback()" class="p-column-filter" placeholder="Search by bezirke" />
												</span>
											</template>
										</Column>
										<Column v-else
											:field="`properties.${column.value}`" :header="column.text" :key="`other-${index}`" :sortable="column.value === 'area_fme'">
										</Column>
									</span>
								</DataTable>
							</div>
							<div v-else>
								<InlineMessage severity="info">{{ $t('ligfinder.table.noResults') }}</InlineMessage>
							</div>
						</div>
					</div>
					<div class="w-full flex justify-around" v-else>
						<InlineMessage severity="info">{{ $t('ligfinder.table.noFilter') }}</InlineMessage>
					</div>
				</div>
			</template>
			<template #footer>
				<div class="w-full 2xl:grid 2xl:grid-cols-2" v-if="resultStore.isFilterApplied && resultStore.appliedFilterResult && resultStore.appliedFilterResult?.features.length >0">
					<div class="w-full 2xl:flex 2xl:justify-between 2xl:grid-cols-none lg:grid lg:grid-cols-4 lg:gap-2 2xl:gap-0 p-1 ">
						<div class="w-full lg:col-span-2">
							<InputText class="h-10" type="text" v-model="layerName" :placeholder="$t('ligfinder.table.layerName')"></InputText>
						</div>
						<div class="w-full flex lg:col-span-2">
							<Button @click="addAsLayer" :disabled="layerName.length === 0" class="lg:w-full 2xl:w-auto" size="small">{{$t('ligfinder.table.add')}}</Button>
						</div>
					</div>
					<div class="w-full 2xl:flex 2xl:justify-between 2xl:grid-cols-none lg:grid lg:grid-cols-4 lg:gap-2 2xl:gap-0 p-1 ">
						<div class="w-full lg:col-span-2">
							<InputText class="h-10" type="text" v-model="fileName" :placeholder="$t('ligfinder.table.fileName')"></InputText>
						</div>
						<div class="w-full flex lg:col-span-2">
							<Button @click="downloadAsGeojson" :disabled="fileName.length === 0" class="lg:w-full 2xl:w-auto" size="small">{{$t('ligfinder.table.download')}}</Button>
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
import center from "@turf/center";
import { FilterMatchMode } from "primevue/api";
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
function focusOnSelectedParcel(parcel: any): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const parcelCenter = [...center(parcel).geometry.coordinates]
    mapStore.map.flyTo({
        center: parcelCenter,
        zoom: 16,
        speed: 0.7,
        curve: 1,
        easing(t: any) {
            return t;
        }
    });
}

const filters = ref({
    "properties.bezname": { value: null, matchMode: FilterMatchMode.CONTAINS }
});
</script>

<style scoped></style>
