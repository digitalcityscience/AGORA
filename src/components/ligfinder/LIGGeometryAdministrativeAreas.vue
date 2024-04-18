<template>
    <Card class="w-full">
        <template #title>Administrative Areas</template>
        <template #content>
            <div class="w-full py-1"  v-if="geometry.selectedAdministrativeFeaturesList.length>0">
                <ChipWrapper v-for="(feature) in geometry.selectedAdministrativeFeaturesList" :key="`${feature.name}-${feature.data.properties!.name}`" :label="`${feature.name}-${feature.data.properties!.name}`" @remove="removeFromSelectedGeometries(feature)" removable severity="success"/>
                </div>
            <div class="w-full flex flex-col">
                <div class="w-full py-1">
                    <Dropdown class="min-w-32" v-model="activeAdministrativeArea"
                        :options="geometry.administrativeBoundariesList" option-label="name"
                        :option-disabled="(option) => { return option.name === activeAdministrativeArea?.name }"
                        placeholder="Please select" checkmark show-clear>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex align-items-center">
                                <div>{{ slotProps.value.name }}</div>
                            </div>
                            <span v-else>
                                {{ slotProps.placeholder }}
                            </span>
                        </template>
                    </Dropdown>
                </div>
                <div class="w-full py-1" v-if="activeAdministrativeArea">
                    <DataTable v-model:filters="featureListFilters" :value="activeAdministrativeAreaFeaturesList"
                        scrollable scrollHeight="400px" size="small"
                        :pt="{ thead: { class: ['hidden'] } }">
                        <template #header>
                            <IconField iconPosition="left">
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="featureListFilters['global'].value" placeholder="Search area" />
                            </IconField>
                        </template>
                        <Column field="data.properties.name"></Column>
                        <Column header="Actions">
                            <template #body="slotProps">
                                <div class="actions text-right">
                                    <Button icon="pi pi-search-plus" @click="addToSelectedGeometries(slotProps.data)"
                                        severity="primary" text rounded aria-label="Add Geometry"></Button>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

        </template>
    </Card>
</template>

<script setup lang="ts">
import Card from "primevue/card"
import Dropdown from "primevue/dropdown"
import { onMounted, ref, computed, type Ref } from "vue";
import { type AdministrativeBoundariesListItem, useGeometryStore, type AdministrativeFeature } from "../../store/geometry";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import IconField from "primevue/iconfield"
import InputIcon from "primevue/inputicon"
import ChipWrapper from "../ChipWrapper.vue";
import { FilterMatchMode } from "primevue/api";

const geometry = useGeometryStore()
onMounted(() => {
    if (geometry.getAdministrativeBoundariesList === undefined || geometry.getAdministrativeBoundariesList.length === 0) {
        geometry.getAdministrativeBoundariesList().then((list) => {
            if (list.data.length > 0 && geometry.administrativeDataList?.length !== list.data.length) {
                geometry.administrativeBoundariesList = [...list.data]
                list.data.forEach(item => {
                    console.log(item);
                    geometry.getAdministrativeBoundaryData(item.id).then((boundaryData) => {
                        geometry.administrativeDataList.push({ ...item, data: boundaryData })
                    }).catch((error) => { console.error(error) })
                })
            }
        }).catch((error) => { console.error(error) })
    }
})
const activeAdministrativeAreaFeaturesList: Ref<AdministrativeFeature[]> = computed(() => {
    if (activeAdministrativeArea.value == null) {
        return []
    } else {
        const activeDataFeaturesList = geometry.administrativeDataList.filter((item) => { return item.table_name === activeAdministrativeArea.value?.table_name })
        if (activeDataFeaturesList.length > 0) {
            const options: AdministrativeFeature[] = []
            activeDataFeaturesList[0].data.features.forEach(feature => options.push({ data:{ ...feature }, id:activeAdministrativeArea.value!.id, name:activeAdministrativeArea.value!.name, table_name:activeAdministrativeArea.value!.table_name }))
            options.sort((a, b) => {
                const nameA = a.data.properties!.name.toLowerCase();
                const nameB = b.data.properties!.name.toLowerCase();
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;
            });
            console.log(options)
            return options
        } else {
            return []
        }
    }
})
const featureListFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})
const activeAdministrativeArea = ref<AdministrativeBoundariesListItem | null>(null)

function addToSelectedGeometries(data: AdministrativeFeature): void{
    try {
        geometry.addToselectedAdministrativeFeaturesList(data)
    } catch (error) {
        console.error(error)
    }
}
function removeFromSelectedGeometries(data: AdministrativeFeature): void {
    try {
        geometry.removeFromSelectedAdministrativeFeaturesList(data)
    } catch (error){
        console.error(error)
    }
}
</script>

<style scoped></style>