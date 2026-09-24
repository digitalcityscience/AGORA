import { defineStore, acceptHMRUpdate } from "pinia"
import { ref } from "vue"

/**
 * Advanced criteria filtering.
 *
 * A "block" mixes included/excluded art/typ/nutzung conditions under one
 * and/or operator; multiple blocks are combined under one more and/or
 * operator. This is a two-level UI on top of a generic and/or/condition
 * tree (CriteriaNode) - the same tree shape the backend consumes
 * (see AGORA-BE: app/models/ligfinderModel.py CriteriaGroup/CriteriaCondition,
 * app/common/ligfinderFunc.py generate_criteria_group_sql). Both sides must
 * stay in lock-step: same attribute->property map, same exact-token match
 * semantics, same null handling.
 *
 * A block is only added to `blocks` (and therefore only counted by
 * buildCriteriaTree/buildCriteriaExpression) once it's explicitly saved via
 * `saveDraftBlock`. `startNewBlock`/`startEditingBlock` open a `draftBlock`
 * that the UI edits in place; `cancelDraftBlock` discards it without
 * touching `blocks`. There's no cross-block move: a condition only ever
 * gets added to whichever block is currently the draft.
 */

export type CriteriaAttribute = "art" | "typ" | "nutzung"
export type CriteriaOperator = "and" | "or"

export interface CriteriaConditionNode {
    type: "condition"
    attribute: CriteriaAttribute
    values: string[]
    negate: boolean
    /** Display-only label for the UI (e.g. the domain tree node's label); ignored by the backend. */
    label?: string
}

export interface CriteriaGroupNode {
    type: "group"
    operator: CriteriaOperator
    children: CriteriaNode[]
}

export type CriteriaNode = CriteriaConditionNode | CriteriaGroupNode

export interface CriteriaBlock {
    id: string
    operator: CriteriaOperator
    conditions: CriteriaConditionNode[]
}

const ATTRIBUTE_PROPERTY_MAP: Record<CriteriaAttribute, string> = {
    art: "lgb_art_values",
    typ: "lgb_typ_values",
    nutzung: "nutzart_list_final",
}

function createId(): string {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `block-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function cloneBlock(block: CriteriaBlock): CriteriaBlock {
    return {
        id: block.id,
        operator: block.operator,
        conditions: block.conditions.map((condition) => ({ ...condition, values: [...condition.values] })),
    }
}

/**
 * Compiles one condition into a MapLibre GL expression.
 *
 * The comma-joined attribute columns (lgb_art_values, lgb_typ_values,
 * nutzart_list_final) are plain text, not arrays (GeoServer doesn't support
 * array attributes). Values are padded with commas on both sides before the
 * substring check so e.g. "8" cannot falsely match inside "080" - this
 * mirrors the backend's `string_to_array(...) && ARRAY[...]` exact-token
 * overlap. `coalesce` handles a null property the same way the backend's
 * `coalesce(column, '')` does.
 */
function compileCondition(node: CriteriaConditionNode): any[] {
    const property = ATTRIBUTE_PROPERTY_MAP[node.attribute]
    const haystack = ["concat", ",", ["coalesce", ["get", property], ""], ","]
    const hits = node.values.map((value) => ["in", `,${value},`, haystack])
    const expression = hits.length === 1 ? hits[0] : ["any", ...hits]
    return node.negate ? ["!", expression] : expression
}

function compileNode(node: CriteriaNode): any[] {
    if (node.type === "condition") {
        return compileCondition(node)
    }
    if (node.children.length === 0) {
        return []
    }
    const joiner = node.operator === "and" ? "all" : "any"
    return [joiner, ...node.children.map(compileNode)]
}

export const useCriteriaAdvancedStore = defineStore("criteriaAdvanced", () => {
    /** Whether the advanced (block-based) filter is the one currently in effect, instead of the simple one. */
    const isActive = ref<boolean>(false)
    const blocks = ref<CriteriaBlock[]>([])
    const blocksOperator = ref<CriteriaOperator>("and")
    /** The block currently being created or edited; not yet part of `blocks` until saved. */
    const draftBlock = ref<CriteriaBlock | null>(null)
    /** Id of the saved block being edited, if `draftBlock` came from `startEditingBlock`; null when creating a new one. */
    const editingBlockId = ref<string | null>(null)

    function setActive(active: boolean): void {
        isActive.value = active
    }

    function startNewBlock(operator: CriteriaOperator = "or"): void {
        draftBlock.value = { id: createId(), operator, conditions: [] }
        editingBlockId.value = null
    }

    function startEditingBlock(blockId: string): void {
        const block = blocks.value.find((b) => b.id === blockId)
        if (block === undefined) {
            return
        }
        draftBlock.value = cloneBlock(block)
        editingBlockId.value = blockId
    }

    function cancelDraftBlock(): void {
        draftBlock.value = null
        editingBlockId.value = null
    }

    /** Commits the draft into `blocks` (replacing the original when editing). No-ops on an empty draft. */
    function saveDraftBlock(): void {
        if (draftBlock.value === null || draftBlock.value.conditions.length === 0) {
            return
        }
        const savedBlock = draftBlock.value
        const existingIndex = blocks.value.findIndex((b) => b.id === savedBlock.id)
        if (existingIndex !== -1) {
            blocks.value[existingIndex] = savedBlock
        } else {
            blocks.value.push(savedBlock)
        }
        draftBlock.value = null
        editingBlockId.value = null
    }

    function removeBlock(blockId: string): void {
        blocks.value = blocks.value.filter((block) => block.id !== blockId)
        if (editingBlockId.value === blockId) {
            cancelDraftBlock()
        }
    }

    function setDraftOperator(operator: CriteriaOperator): void {
        if (draftBlock.value !== null) {
            draftBlock.value.operator = operator
        }
    }

    function setBlocksOperator(operator: CriteriaOperator): void {
        blocksOperator.value = operator
    }

    function addConditionToDraft(
        attribute: CriteriaAttribute,
        values: string[],
        negate = false,
        label?: string
    ): void {
        if (draftBlock.value !== null && values.length > 0) {
            draftBlock.value.conditions.push({ type: "condition", attribute, values, negate, label })
        }
    }

    function removeConditionFromDraft(index: number): void {
        draftBlock.value?.conditions.splice(index, 1)
    }

    function resetAdvancedCriteria(): void {
        isActive.value = false
        blocks.value = []
        blocksOperator.value = "and"
        draftBlock.value = null
        editingBlockId.value = null
    }

    /**
     * Builds the canonical criteria tree from the saved blocks, or null if no
     * block has any conditions (meaning: no advanced filter is active). The
     * in-progress draft is intentionally excluded until it's saved. This is
     * exactly what gets sent to the backend as `criteria_group`.
     */
    function buildCriteriaTree(): CriteriaGroupNode | null {
        const activeBlocks: CriteriaGroupNode[] = blocks.value
            .filter((block) => block.conditions.length > 0)
            .map((block) => ({ type: "group", operator: block.operator, children: block.conditions }))

        if (activeBlocks.length === 0) {
            return null
        }
        if (activeBlocks.length === 1) {
            return activeBlocks[0]
        }
        return { type: "group", operator: blocksOperator.value, children: activeBlocks }
    }

    /**
     * Compiles the current (saved) blocks into a MapLibre GL filter
     * expression, for the pre-request, client-side vector tile filter.
     * Returns an empty array (no filter) when no advanced criteria are active.
     */
    function buildCriteriaExpression(): any[] {
        const tree = buildCriteriaTree()
        return tree !== null ? compileNode(tree) : []
    }

    return {
        isActive,
        blocks,
        blocksOperator,
        draftBlock,
        editingBlockId,
        setActive,
        startNewBlock,
        startEditingBlock,
        cancelDraftBlock,
        saveDraftBlock,
        removeBlock,
        setDraftOperator,
        setBlocksOperator,
        addConditionToDraft,
        removeConditionFromDraft,
        resetAdvancedCriteria,
        buildCriteriaTree,
        buildCriteriaExpression,
    }
})

/* eslint-disable */
if (import.meta.hot) {
 import.meta.hot.accept(acceptHMRUpdate(useCriteriaAdvancedStore, import.meta.hot))
}
