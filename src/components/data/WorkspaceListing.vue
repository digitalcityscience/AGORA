<template>
        <BaseSlideoverSidebarComponent :id="sidebarID" side="left" :collapsed="true">
            <template #header>
                <span>{{ $t('map.sideFrame.datastores') }}</span>
            </template>
            <div class="w-full p-3">
                <UAccordion
                    v-if="workspaceAccordionItems.length > 0"
                    :items="workspaceAccordionItems"
                    type="multiple"
                    :default-value="[]"
                    :ui="{
                        item: 'mb-2 overflow-hidden rounded-md border border-muted !border-b bg-default/70 last:!border-b',
                        trigger: 'rounded-none px-3 py-2.5 text-highlighted hover:bg-elevated/70',
                        label: 'truncate text-base font-semibold capitalize',
                        body: 'border-t border-muted bg-elevated/40 p-3',
                    }"
                >
                    <template #body="{ item }">
                        <WorkspaceListingItem :workspace="item.workspace" />
                    </template>
                </UAccordion>
                <UAlert
                    v-else
                    class="w-full"
                    color="info"
                    variant="soft"
                    icon="i-lucide-info"
                    :description="$t('datastore.notFound')"
                />
            </div>
        </BaseSlideoverSidebarComponent>
</template>

<script setup lang="ts">
import BaseSlideoverSidebarComponent from "../base/BaseSlideoverSidebarComponent.vue";
import WorkspaceListingItem from "./WorkspaceListingItem.vue";
import { type WorkspaceListItem } from "../../store/api/geoserver";
import { computed } from "vue";

export interface Props {
    workspaces: WorkspaceListItem[] | undefined
}
const props = defineProps<Props>()
const sidebarID = "workspaceListing"
const workspaceAccordionItems = computed(() => props.workspaces?.map((workspace) => ({
    label: workspace.name.replace(/[_-]/g, " "),
    value: workspace.name,
    workspace,
})) ?? [])
</script>
