<template>
    <LIGFilterSection value="criteria-filters" :title="$t('ligfinder.filter.criteria.title')">
        <div class="min-w-0 space-y-3">
            <div v-if="criteria.criteriaInUse.length > 0" class="space-y-3">
                <section v-if="includedCriteria.length > 0" class="space-y-1">
                    <div class="flex min-w-0 items-center justify-between gap-2">
                        <h3 class="min-w-0 text-sm font-semibold text-highlighted">
                            {{ $t("ligfinder.filter.criteria.included") }}
                        </h3>
                        <UButton
                            class="shrink-0"
                            :label="$t('ligfinder.filter.criteria.removeall')"
                            color="neutral"
                            variant="link"
                            size="xs"
                            @click="removeAllSelectedCriteria('included')"
                        />
                    </div>
                    <div class="flex min-w-0 flex-wrap items-center gap-1">
                        <template v-for="(criterion, index) in includedCriteria" :key="criterion.key">
                            <ChipWrapper
                                :label="criterion.label"
                                severity="success"
                                removable
                                @remove="removeFromAppliedCriteria(criterion)"
                            />
                            <span v-if="index < includedCriteria.length - 1" class="text-xs italic text-muted">
                                {{ $t("helpers.logical.or") }}
                            </span>
                        </template>
                    </div>
                </section>
                <section v-if="excludedCriteria.length > 0" class="space-y-1">
                    <div class="flex min-w-0 items-center justify-between gap-2">
                        <h3 class="min-w-0 text-sm font-semibold text-highlighted">
                            {{ $t("ligfinder.filter.criteria.excluded") }}
                        </h3>
                        <UButton
                            class="shrink-0"
                            :label="$t('ligfinder.filter.criteria.removeall')"
                            color="neutral"
                            variant="link"
                            size="xs"
                            @click="removeAllSelectedCriteria('excluded')"
                        />
                    </div>
                    <div class="flex min-w-0 flex-wrap items-center gap-1">
                        <template v-for="(criterion, index) in excludedCriteria" :key="criterion.key">
                            <ChipWrapper
                                :label="criterion.label"
                                severity="danger"
                                removable
                                @remove="removeFromAppliedCriteria(criterion)"
                            />
                            <span v-if="index < excludedCriteria.length - 1" class="text-xs italic text-muted">
                                {{ $t("helpers.logical.and") }}
                            </span>
                        </template>
                    </div>
                </section>
            </div>
            <UAlert
                v-else
                color="info"
                variant="soft"
                :description="$t('ligfinder.filter.criteria.none')"
            />

            <UInput
                v-model="criteriaSearch"
                class="w-full"
                :placeholder="$t('ligfinder.filter.geometry.administrative.search')"
                :aria-label="$t('ligfinder.filter.geometry.administrative.search')"
            />
            <UTree
                v-model:expanded="expandedKeys"
                class="min-w-0 w-full"
                :items="filteredCriteriaNodes"
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
                            @click="includeNode(item as CriteriaTreeNode)"
                        />
                        <UButton
                            icon="i-lucide-minus"
                            color="error"
                            variant="ghost"
                            size="xs"
                            square
                            :aria-label="$t('common.exclude')"
                            @click="excludeNode(item as CriteriaTreeNode)"
                        />
                    </div>
                </template>
            </UTree>
        </div>
    </LIGFilterSection>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ChipWrapper from "../base/ChipWrapper.vue";
import LIGFilterSection from "./LIGFilterSection.vue";
import { type AppliedCriteria, useCriteriaStore } from "../../store/ligfinder/criteria.ts";
import domains, {
    type LGBArtData,
    type LGBTypData,
    type NutzungDomainData,
    type NutzungItemData,
} from "../../domains.ts";

type CriteriaStatus = "included" | "excluded";
type CriteriaTreeNode = (LGBArtData | LGBTypData | NutzungDomainData | NutzungItemData) & {
    children?: CriteriaTreeNode[]
};

const criteria = useCriteriaStore();
const criteriaSearch = ref("");
const expandedKeys = ref<string[]>([]);
const includedCriteria = computed(() => criteria.criteriaInUse.filter((criterion) => criterion.status === "included"));
const excludedCriteria = computed(() => criteria.criteriaInUse.filter((criterion) => criterion.status === "excluded"));
const criteriaNodes = domains.data as CriteriaTreeNode[];
const filteredCriteriaNodes = computed(() => filterNodes(criteriaNodes, criteriaSearch.value.trim().toLocaleLowerCase()));

watch(criteriaSearch, (search) => {
    expandedKeys.value = search.trim() === "" ? [] : collectParentKeys(filteredCriteriaNodes.value);
});

function filterNodes(nodes: CriteriaTreeNode[], search: string): CriteriaTreeNode[] {
    if (search === "") return nodes;
    return nodes.flatMap((node) => {
        const children = node.children === undefined ? [] : filterNodes(node.children, search);
        if (node.label.toLocaleLowerCase().includes(search) || children.length > 0) {
            return [{ ...node, ...(node.children === undefined ? {} : { children }) } as CriteriaTreeNode];
        }
        return [];
    });
}

function collectParentKeys(nodes: CriteriaTreeNode[]): string[] {
    return nodes.flatMap((node) => node.children?.length
        ? [node.key, ...collectParentKeys(node.children)]
        : []);
}

function getCriteriaKey(node: CriteriaTreeNode): string {
    return node.key;
}

function preventTreeSelection(event: { preventDefault: () => void }): void {
    event.preventDefault();
}

function isAggregateUsageNode(node: CriteriaTreeNode): node is NutzungDomainData & { children: CriteriaTreeNode[] } {
    return node.children !== undefined && Object.prototype.hasOwnProperty.call(node, "nutzungvalue");
}

function includeNode(node: CriteriaTreeNode): void {
    isAggregateUsageNode(node) ? addAllChildren(node, "included") : addToAppliedCriteria(node, "included");
}

function excludeNode(node: CriteriaTreeNode): void {
    isAggregateUsageNode(node) ? addAllChildren(node, "excluded") : addToAppliedCriteria(node, "excluded");
}

function addToAppliedCriteria(node: CriteriaTreeNode, status: CriteriaStatus): void {
    const criterion: AppliedCriteria = {
        data: node,
        status,
        label: node.label,
        key: node.key,
    };
    criteria.addCriteria(criterion);
}

function removeFromAppliedCriteria(criterion: AppliedCriteria): void {
    criteria.removeCriteria(criterion);
}

function addAllChildren(node: { children: CriteriaTreeNode[] }, status: CriteriaStatus): void {
    node.children.forEach((child) => addToAppliedCriteria(child, status));
}

function removeAllSelectedCriteria(status: CriteriaStatus): void {
    criteria.criteriaInUse
        .filter((criterion) => criterion.status === status)
        .forEach((criterion) => criteria.removeCriteria(criterion));
}
</script>
