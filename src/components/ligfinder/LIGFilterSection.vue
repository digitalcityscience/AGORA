<template>
    <UAccordion
        :items="items"
        type="single"
        :default-value="props.defaultOpen ? sectionValue : undefined"
        :unmount-on-hide="false"
        :ui="{
            item: 'overflow-hidden rounded-md border border-muted !border-b bg-default/70',
            trigger: 'rounded-none px-3 py-2.5 text-sm font-semibold text-highlighted hover:bg-elevated/70',
            label: 'min-w-0 whitespace-normal text-left',
            body: 'min-w-0 border-t border-muted bg-elevated/30 p-3',
        }"
    >
        <template #body>
            <div class="min-w-0 w-full">
                <slot />
            </div>
        </template>
    </UAccordion>
</template>

<script setup lang="ts">
import { computed } from "vue"

interface Props {
    title: string
    value: string
    defaultOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    defaultOpen: true,
})
const sectionValue = computed(() => props.value)
const items = computed(() => [{
    label: props.title,
    value: sectionValue.value,
}])
</script>
