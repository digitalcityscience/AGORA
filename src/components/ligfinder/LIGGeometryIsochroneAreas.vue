<template>
    <Card class="w-full isochrone-filter">
        <template #title>Isochrone Areas</template>
        <template #content>
            <div class="w-full py-1" v-if="geometry.selectedIsochrone.length > 0">
                <ChipWrapper v-for="(_isochrone, index) in geometry.selectedIsochrone" :key="index" label="Isochrone"
                    @remove="geometry.removeSelectedIsochrone" removable severity="success" />
            </div>
            <div class="w-full 2xl:flex 2xl:justify-between 2xl:grid-cols-none lg:grid lg:grid-cols-4 lg:gap-2 2xl:gap-0 p-1 ">
                <div class="">
                    <Button v-if="!geometry.selectionOnProgress" size="small" class="text-xs leading-4 2xl:grow-0 lg:w-full"
                        @click="geometry.startCenterSelection">
                        <template #icon>
                            <i class="material-icons">add_location_alt</i>
                        </template>
                    </Button>
                    <Button v-else size="small" class="text-xs leading-4 2xl:grow-0" @click="geometry.cancelCenterSelection">
                        <template #icon>
                            <i class="material-icons">wrong_location</i>
                        </template>
                    </Button>
                </div>
                <div class="lg:grid lg:grid-cols-subgrid lg:col-span-3 2xl:grid-cols-none">
                    <SelectButton class="2xl:grow-0 lg:col-span-3 travel-mode flex" v-model="geometry.selectedTravelMode" :options="geometry.traveModeList"
                        optionLabel="name" dataKey="value" aria-labelledby="custom">
                        <template #option="slotProps">
                            <i class="material-icons">{{ slotProps.option.icon }}</i>
                        </template>
                    </SelectButton>
                </div>
                <div class="lg:grid lg:grid-cols-subgrid lg:col-span-4 2xl:grid-cols-none">
                    <InputNumber v-model="geometry.travelTime" input-class="grow lg:col-span-4" suffix="min" :min="0"></InputNumber>
                </div>
                <div class="lg:grid lg:grid-cols-subgrid lg:col-span-4 2xl:grid-cols-none">
                    <Button class="lg:col-span-4 2xl:grow-0" :disabled="geometry.centerPoint === undefined" @click="geometry.createIsochrone">Create</Button>
                </div>
            </div>
            <div class="w-full grid grid-cols-4 pt-1" v-if="geometry.isochroneOnTheMap && geometry.isochroneOnTheMapData">
                <div class="p-1 lg:col-span-2">
                    <Button class="w-full" size="small" @click="geometry.addSelectedIsochrone(geometry.isochroneOnTheMapData)">Add to
                        list</Button>
                </div>
                <div class="p-1 lg:col-span-2">
                    <Button class="w-full" size="small" @click="geometry.cancelIsochroneSelection()">Cancel</Button>
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
import Card from "primevue/card"
import SelectButton from "primevue/selectbutton";
import InputNumber from "primevue/inputnumber";
import Button from "primevue/button";
import ChipWrapper from "../ChipWrapper.vue";
import { useGeometryStore } from "../../store/ligfinder/geometry";

const geometry = useGeometryStore()
</script>

<style scoped>
@media screen and (max-width: 1440px){
    .isochrone-filter div.travel-mode:deep(div.h-full) {
        width: 100%;
    }
}
</style>
