<template>
    <Card v-if="props.layerData !== null" >
        <template #title>
            {{ $t('download.title') }}
        </template>
        <template #subtitle>
            {{ $t('download.subtitle') }}
        </template>
        <template #content>
            <div class="w-full 2xl:flex 2xl:justify-between 2xl:grid-cols-none lg:grid lg:grid-cols-4 lg:gap-2 2xl:gap-0 p-1 ">
                <div class="w-full flex flex-row-reverse lg:col-span-2">
                    <InputGroup>
                        <InputText class="h-full rounded-l-lg" type="text" v-model="fileName"
                            :placeholder="$t('download.fileName')"></InputText>
                        <InputGroupAddon>
                            <ToggleButton unstyled v-model="format"  :offLabel="$t('download.downloadGeoJSON')"
                                :onLabel="$t('download.downloadCSV')" class="rounded-l-none px-2" />
                        </InputGroupAddon>
                    </InputGroup>
                </div>
                <div class="w-full flex lg:col-span-2">
                    <Button :disabled="fileName.length === 0" class="ml-3"
                        @click="format ? downloadCSVFromGeoJSON(props.layerData, fileName) : downloadAsGeojson(props.layerData, fileName)">{{ $t('download.download') }}</Button>
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
import Card from "primevue/card";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";
import InputText from "primevue/inputtext";
import ToggleButton from "primevue/togglebutton";
import Button from "primevue/button";
import { type FeatureCollection } from "geojson";
import { downloadCSVFromGeoJSON, downloadAsGeojson } from "../../../core/helpers/functions";
import { ref } from "vue";
interface Props {
    layerData: FeatureCollection | null
}
const props = withDefaults(defineProps<Props>(), {
    layerData: null
})
const fileName = ref<string>("")
const format = ref<boolean>(true)
</script>

<style scoped></style>
