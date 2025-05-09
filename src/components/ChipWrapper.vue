<template>
    <Chip
        v-tooltip.bottom="useShortLabel ? { value: props.label, hideDelay: 300, class: 'text-sm' } : null"
        @remove="$emit('remove')"
        :removable="props.removable"
        :label="useShortLabel && props.label && props.label.length > 24 ? `${props.label.substring(0, 24)}...` : props.label"
        :pt="ptClasses"
        :aria-label="props.label"
        :title="useShortLabel ? props.label : null"
    />
</template>

<script setup lang="ts">
import Chip from "primevue/chip"
import { computed } from "vue";

interface Props {
    severity?: "primary" | "secondary" | "success" | "info" | "warning" | "danger",
    removable?: boolean,
    label?: string,
    useShortLabel?: boolean
}
const props = withDefaults(defineProps<Props>(), {
    severity: "primary",
    removable: false,
    label: "",
    useShortLabel: true
})
const ptClasses = computed(()=>{
    let colors: string[] = []
    switch (props.severity) {
        case "primary":
            colors = ["text-white dark:text-surface-900", "bg-primary-500 dark:bg-primary-400", "border border-primary-500 dark:border-primary-400"]
            break;
        case "secondary":
            colors = ["text-white dark:text-surface-900", "bg-surface-500 dark:bg-surface-400", "border border-surface-500 dark:border-surface-400"]
            break;
        case "success":
            colors = ["text-white dark:text-green-900", "bg-green-500 dark:bg-green-400", "border border-green-500 dark:border-green-400"]
            break;
        case "info":
            colors = ["text-white dark:text-surface-900", "bg-blue-500 dark:bg-blue-400", "border border-blue-500 dark:border-blue-400"]
            break;
        case "warning":
            colors = ["text-white dark:text-surface-900", "bg-orange-500 dark:bg-orange-400", "border border-orange-500 dark:border-orange-400"]
            break;
        case "danger":
            colors = ["text-white dark:text-surface-900", "bg-red-500 dark:bg-red-400", "border border-red-500 dark:border-red-400"]
            break;
        default:
            colors = ["text-white dark:text-surface-900", "bg-primary-500 dark:bg-primary-400", "border border-primary-500 dark:border-primary-400"]
            break;
    }
    let shortenStyles: string[] = []
    if (props.useShortLabel) {
        shortenStyles = ["overflow-hidden", "text-ellipsis"]
    }
    return {
        root: {
            class: [
                // Flexbox
                "inline-flex items-center",
                // Spacing
                "ml-1",
                "first:ml-0",
                "mb-1",
                // Shape
                "rounded-[1rem]",
                ...colors,
                ...shortenStyles,
            ]
        }
    }
})
</script>
