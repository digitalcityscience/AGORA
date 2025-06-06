<template>
    <Card class="attribute-filtering w-full">
        <template #title>{{ $t("mapLayers.attributeFiltering.title") }}</template>
        <template #subtitle>{{ $t("mapLayers.attributeFiltering.subtitle") }}</template>
        <template #content>
            <div class="current-filters"
                v-if="filterStore.appliedFiltersList.find((listItem) => { return listItem.layerName === props.layer.id && ((listItem.attributeFilters !== undefined && listItem.attributeFilters?.length > 0) || listItem.geometryFilters !== undefined) })">
                <DataTable :value="currentFilters" class="w-full" size="small" table-class="w-full">
                    <Column header="">
                        <template #body="filter">
                            <span>{{ filter.data.attribute.name }} {{ filterStore.filterNames[filter.data.operand as
                                IntegerFilters | StringFilters] }} {{ filter.data.value }}</span>
                        </template>
                    </Column>
                    <Column header="">
                        <template #body="filter">
                            <div class="w-full flex flex-row-reverse">
                                <Button @click="deleteAttributeFilter(filter.data)" severity="danger" text rounded>
                                    <template #icon>
                                        <i class="pi pi-times"></i>
                                    </template>
                                </Button>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
            <div class="w-full no-current-filter py-2" v-else>
                <InlineMessage class="w-full" severity="info">{{ $t("mapLayers.attributeFiltering.noFilter") }}
                </InlineMessage>
            </div>
            <div class="filter-control">
                <div v-if="currentFilters.length"
                    class="relation-control w-full flex flex-row ml-auto py-2 justify-between">
                    <span class="self-center" v-if="relationType === 'AND'">{{ $t("mapLayers.attributeFiltering.matchAll")
                        }}</span>
                    <span class="self-center" v-else>{{ $t("mapLayers.attributeFiltering.matchAny") }}</span>
                    <SelectButton v-model="relationType" :options="relationList" :allow-empty="false"
                        @change="applyAttributeFilter"></SelectButton>
                </div>
            </div>
            <div class="new-filter flex flex-col w-full">
                <div class="w-full font-thin italic text-sm py-1 text-surface-600/50 dark:text-surface-0/50">
                    <p>{{ $t("mapLayers.attributeFiltering.addNew") }}</p>
                </div>
                <div class="attribute w-full">
                    <Dropdown class="min-w-32 w-full h-10" v-model="selectedAttribute" :options="filteredAttributes"
                        option-label="name" filter show-clear
                        :placeholder="$t('mapLayers.attributeFiltering.selectAttribute')"
                        :virtual-scroller-options="{ itemSize: 30 }" @change="clearOperand">
                    </Dropdown>
                </div>
                <div class="operand w-full pt-2">
                    <Dropdown class="min-w-32 w-full h-10"
                        v-if="selectedAttribute && selectedAttribute.binding == 'java.lang.String'"
                        v-model="selectedOperand" :options="filterStore.stringFilters" show-clear
                        :placeholder="$t('mapLayers.attributeFiltering.selectOperand')"></Dropdown>
                    <Dropdown class="min-w-32 w-full h-10"
                        v-else-if="selectedAttribute && (selectedAttribute.binding == 'java.lang.Integer' || selectedAttribute.binding == 'java.lang.Long' || selectedAttribute.binding == 'java.lang.Double')"
                        v-model="selectedOperand" :options="filterStore.integerFilters" show-clear
                        :placeholder="$t('mapLayers.attributeFiltering.selectOperand')"></Dropdown>
                </div>
                <div class="value w-full pt-2" v-if="selectedOperand">
                    <InputText class="min-w-32 w-full h-10"
                        v-if="selectedAttribute && selectedAttribute.binding == 'java.lang.String'" type="text"
                        v-model="filterValue"></InputText>
                    <InputText class="min-w-32 w-full h-10" v-else type="number" v-model="filterValue"></InputText>
                </div>
                <div class="applier w-full flex flex-row-reverse pt-2">
                    <Button size="small" @click=applyAttributeFilter
                        :disabled="!(selectedAttribute && selectedOperand && filterValue)">{{
                            $t("mapLayers.attributeFiltering.apply") }}</Button>
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
import Dropdown from "primevue/select";
import Button from "primevue/button";
import SelectButton from "primevue/selectbutton";
import Card from "primevue/card"
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InlineMessage from "primevue/inlinemessage";
import InputText from "primevue/inputtext";
import { useToast } from "primevue/usetoast"
import { computed, ref } from "vue";
import { type GeoServerFeatureTypeAttribute } from "../store/geoserver";
import { type IntegerFilters, type StringFilters, useFilterStore, type RelationTypes, type AttributeFilterItem } from "../store/filter";
import { type LayerObjectWithAttributes, useMapStore } from "../store/map";
import { isNullOrEmpty } from "../core/helpers/functions"

interface Props {
    layer: LayerObjectWithAttributes;
}
interface AppliedFilter {
    attribute: GeoServerFeatureTypeAttribute;
    operand: IntegerFilters | StringFilters;
    value: string
}
const props = defineProps<Props>()
const filterStore = useFilterStore()
const mapStore = useMapStore()
const toast = useToast();

const currentFilters = computed(() => {
    if (filterStore.appliedFiltersList.length > 0) {
        const layerFilters = filterStore.appliedFiltersList.find((listItem) => { return listItem.layerName === props.layer.id })
        if (layerFilters?.attributeFilters !== undefined) {
            return layerFilters.attributeFilters
        } else {
            return [] as AppliedFilter[]
        }
    } else {
        return [] as AppliedFilter[]
    }
})
const relationList = ["AND", "OR"]
const relationType = ref<RelationTypes>("AND")
const selectedAttribute = ref<GeoServerFeatureTypeAttribute>()
const selectedOperand = ref<IntegerFilters | StringFilters>()
const filterValue = ref<any>("")
const filteredAttributes = computed<GeoServerFeatureTypeAttribute[]>(() => {
    const { sourceType, details, filterLayerData } = props.layer;
    // Guarantee `features` is always an array
    const features = filterLayerData?.features ?? [];

    // 1) GeoServer: explicit null check for details.featureType
    if (sourceType === "geoserver" && details?.featureType != null) {
        return details.featureType.attributes.attribute.filter(attr =>
            filterStore.allowedBindings.includes(attr.binding)
        );
    }

    // 2) GeoJSON: only if we have at least one feature
    if (sourceType === "geojson" && features.length > 0) {
        // collect all property names
        const nameSet = features.reduce((names, feature) => {
            if (feature.properties != null) {
                Object.keys(feature.properties).forEach(n => names.add(n));
            }
            return names;
        }, new Set<string>());

        // build a properly typed array
        const attributes: GeoServerFeatureTypeAttribute[] = Array.from(nameSet).map(name => {
            // gather non‐null values
            const values = features
                .map(f => (f.properties != null ? f.properties[name] : undefined))
                .filter((v): v is string | number => v != null);

            // infer binding, default to String
            let binding = "java.lang.String";
            const coerced = values.map(v => {
                if (typeof v === "string" && /^\d+(\.\d+)?$/.test(v)) {
                    return Number(v);
                }
                return v;
            });
            if (coerced.every(v => typeof v === "number")) {
                binding = coerced.every(v => Number.isInteger(v))
                    ? "java.lang.Integer"
                    : "java.lang.Double";
            } else {
                binding = "java.lang.String";
            }
            return { name, binding }; // no `as` cast needed
        });

        return attributes.filter(attr =>
            filterStore.allowedBindings.includes(attr.binding)
        );
    }

    return [];
})
/**
 * Create current filters list then push this list to apply attribute filter function in filter store. wait for response
 * and based on response handle
 */
async function applyAttributeFilter(): Promise<void> {
    if (!isNullOrEmpty(selectedAttribute.value) && !isNullOrEmpty(selectedOperand.value) && !isNullOrEmpty(filterValue.value)) {
        const filter: AttributeFilterItem = {
            attribute: selectedAttribute.value!,
            operand: selectedOperand.value!,
            value: filterValue.value.toString()
        }
        await filterStore.addAttributeFilter(props.layer.id, filter).then((response) => {
            if (response.attributeFilters !== undefined || response.geometryFilters !== undefined) {
                filterStore.populateLayerFilter(response, relationType.value).then((expression) => {
                    if (expression.length > 1) {
                        mapStore.map.setFilter(props.layer.id, expression)
                    } else {
                        mapStore.map.setFilter(props.layer.id, null)
                    }
                }).catch((error) => {
                    mapStore.map.setFilter(props.layer.id, null)
                    toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
                })
            } else {
                mapStore.map.setFilter(props.layer.id, null)
            }
        }).catch((error) => {
            toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
        })
        cancelNewFilter()
    } else {
        const appliedFilters = filterStore.appliedFiltersList.find((applied) => {
            return applied.layerName === props.layer.id
        })
        if (appliedFilters !== undefined) {
            await filterStore.populateLayerFilter(appliedFilters, relationType.value).then((expression) => {
                if (expression.length > 1) {
                    mapStore.map.setFilter(props.layer.id, expression)
                } else {
                    mapStore.map.setFilter(props.layer.id, null)
                }
            }).catch((error) => {
                mapStore.map.setFilter(props.layer.id, null)
                toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
            })
        } else {
            mapStore.map.setFilter(props.layer.id, null)
        }
        cancelNewFilter()
    }
}
function cancelNewFilter(): void {
    selectedAttribute.value = undefined
    selectedOperand.value = undefined
    filterValue.value = ""
}
function clearOperand(): void {
    selectedOperand.value = undefined
    filterValue.value = undefined
}
async function deleteAttributeFilter(targetFilter: AppliedFilter): Promise<void> {
    await filterStore.removeAttributeFilter(props.layer.id, targetFilter).then((response) => {
        filterStore.populateLayerFilter(response, relationType.value).then((expression) => {
            if (expression.length > 1) {
                mapStore.map.setFilter(props.layer.id, expression)
            } else {
                mapStore.map.setFilter(props.layer.id, null)
            }
        }).catch((error) => {
            mapStore.map.setFilter(props.layer.id, null)
            toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
        })
    }).catch((error) => {
        toast.add({ severity: "error", summary: "Error", detail: error, life: 3000 });
    })
}
</script>

<style scoped>
.current-filters:deep(th) {
    display: none;
}
</style>
