<template>
    <div v-if="hasLayers" class="space-y-3">
        <WorkspaceLayerListingItem
            v-for="layer in props.list"
            :key="layer.href"
            :item="layer"
            :workspace="workspaceName"
        />
    </div>
    <div v-else>
        <UAlert
            class="w-full"
            color="info"
            variant="soft"
            icon="i-lucide-info"
            :description="$t('datastore.layer.noLayer')"
        />
    </div>
</template>

<script setup lang="ts">
import WorkspaceLayerListingItem from "./WorkspaceLayerListingItem.vue";
import { type GeoserverLayerListItem } from "../../store/api/geoserver";
import { computed } from "vue";
export interface Props {
    list: GeoserverLayerListItem[] | undefined
    workspaceName: string
}
const props = defineProps<Props>()
const hasLayers = computed(() => (props.list?.length ?? 0) > 0)
</script>
<style scoped></style>
