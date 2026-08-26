<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { toggleSlideoverSidebar } from "../../core/helpers/slideoverSidebarRegistry"

interface Props {
    side: "left" | "right"
}

interface FrameItem {
    id: string
    label: string
    icon: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const frameLabel = computed(() => props.side === "left" ? t("map.sideFrame.leftLabel") : t("map.sideFrame.rightLabel"))
const leftItems = computed<FrameItem[]>(() => [
    { id: "workspaceListing", label: t("map.sideFrame.datastores"), icon: "i-lucide-database" },
    { id: "ligfinder-sidebar", label: t("map.sideFrame.ligfinder"), icon: "i-lucide-list-filter" },
])
const rightItems = computed<FrameItem[]>(() => [
    { id: "maplayerListing", label: t("map.sideFrame.layers"), icon: "i-lucide-layers" },
    { id: "ligfinder-result-table", label: t("map.sideFrame.results"), icon: "i-lucide-table-properties" },
])
const frameItems = computed(() => props.side === "left" ? leftItems.value : rightItems.value)
</script>

<template>
  <nav
    :class="['map-side-frame', `map-side-frame-${props.side}`]"
    :aria-label="frameLabel"
  >
    <UTooltip
      v-for="item in frameItems"
      :key="item.id"
      :text="item.label"
      :delay-duration="0"
    >
      <UButton
        class="map-frame-button"
        :icon="item.icon"
        color="neutral"
        variant="ghost"
        square
        :aria-label="item.label"
        @click="toggleSlideoverSidebar(item.id)"
      />
    </UTooltip>
  </nav>
</template>

<style scoped>
.map-side-frame {
    position: relative;
    z-index: 60;
    width: var(--agora-map-frame-width);
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 0;
    background: var(--ui-bg);
    border-color: var(--ui-border);
    box-shadow: var(--shadow-lg);
    pointer-events: auto;
}
.map-side-frame-left {
    border-right-width: 1px;
}
.map-side-frame-right {
    border-left-width: 1px;
}
.map-frame-button {
    width: 2.375rem;
    height: 2.375rem;
    padding: 0;
    flex: 0 0 auto;
}
</style>
