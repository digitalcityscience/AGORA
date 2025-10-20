<template>
    <div class="legend p-0">
      <h3 class="m-0 mb-3 font-bold">Legend</h3>
      <ul class="list-none m-0 p-3 border-gray-300 border rounded-md">
        <li class="flex items-center p-1 mb-1" v-for="(item, index) in legendItems" :key="index">
          <span class="w-[36px] h-[36px]" :style="{ backgroundColor: item.color }"></span>
          <span class="ml-3 grow">{{ item.label }}</span>
        </li>
      </ul>
    </div>
  </template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "GRZLegend",
    props: {
        mbstyle: {
            type: Array as PropType<any[]>, // The mbstyle object is expected as an array
            required: true,
        },
    },
    data() {
        return {
            legendItems: [] as Array<{ label: string; color: string }>,
        };
    },
    watch: {
        mbstyle: {
            immediate: true,
            handler() {
                this.parseMbStyle();
            },
        },
    },
    methods: {
        parseMbStyle() {
            if (!Array.isArray(this.mbstyle) || this.mbstyle[0] !== "case") {
                console.warn("Invalid mbstyle format");
                return;
            }

            const mbstyle = this.mbstyle;
            const legendItems: Array<{ label: string; color: string }> = [];

            for (let i = 1; i < mbstyle.length - 1; i += 2) {
                const condition = mbstyle[i];
                const color = mbstyle[i + 1];

                let label = "";

                // Generate a dynamic label based on the condition
                if (condition[0] === "<" || condition[0] === "<=" || condition[0] === ">" || condition[0] === ">=" || condition[0] === "==") {
                    const attribute = condition[1][1]; // Extract the attribute name
                    const value = condition[2]; // Extract the comparison value
                    const operator = condition[0];
                    label = `${attribute} ${operator} ${value}`;
                } else if (condition[0] === "all") {
                    const subConditions = condition.slice(1);
                    const subLabels = subConditions.map((sub: any) => {
                        const attribute = sub[1][1];
                        const value = sub[2];
                        const operator = sub[0];
                        return `${attribute} ${operator} ${value}`;
                    });
                    label = subLabels.join(" and ");
                }

                if (color !== "rgba(255, 255, 255, 0)") {
                    legendItems.push({ label, color });
                }
            }

            this.legendItems = legendItems;
        },
    },
});
</script>

  <style scoped>
  </style>
