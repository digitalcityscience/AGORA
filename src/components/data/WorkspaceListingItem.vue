<template>
    <div class="workspace-detail space-y-3 pt-1">
        <div v-if="isLoading" class="space-y-2">
            <USkeleton class="h-24 w-full rounded-md" />
            <USkeleton class="h-24 w-full rounded-md" />
        </div>
        <UAlert
            v-else-if="loadError"
            class="w-full"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :description="$t('datastore.layer.loadError')"
        />
        <WorkspaceLayerListing
            v-else
            :list="layerList"
            :workspace-name="props.workspace.name"
        />
    </div>
</template>

<script setup lang="ts">
// Components
import WorkspaceLayerListing from "./WorkspaceLayerListing.vue";
// JS imports
import { useGeoserverStore, type WorkspaceListItem, type GeoserverLayerListItem } from "../../store/api/geoserver";
import { ref, onMounted } from "vue";
const geoserver = useGeoserverStore()
export interface Props {
    workspace: WorkspaceListItem
}
const props = defineProps<Props>()
const layerList = ref<GeoserverLayerListItem[]>()
const isLoading = ref(true)
const loadError = ref(false)
onMounted(() => {
    geoserver.getLayerList(props.workspace.name).then((response) => {
        layerList.value = response.layers.layer ?? []
    }).catch((err) => {
        console.error(err)
        loadError.value = true
    }).finally(() => {
        isLoading.value = false
    })
})
</script>
