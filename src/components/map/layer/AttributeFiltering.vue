<template>
    <UCard
        class="attribute-filtering w-full"
        variant="subtle"
        :ui="{ header: 'p-3 pb-2', body: 'p-3 pt-1' }"
    >
        <template #header>
            <div class="space-y-1">
                <div class="font-semibold text-highlighted">{{ $t("mapLayers.attributeFiltering.title") }}</div>
                <div class="text-sm text-muted">{{ $t("mapLayers.attributeFiltering.subtitle") }}</div>
            </div>
        </template>
        <div v-if="currentFilters.length > 0" class="current-filters">
            <UTable
                :data="currentFilters"
                :columns="currentFilterColumns"
                class="w-full"
                :ui="{ th: 'hidden', td: 'px-2 py-2 whitespace-normal' }"
            >
                <template #filter-cell="{ row }">
                    <span>
                        {{ row.original.attribute.name }}
                        {{ filterStore.filterNames[row.original.operand as IntegerFilters | StringFilters] }}
                        {{ row.original.value }}
                    </span>
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex w-full justify-end">
                        <UButton
                            icon="i-lucide-x"
                            color="error"
                            variant="ghost"
                            size="xs"
                            :aria-label="$t('mapLayers.controls.removeFilter')"
                            @click="deleteAttributeFilter(row.original)"
                        />
                    </div>
                </template>
            </UTable>
        </div>
        <div v-else class="w-full py-1">
            <UAlert
                class="w-full"
                color="info"
                variant="soft"
                :description="$t('mapLayers.attributeFiltering.noFilter')"
            />
        </div>
        <div v-if="currentFilters.length" class="flex w-full flex-wrap items-center justify-between gap-2 py-2">
            <span class="text-sm text-muted">
                {{ relationType === 'AND' ? $t("mapLayers.attributeFiltering.matchAll") : $t("mapLayers.attributeFiltering.matchAny") }}
            </span>
            <URadioGroup
                v-model="relationType"
                :items="relationOptions"
                variant="card"
                orientation="horizontal"
                size="xs"
                @update:model-value="applyAttributeFilter"
            />
        </div>
        <div class="flex w-full flex-col">
            <p class="py-1 text-sm italic text-muted">{{ $t("mapLayers.attributeFiltering.addNew") }}</p>
            <div class="flex w-full">
                <USelect
                    v-model="selectedAttributeName"
                    class="min-w-0 flex-1"
                    :items="filteredAttributeOptions"
                    :placeholder="$t('mapLayers.attributeFiltering.selectAttribute')"
                    @update:model-value="clearOperand"
                />
                <UButton
                    v-if="selectedAttributeName !== undefined"
                    class="ml-1"
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    :aria-label="$t('mapLayers.attributeFiltering.clearAttribute')"
                    @click="clearSelectedAttribute"
                />
            </div>
            <div v-if="selectedAttribute" class="flex w-full pt-2">
                <USelect
                    v-model="selectedOperand"
                    class="min-w-0 flex-1"
                    :items="operandOptions"
                    :placeholder="$t('mapLayers.attributeFiltering.selectOperand')"
                />
                <UButton
                    v-if="selectedOperand !== undefined"
                    class="ml-1"
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    :aria-label="$t('mapLayers.attributeFiltering.clearOperand')"
                    @click="selectedOperand = undefined"
                />
            </div>
            <div v-if="selectedOperand" class="w-full pt-2">
                <UInput
                    v-model="filterValue"
                    class="w-full"
                    :type="selectedAttribute?.binding === 'java.lang.String' ? 'text' : 'number'"
                />
            </div>
            <div class="flex w-full justify-end pt-2">
                <UButton
                    size="sm"
                    :disabled="!(selectedAttribute && selectedOperand && filterValue)"
                    :label="$t('mapLayers.attributeFiltering.apply')"
                    @click="applyAttributeFilter"
                />
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { useToast } from "../../../core/helpers/toast"
import { computed, ref } from "vue";
import { type GeoServerFeatureTypeAttribute } from "../../../store/api/geoserver";
import { type IntegerFilters, type StringFilters, useFilterStore, type RelationTypes, type AttributeFilterItem } from "../../../store/maplibre/filter";
import { type LayerObjectWithAttributes, useMapStore } from "../../../store/maplibre/map";
import { isNullOrEmpty } from "../../../core/helpers/functions"

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
const currentFilterColumns: TableColumn<AppliedFilter>[] = [
    { id: "filter", header: "" },
    { id: "actions", header: "" },
]
const selectedAttributeName = computed({
    get: () => selectedAttribute.value?.name,
    set: (name: string | undefined) => {
        selectedAttribute.value = filteredAttributes.value.find((attribute) => attribute.name === name)
    },
})
const filteredAttributeOptions = computed(() => filteredAttributes.value.map((attribute) => ({
    label: attribute.name,
    value: attribute.name,
})))
const relationOptions = [
    { label: "AND", value: "AND" },
    { label: "OR", value: "OR" },
]
const operandOptions = computed(() => {
    const filters = selectedAttribute.value?.binding === "java.lang.String"
        ? filterStore.stringFilters
        : filterStore.integerFilters
    return filters.map((filter) => ({
        label: filterStore.filterNames[filter as IntegerFilters | StringFilters],
        value: filter,
    }))
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
function clearSelectedAttribute(): void {
    selectedAttribute.value = undefined
    clearOperand()
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

<style scoped></style>
