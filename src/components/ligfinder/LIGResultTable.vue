<template>
	<BaseSlideoverSidebarComponent
		:id="sidebarID"
		side="right"
		:collapsed="true"
		width-class="w-[min(50rem,44vw)]"
	>
		<template #header>
			<span>{{ $t('ligfinder.table.title') }}</span>
		</template>
		<Card>
			<template #content>
				<Dialog v-model:visible="isFullScreen" modal closable close-on-escape
					:style="{ width: 'calc(100vw - 200px)' }">
					<div class="min-w-0 w-full">
						<div v-if="resultStore.isFilterApplied">
							<div v-if="resultStore.appliedFilterResult !== undefined">
								<div v-if="filterResultTableItems.length > 0" class="w-full overflow-x-auto">
									<DataTable :value="filterResultTableItems" paginator :rows="10"
										:rowsPerPageOptions="[10, 20, 50]" class="w-full" size="small"
										table-class="w-full"
										paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink NextPageLink LastPageLink"
										v-model:filters="filters" filter-display="menu">
										<template #header>
											<div class="w-full pb-2">
												{{ $t('ligfinder.table.count', [`${filterResultTableItems.length}`]) }}
											</div>
											<h2 class="w-full flex flex-row font-bold">
												{{$t('ligfinder.table.summary.title')}}
											</h2>
											<div v-if="resultStore.lastAppliedFilter != undefined" class="w-full flex flex-row flex-wrap gap-2 first:ml-0 and sm:ml-0">
												<span v-for="(criteria,index) in resultStore.lastAppliedFilter.criteria" :key="index" class="border bg-primary-600 px-2 py-1 rounded-lg text-white text-sm font-light italic">
													{{ criteria.status == "included" ? $t('ligfinder.table.summary.included',[criteria.data.label]) : $t('ligfinder.table.summary.excluded',[criteria.data.label]) }}
												</span>
												<span v-for="(metric,index) in resultStore.lastAppliedFilter.metric" :key="index" class="border bg-primary-600 px-2 py-1 rounded-lg text-white text-sm font-light italic">
													{{ $t(`ligfinder.filter.metrics.labels.${metric.column}`) }} {{$t(`helpers.filterNames.${metric.operation}`) }} {{ metric.value }}
												</span>
												<span v-if="resultStore.lastAppliedFilter.geometry.length > 0" class="border bg-primary-600 px-2 py-1 rounded-lg text-white text-sm font-light italic">
													{{ $t('ligfinder.table.summary.geometry') }}
												</span>
											</div>
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
										<span v-for="(column, index) in attributeColumns"
												:key="`column-${index}`">
												<Column :field="`properties.${column.name}`"
													:header="getHeaderText(column.name)"
													:key="column.name === 'bezname' ? `bezname-${index}` : `other-${index}`"
													:sortable="column.name === 'Shape_Area'"
													:hidden="isHidden(column.name)"
													:dataType="column.binding !== 'java.lang.String' ? 'numeric' : undefined"
													resizableColumns columnResizeMode="fit">
													<template #filter="{ filterModel, filterCallback }">
														<span>
														<InputText size="small" v-model="filterModel.value"
															type="text" @input="filterCallback()"
															class="p-column-filter"
															:placeholder="$t('ligfinder.table.searchByColumn', { column: getHeaderText(column.name) })" />
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
											<span v-for="(column, index) in tableHeaderColumns"
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
															:placeholder="$t('ligfinder.table.searchByColumn', { column: column.text })" />
														</span>
													</template>
												</Column>
												<Column v-else :field="`properties.${column.value}`"
													:header="column.text" :key="`other-${index}`"
													:sortable="column.value === 'Shape_Area'">
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
				<div class="min-w-0 w-full">
					<div v-if="resultStore.isFilterApplied">
						<div v-if="resultStore.appliedFilterResult !== undefined">
							<div v-if="filterResultTableItems.length > 0" class="w-full overflow-x-auto">
								<DataTable :value="filterResultTableItems" paginator :rows="10" stripedRows
									:rowsPerPageOptions="[10, 20, 50]" class="w-full" size="small" table-class="w-full"
									paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink NextPageLink LastPageLink"
									v-model:filters="filters" filter-display="menu">
									<template #header>
										<div class="flex justify-between pt-1">
											<span class="self-center">
												{{ $t('ligfinder.table.count', [`${filterResultTableItems.length}`]) }}
											</span>
											<div class="flex">
												<div v-if="resultStore.appliedFilterResult.features.length > 0" class="px-1">
													<Button text raised @click="mapStore.map.fitBounds(bbox(resultStore.appliedFilterResult))">
														{{ $t('ligfinder.table.zoomToResults') }}
													</Button>
												</div>
												<div class="px-1">
													<Button text raised @click="isFullScreen = true">
														<template #icon>
															<i class="material-icons">open_in_full</i>
														</template>
													</Button>
												</div>
											</div>
										</div>
										<h2 class="w-full flex flex-row font-bold">
											{{$t('ligfinder.table.summary.title')}}
										</h2>
										<div v-if="resultStore.lastAppliedFilter != undefined" class="w-full flex flex-row gap-2 first:ml-0 and sm:ml-0 flex-wrap">
											<span v-for="(criteria,index) in resultStore.lastAppliedFilter.criteria" :key="index" class="border bg-primary-600 px-2 py-1 rounded-lg text-white text-sm font-light italic">
												{{ criteria.data.label }} is {{ criteria.status }}
											</span>
											<span v-for="(metric,index) in resultStore.lastAppliedFilter.metric" :key="index" class="border bg-primary-600 px-2 py-1 rounded-lg text-white text-sm font-light italic">
												{{ $t(`ligfinder.filter.metrics.labels.${metric.column}`) }} {{$t(`helpers.filterNames.${metric.operation}`) }} {{ metric.value }}
											</span>
											<span v-if="resultStore.lastAppliedFilter.geometry.length > 0" class="border bg-primary-600 px-2 py-1 rounded-lg text-white text-sm font-light italic">
												{{ t('ligfinder.table.summary.geometry') }}
											</span>
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
										<span v-for="(column, index) in attributeColumns"
											:key="`column-${index}`">
											<Column :field="`properties.${column.name}`"
												:header="getHeaderText(column.name)"
												:key="column.name === 'bezname' ? `bezname-${index}` : `other-${index}`"
												:sortable="column.name === 'Shape_Area'" :hidden="isHidden(column.name)"
												:dataType="column.binding !== 'java.lang.String' ? 'numeric' : undefined"
												resizableColumns columnResizeMode="fit">
												<template #filter="{ filterModel, filterCallback }">
													<span>
														<InputText size="small" v-model="filterModel.value" type="text"
															@input="filterCallback()" class="p-column-filter"
															:placeholder="$t('ligfinder.table.searchByColumn', { column: getHeaderText(column.name) })" />
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
										<span v-for="(column, index) in tableHeaderColumns"
											:key="`column-${index}`">
											<Column v-if="column.value === 'bezname'"
												:field="`properties.${column.value}`"
												:filter-field="column.value === 'bezname' ? undefined : `properties.${column.value}`"
												:header="column.text" :key="`bezname-${index}`">
												<template #filter="{ filterModel, filterCallback }">
													<span v-if="column.value === 'bezname'">
														<InputText size="small" v-model="filterModel.value" type="text"
															@input="filterCallback()" class="p-column-filter"
															:placeholder="$t('ligfinder.table.searchByColumn', { column: column.text })" />
													</span>
												</template>
											</Column>
											<Column v-else :field="`properties.${column.value}`" :header="column.text"
												:key="`other-${index}`" :sortable="column.value === 'Shape_Area'">
											</Column>
										</span>
									</span>
								</DataTable>
							</div>
							<div class="w-full flex justify-around" v-else>
								<InlineMessage severity="info">{{ $t('ligfinder.table.noResults') }}</InlineMessage>
							</div>
						</div>
						<div class="w-full flex justify-around" v-else>
							<InlineMessage severity="info">{{ $t('ligfinder.table.noFilter') }}</InlineMessage>
						</div>
					</div>
					<div class="w-full flex justify-around" v-else>
						<InlineMessage severity="info">{{ $t('ligfinder.table.noFilter') }}</InlineMessage>
					</div>
				</div>
			</template>
			<template #footer>
				<div class="result-footer-grid w-full"
					v-if="resultStore.isFilterApplied && resultStore.appliedFilterResult && resultStore.appliedFilterResult?.features.length > 0">
					<div class="flex min-w-0 flex-wrap gap-2 p-1">
						<div class="min-w-48 flex-1">
							<InputText class="h-full w-full" type="text" v-model="layerName"
								:placeholder="$t('ligfinder.table.layerName')"></InputText>
						</div>
						<div class="flex min-w-0 flex-1">
							<Button @click="addAsLayer" :disabled="layerName.length === 0" class="w-full"
								size="small">{{ $t('ligfinder.table.add') }}</Button>
						</div>
					</div>
					<div class="flex min-w-0 flex-wrap gap-2 p-1">
						<div class="min-w-64 flex-1">
							<InputGroup class="w-full">
								<InputText class="h-full min-w-0 flex-1 rounded-l-lg" type="text" v-model="fileName"
									:placeholder="$t('ligfinder.table.fileName')"></InputText>
								<InputGroupAddon>
									<ToggleButton unstyled v-model="format" :offLabel="$t('ligfinder.table.downloadGeoJSON')" :onLabel="$t('ligfinder.table.downloadCSV')" class="rounded-l-none"/>
								</InputGroupAddon>
							</InputGroup>
						</div>
						<div class="flex min-w-0 flex-1">
							<Button :disabled="fileName.length === 0" class="w-full" @click="format ? downloadCSVFromGeoJSON(resultStore.appliedFilterResult,fileName):downloadAsGeojson()">{{$t('ligfinder.table.download')}}</Button>
						</div>

					</div>
				</div>
			</template>
		</Card>
	</BaseSlideoverSidebarComponent>
</template>

<script setup lang="ts">
import Dialog from "primevue/dialog"
import Card from "primevue/card";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InlineMessage from "primevue/inlinemessage";
import Button from "primevue/button";
import ToggleButton from "primevue/togglebutton";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";
import InputText from "primevue/inputtext";
import BaseSlideoverSidebarComponent from "../base/BaseSlideoverSidebarComponent.vue";
import { useMapStore } from "../../store/maplibre/map"
import { useResultStore } from "../../store/ligfinder/result"
import { computed, ref } from "vue";
import { FilterMatchMode } from "@primevue/core/api";
import { formatNumber, downloadCSVFromGeoJSON } from "../../core/helpers/functions";
import { useI18n } from "vue-i18n"
import bbox from "@turf/bbox";
import { type Feature } from "geojson";

const { t } = useI18n()
const mapStore = useMapStore()
const resultStore = useResultStore()
const sidebarID = "ligfinder-result-table"
const layerName = ref<string>("")
const fileName = ref<string>("")
const filterResultTableItems = computed(() => {
    if (resultStore.appliedFilterResult !== undefined) {
        return resultStore.appliedFilterResult.features
    } else {
        return []
    }
})
const attributeColumns = computed(() => {
    const source = resultStore.attributeList ?? []
    const columns = [...source]
    const flurstIndex = columns.findIndex((column: any) => column.name === "flurst_nr")
    if (flurstIndex > 0) {
        const [flurstColumn] = columns.splice(flurstIndex, 1)
        columns.unshift(flurstColumn)
    }
    return columns
})
const tableHeaderColumns = computed(() => {
    const source = resultStore.tableHeaders ?? []
    const columns = [...source]
    const flurstIndex = columns.findIndex((column: any) => (column.value ?? column.name) === "flurst_nr")
    if (flurstIndex > 0) {
        const [flurstColumn] = columns.splice(flurstIndex, 1)
        columns.unshift(flurstColumn)
    }
    return columns
})
const format = ref<boolean>(false)
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
const highlightTimeout = ref<number | undefined>(undefined)
const currentHighlightId = ref<number>(0)
function focusOnSelectedParcel(parcel: any): void {
    mapStore.map.fitBounds(bbox(parcel as Feature), {
        padding: {
            top: 20,
            bottom: 200,
            left: 20,
            right: 500
        }
    });
    const tempSourceId = "highlight-source";
    const tempLayerId = "highlight-outline";
    const thisHighlightId = ++currentHighlightId.value

    // Clean up any previous temp highlight
    if (mapStore.map.getLayer(tempLayerId) !== undefined) {
        mapStore.map.removeLayer(tempLayerId);
    }
    if (mapStore.map.getSource(tempSourceId) !== undefined) {
        mapStore.map.removeSource(tempSourceId);
    }
    // Add new source for the selected feature
    mapStore.map.addSource(tempSourceId, {
        type: "geojson",
        data: parcel
    });
    // Add outline layer
    mapStore.map.addLayer({
        id: tempLayerId,
        type: "line",
        source: tempSourceId,
        paint: {
            "line-color": "#000000",
            "line-width": 4,
            "line-opacity": 1
        }
    });
    // Delay removal ONLY if it's still the latest highlight
    if (highlightTimeout.value != null) clearTimeout(highlightTimeout.value)

    highlightTimeout.value = window.setTimeout(() => {
        if (currentHighlightId.value === thisHighlightId) {
            if (mapStore.map.getLayer(tempLayerId) !== undefined) {
                mapStore.map.removeLayer(tempLayerId)
            }
            if (mapStore.map.getSource(tempSourceId) !== undefined) {
                mapStore.map.removeSource(tempSourceId)
            }
        }
    }, 15000)
}
function getHeaderText(attributeName: string): string {
    const key = `ligfinder.table.headers.${attributeName}`
    const translated = t(key)
    if (key !== translated) {
        return translated
    }
    return attributeName
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
    "properties.flurst_nr": { value: null, matchMode: FilterMatchMode.CONTAINS },
    "properties.xplanung_id": { value: null, matchMode: FilterMatchMode.CONTAINS },
    "properties.Shape_Area": { value: null, matchMode: FilterMatchMode.LESS_THAN },
    "properties.grz_xplanung": { value: null, matchMode: FilterMatchMode.LESS_THAN },
    "properties.grz_potential": { value: null, matchMode: FilterMatchMode.LESS_THAN },
    "properties.grz_potential_area": { value: null, matchMode: FilterMatchMode.LESS_THAN },
    "properties.grz_alkis": { value: null, matchMode: FilterMatchMode.LESS_THAN },
});

const isFullScreen = ref<boolean>(false)
</script>

<style scoped>
.result-footer-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
	gap: 0.5rem;
}
td>button{
	padding: 0;
}
</style>
