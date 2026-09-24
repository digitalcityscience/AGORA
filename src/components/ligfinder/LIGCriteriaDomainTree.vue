<template>
    <div class="min-w-0 w-full space-y-2">
        <UInput
            v-model="search"
            class="w-full"
            :placeholder="$t('ligfinder.filter.geometry.administrative.search')"
            :aria-label="$t('ligfinder.filter.geometry.administrative.search')"
        />
        <UTree
            v-model:expanded="expandedKeys"
            class="min-w-0 w-full"
            :items="filteredNodes"
            :get-key="getCriteriaKey"
            size="sm"
            :ui="{
                root: 'min-w-0 w-full',
                link: 'min-w-0 gap-2 py-1.5',
                linkLeadingIcon: 'hidden',
                linkLabel: 'min-w-0 whitespace-normal break-words text-sm',
                linkTrailing: 'shrink-0',
            }"
            @select="preventTreeSelection"
        >
            <template #item-trailing="{ item }">
                <div class="flex shrink-0 items-center gap-0.5" @click.stop>
                    <UButton
                        icon="i-lucide-plus"
                        color="success"
                        variant="ghost"
                        size="xs"
                        square
                        :aria-label="$t('common.include')"
                        @click="$emit('include', item as CriteriaTreeNode)"
                    />
                    <UButton
                        icon="i-lucide-minus"
                        color="error"
                        variant="ghost"
                        size="xs"
                        square
                        :aria-label="$t('common.exclude')"
                        @click="$emit('exclude', item as CriteriaTreeNode)"
                    />
                </div>
            </template>
        </UTree>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import domains, {
    type LGBArtData,
    type LGBTypData,
    type NutzungDomainData,
    type NutzungItemData,
} from "../../domains.ts";

export type CriteriaTreeNode = (LGBArtData | LGBTypData | NutzungDomainData | NutzungItemData) & {
    children?: CriteriaTreeNode[]
};

defineEmits<{
    include: [node: CriteriaTreeNode]
    exclude: [node: CriteriaTreeNode]
}>();

const search = ref("");
const expandedKeys = ref<string[]>([]);
const criteriaNodes = domains.data as CriteriaTreeNode[];
const filteredNodes = computed(() => filterNodes(criteriaNodes, search.value.trim().toLocaleLowerCase()));

watch(search, (value) => {
    expandedKeys.value = value.trim() === "" ? [] : collectParentKeys(filteredNodes.value);
});

function filterNodes(nodes: CriteriaTreeNode[], searchValue: string): CriteriaTreeNode[] {
    if (searchValue === "") return nodes;
    return nodes.flatMap((node) => {
        const children = node.children === undefined ? [] : filterNodes(node.children, searchValue);
        if (node.label.toLocaleLowerCase().includes(searchValue) || children.length > 0) {
            return [{ ...node, ...(node.children === undefined ? {} : { children }) } as CriteriaTreeNode];
        }
        return [];
    });
}

function collectParentKeys(nodes: CriteriaTreeNode[]): string[] {
    return nodes.flatMap((node) => (node.children !== undefined && node.children.length > 0)
        ? [node.key, ...collectParentKeys(node.children)]
        : []);
}

function getCriteriaKey(node: CriteriaTreeNode): string {
    return node.key;
}

function preventTreeSelection(event: { preventDefault: () => void }): void {
    event.preventDefault();
}
</script>
