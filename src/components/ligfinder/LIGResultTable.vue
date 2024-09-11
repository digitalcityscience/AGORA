<template>
	<SidebarLayout :id="sidebarID" position="right" classes="lg:w-1/2 2xl:w-1/2 3xl:w-1/2" width="50vw">
		<template #header>
			<div class="h-full flex flex-col justify-center px-1">
				<p class="font-bold text-xl text-slate-50 align-middle">{{ $t('ligfinder.table.title') }}</p>
			</div>
		</template>
		<Card>
			<template #content>
				<Dialog v-model:visible="isFullScreen" modal closable close-on-escape
					:style="{ width: 'calc(100vw - 200px)' }">
					<div class="w-full">
						<div v-if="resultStore.isFilterApplied">
							<div v-if="resultStore.appliedFilterResult !== undefined">
								<div v-if="filterResultTableItems.length > 0">
									<DataTable :value="filterResultTableItems" paginator :rows="10"
										:rowsPerPageOptions="[10, 20, 50]" class="w-full" size="small"
										table-class="w-full"
										paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink NextPageLink LastPageLink"
										v-model:filters="filters" filter-display="menu">
										<template #header>
											{{ $t('ligfinder.table.count', [`${filterResultTableItems.length}`]) }}
										</template>
										<span v-if="resultStore.attributeList.length > 0">
											<Column :header="$t('ligfinder.table.focus')">
												<template #body="slotProps">
													<Button
														icon="pi pi-search-plus"
														@click="focusOnSelectedParcel(slotProps.data)" text rounded>
													</Button>
												</template>
											</Column>
											<span v-for="(column, index) in resultStore.attributeList"
												:key="`column-${index}`">
												<Column :field="`properties.${column.name}`"
													:header="getHeaderText(column.name)"
													:key="column.name === 'bezname' ? `bezname-${index}` : `other-${index}`"
													:sortable="column.name === 'area_fme'"
													:hidden="isHidden(column.name)"
													:dataType="column.binding !== 'java.lang.String' ? 'numeric' : undefined"
													resizableColumns columnResizeMode="fit">
													<template #filter="{ filterModel, filterCallback }">
														<span>
															<InputText size="small" v-model="filterModel.value"
																type="text" @input="filterCallback()"
																class="p-column-filter"
																placeholder="Search by bezirke" />
														</span>
													</template>
													<template #body="{ data }">
														<span v-if="column.binding === 'java.lang.String'">
															{{ data.properties[`${column.name}`] }}
														</span>
														<span v-else>
															{{ formatNumber(data.properties[`${column.name}`]) }}
														</span>
													</template>
												</Column>
											</span>
										</span>
										<span v-else>
											<Column :header="$t('ligfinder.table.focus')">
												<template #body="slotProps">
													<Button icon="pi pi-search-plus"
														@click="focusOnSelectedParcel(slotProps.data)" text rounded
														aria-label="Include"></Button>
												</template>
											</Column>
											<span v-for="(column, index) in resultStore.tableHeaders"
												:key="`column-${index}`">
												<Column v-if="column.value === 'bezname'"
													:field="`properties.${column.value}`"
													:filter-field="column.value === 'bezname' ? undefined : `properties.${column.value}`"
													:header="column.text" :key="`bezname-${index}`">
													<template #filter="{ filterModel, filterCallback }">
														<span v-if="column.value === 'bezname'">
															<InputText size="small" v-model="filterModel.value"
																type="text" @input="filterCallback()"
																class="p-column-filter"
																placeholder="Search by bezirke" />
														</span>
													</template>
												</Column>
												<Column v-else :field="`properties.${column.value}`"
													:header="column.text" :key="`other-${index}`"
													:sortable="column.value === 'area_fme'">
												</Column>
											</span>
										</span>
									</DataTable>
								</div>
								<div class="w-full flex justify-around" v-else>
									<InlineMessage severity="info">{{ $t('ligfinder.table.noResults') }}</InlineMessage>
								</div>
							</div>
						</div>
						<div class="w-full flex justify-around" v-else>
							<InlineMessage severity="info">{{ $t('ligfinder.table.noFilter') }}</InlineMessage>
						</div>
					</div>
				</Dialog>
				<div class="w-full">
					<div v-if="resultStore.isFilterApplied">
						<div v-if="resultStore.appliedFilterResult !== undefined">
							<div v-if="filterResultTableItems.length > 0">
								<DataTable :value="filterResultTableItems" paginator :rows="10"
									:rowsPerPageOptions="[10, 20, 50]" class="w-full" size="small" table-class="w-full"
									paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink NextPageLink LastPageLink"
									v-model:filters="filters" filter-display="menu">
									<template #header>
										<div class="flex justify-between">
											<span class="self-center">
												{{ $t('ligfinder.table.count', [`${filterResultTableItems.length}`]) }}
											</span>
											<Button text raised @click="isFullScreen = true">
												<template #icon>
													<i class="material-icons">open_in_full</i>
												</template>
											</Button>
										</div>
									</template>
									<span v-if="resultStore.attributeList.length > 0">
										<Column :header="$t('ligfinder.table.focus')">
											<template #body="slotProps">
												<Button icon="pi pi-search-plus"
													@click="focusOnSelectedParcel(slotProps.data)" text rounded
													aria-label="Include"></Button>
											</template>
										</Column>
										<span v-for="(column, index) in resultStore.attributeList"
											:key="`column-${index}`">
											<Column :field="`properties.${column.name}`"
												:header="getHeaderText(column.name)"
												:key="column.name === 'bezname' ? `bezname-${index}` : `other-${index}`"
												:sortable="column.name === 'area_fme'" :hidden="isHidden(column.name)"
												:dataType="column.binding !== 'java.lang.String' ? 'numeric' : undefined"
												resizableColumns columnResizeMode="fit">
												<template #filter="{ filterModel, filterCallback }">
													<span>
														<InputText size="small" v-model="filterModel.value" type="text"
															@input="filterCallback()" class="p-column-filter"
															placeholder="Search by bezirke" />
													</span>
												</template>
												<template #body="{ data }">
													<span v-if="column.binding === 'java.lang.String'">
														{{ data.properties[`${column.name}`] }}
													</span>
													<span v-else>
														{{ formatNumber(data.properties[`${column.name}`]) }}
													</span>
												</template>
											</Column>
										</span>
									</span>
									<span v-else>
										<Column :header="$t('ligfinder.table.focus')">
											<template #body="slotProps">
												<Button icon="pi pi-search-plus"
													@click="focusOnSelectedParcel(slotProps.data)" text rounded
													aria-label="Include"></Button>
											</template>
										</Column>
										<span v-for="(column, index) in resultStore.tableHeaders"
											:key="`column-${index}`">
											<Column v-if="column.value === 'bezname'"
												:field="`properties.${column.value}`"
												:filter-field="column.value === 'bezname' ? undefined : `properties.${column.value}`"
												:header="column.text" :key="`bezname-${index}`">
												<template #filter="{ filterModel, filterCallback }">
													<span v-if="column.value === 'bezname'">
														<InputText size="small" v-model="filterModel.value" type="text"
															@input="filterCallback()" class="p-column-filter"
															placeholder="Search by bezirke" />
													</span>
												</template>
											</Column>
											<Column v-else :field="`properties.${column.value}`" :header="column.text"
												:key="`other-${index}`" :sortable="column.value === 'area_fme'">
											</Column>
										</span>
									</span>
								</DataTable>
							</div>
							<div class="w-full flex justify-around" v-else>
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
				<div class="w-full 2xl:grid 2xl:grid-cols-2"
					v-if="resultStore.isFilterApplied && resultStore.appliedFilterResult && resultStore.appliedFilterResult?.features.length > 0">
					<div
						class="w-full 2xl:flex 2xl:justify-between 2xl:grid-cols-none lg:grid lg:grid-cols-4 lg:gap-2 2xl:gap-0 p-1 ">
						<div class="w-full lg:col-span-2">
							<InputText class="h-10" type="text" v-model="layerName"
								:placeholder="$t('ligfinder.table.layerName')"></InputText>
						</div>
						<div class="w-full flex lg:col-span-2">
							<Button @click="addAsLayer" :disabled="layerName.length === 0" class="lg:w-full 2xl:w-auto"
								size="small">{{ $t('ligfinder.table.add') }}</Button>
						</div>
					</div>
					<div
						class="w-full 2xl:flex 2xl:justify-between 2xl:grid-cols-none lg:grid lg:grid-cols-4 lg:gap-2 2xl:gap-0 p-1 ">
						<div class="w-full lg:col-span-2">
							<InputText class="h-10" type="text" v-model="fileName"
								:placeholder="$t('ligfinder.table.fileName')"></InputText>
						</div>
						<div class="w-full flex lg:col-span-2">
							<Button @click="downloadAsGeojson" :disabled="fileName.length === 0"
								class="lg:w-full 2xl:w-auto"
								size="small">{{ $t('ligfinder.table.downloadGeoJSON') }}</Button>
						</div>

					</div>
				</div>
			</template>
		</Card>
	</SidebarLayout>
</template>

<script setup lang="ts">
import Dialog from "primevue/dialog"
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
import { FilterMatchMode } from "@primevue/core/api";
import { formatNumber } from "../../core/helpers/functions";
import { useI18n } from "vue-i18n"
import bbox from "@turf/bbox";
import { type Feature } from "geojson";

const { t } = useI18n()
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
    downloadAnchorNode.setAttribute("download", sanitizedFileName.length > 0 ? `${sanitizedFileName.trim()}.geojson` : "geojson-data.geojson");
    document.body.appendChild(downloadAnchorNode); // required for Firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
function focusOnSelectedParcel(parcel: any): void {
    mapStore.map.fitBounds(bbox(parcel as Feature), {
        padding: {
            top: 20,
            bottom: 200,
            left: 20,
            right: 500
        }
    });
    const originalStyle = mapStore.map.getPaintProperty(import.meta.env.VITE_PARCEL_DATASET_LAYERNAME, "fill-color");
    mapStore.map.setPaintProperty(import.meta.env.VITE_PARCEL_DATASET_LAYERNAME, "fill-color", [
        "case",
        ["==", ["get", "gid"], (parcel as Feature).properties!.gid],
        "#fefefe", // Highlight color
        originalStyle // Original color
    ]);
    // Reset the style after 10 seconds
    setTimeout(() => {
        mapStore.map.setPaintProperty(import.meta.env.VITE_PARCEL_DATASET_LAYERNAME, "fill-color", originalStyle);
    }, 10000);
}
function getHeaderText(attributeName: string): string {
    const key = `ligfinder.table.headers.${attributeName}`
    if (key !== t(key)) {
        return t(key)
    } else {
        return key
    }
}
function isHidden(attributeName: string): boolean {
    const key = `ligfinder.table.headers.${attributeName}`
    if (key !== t(key)) {
        return false
    } else {
        return true
    }
}
const filters = ref({
    "properties.flurst_hh": { value: null, matchMode: FilterMatchMode.CONTAINS },
    "properties.bezname": { value: null, matchMode: FilterMatchMode.CONTAINS },
    "properties.stadtteil": { value: null, matchMode: FilterMatchMode.CONTAINS },
    "properties.area_fme": { value: null, matchMode: FilterMatchMode.LESS_THAN },
    "properties.geb_grf_a": { value: null, matchMode: FilterMatchMode.LESS_THAN },
    "properties.fl_unbeb_a": { value: null, matchMode: FilterMatchMode.LESS_THAN },
    "properties.alkis_grz": { value: null, matchMode: FilterMatchMode.LESS_THAN },
    "properties.bplan_grz": { value: null, matchMode: FilterMatchMode.LESS_THAN }
});

const isFullScreen = ref<boolean>(false)
</script>

<style scoped>
td>button{
	padding: 0;
}
</style>
