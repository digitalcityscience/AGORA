<template>
    <UBadge
        class="max-w-full gap-1"
        :color="badgeColor"
        variant="soft"
        size="sm"
        :aria-label="props.label"
        :title="props.useShortLabel ? props.label : undefined"
    >
        <span class="min-w-0 truncate">{{ displayLabel }}</span>
        <UButton
            v-if="props.removable"
            class="-my-1 -mr-1 shrink-0"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :aria-label="$t('common.removeItem', { item: props.label })"
            @click.stop="$emit('remove')"
        />
    </UBadge>
</template>

<script setup lang="ts">
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
const badgeColor = computed<"primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral">(() => {
    switch (props.severity) {
        case "danger": return "error"
        case "secondary": return "neutral"
        case "success": return "success"
        case "info": return "info"
        case "warning": return "warning"
        default:
            return "primary"
    }
})
const displayLabel = computed(() => props.useShortLabel && props.label.length > 24
    ? `${props.label.substring(0, 24)}...`
    : props.label)
</script>
