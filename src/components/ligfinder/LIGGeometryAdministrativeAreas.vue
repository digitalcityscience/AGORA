<template>
    <Card class="w-full">
        <template #title>
            <div class="flex justify-start">
                <div class="self-center">
                    {{ $t('ligfinder.filter.geometry.administrative.title')}}
                </div>
            </div>
        </template>
        <template #content>
            <div class="w-full py-1"  v-if="geometry.selectedAdministrativeFeaturesList.length>0">
                <ChipWrapper v-for="(feature) in geometry.selectedAdministrativeFeaturesList" :key="`${feature.name}-${feature.data.properties!.name}`" :label="`${feature.name}-${feature.data.properties!.name}`" @remove="removeFromSelectedGeometries(feature)" removable severity="success"/>
                </div>
            <div class="w-full flex flex-col py-1">
                <div class="w-full py-1">
                    <Dropdown class="min-w-32" v-model="geometry.activeAdministrativeArea"
                        :options="geometry.administrativeBoundariesList" option-label="name"
                        :option-disabled="(option) => { return option.name === geometry.activeAdministrativeArea?.name }"
                        :placeholder="$t('helpers.dropdownSelect')" checkmark show-clear
                        @change="geometry.changeActiveAdminLayerOnMap()">
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
                <div class="w-full py-1" v-if="geometry.activeAdministrativeArea">
                    <DataTable v-model:filters="featureListFilters" :value="activeAdministrativeAreaFeaturesList"
                        scrollable scrollHeight="300px" size="small"
                        :pt="{ thead: { class: ['hidden'] } }">
                        <template #header>
                            <IconField iconPosition="left">
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="featureListFilters['global'].value" :placeholder="$t('ligfinder.filter.geometry.administrative.search')" />
                            </IconField>
                        </template>
                        <Column field="data.properties.name"></Column>
                        <Column :header="$t('ligfinder.filter.geometry.administrative.actions')">
                            <template #body="slotProps">
                                <div class="actions text-right">
                                    <Button icon="pi pi-search-plus" @click="addToSelectedGeometries(slotProps.data)"
                                        severity="primary" text rounded :aria-label="$t('ligfinder.filter.geometry.administrative.add')"></Button>
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
import { useGeometryStore, type AdministrativeFeature } from "../../store/ligfinder/geometry";
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
                    geometry.getAdministrativeBoundaryData(item.id).then((boundaryData) => {
                        geometry.administrativeDataList.push({ ...item, data: boundaryData })
                    }).catch((error) => { console.error(error) })
                })
            }
        }).catch((error) => { console.error(error) })
    }
})
const activeAdministrativeAreaFeaturesList: Ref<AdministrativeFeature[]> = computed(() => {
    if (geometry.activeAdministrativeArea == null) {
        return []
    } else {
        const activeDataFeaturesList = geometry.administrativeDataList.filter((item) => { return item.table_name === geometry.activeAdministrativeArea?.table_name })
        if (activeDataFeaturesList.length > 0) {
            const options: AdministrativeFeature[] = []
            activeDataFeaturesList[0].data.features.forEach(feature => options.push({ data:{ ...feature }, id:geometry.activeAdministrativeArea!.id, name:geometry.activeAdministrativeArea!.name, table_name:geometry.activeAdministrativeArea!.table_name }))
            if (!(typeof options[0].data.properties!.name === "number")){
                options.sort((a, b) => {
                    const nameA = String(a.data.properties!.name).toLowerCase();
                    const nameB = String(b.data.properties!.name).toLowerCase();
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                    return 0;
                });
            }
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
