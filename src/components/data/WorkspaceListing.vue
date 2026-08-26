<template>
        <BaseSlideoverSidebarComponent :id="sidebarID" side="left" :collapsed="true">
            <template #header>
                <span>{{ $t('map.sideFrame.datastores') }}</span>
            </template>
            <div class="w-full" v-if="props.workspaces && props.workspaces.length > 0">
                <Accordion :multiple="true" :value="[0]">
                    <AccordionPanel v-for="(item, index) in props.workspaces" :key="index" :value="index">
                        <AccordionHeader>
                            <h2 class="text-xl font-semibold capitalize">{{ item.name.replace(/[_-]/g, ' ') }}</h2>
                        </AccordionHeader>
                        <AccordionContent>
                            <WorkspaceListingItem :workspace="item"></WorkspaceListingItem>
                        </AccordionContent>
                    </AccordionPanel>
                </Accordion>
            </div>
            <div class="w-full" v-else>
                <InlineMessage class="w-full" severity="info">{{$t('datastore.notFound')}}</InlineMessage>
            </div>
        </BaseSlideoverSidebarComponent>
</template>

<script setup lang="ts">
// Components
import Accordion from "primevue/accordion";
import AccordionPanel from "primevue/accordionpanel";
import AccordionHeader from "primevue/accordionheader";
import AccordionContent from "primevue/accordioncontent";
import InlineMessage from "primevue/inlinemessage";
import BaseSlideoverSidebarComponent from "../base/BaseSlideoverSidebarComponent.vue";
import WorkspaceListingItem from "./WorkspaceListingItem.vue";
// JS-TS imports
import { type WorkspaceListItem } from "../../store/api/geoserver";

export interface Props {
    workspaces: WorkspaceListItem[] | undefined
}
const props = defineProps<Props>()
const sidebarID = "workspaceListing"
</script>
