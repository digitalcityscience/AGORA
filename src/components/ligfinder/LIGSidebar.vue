<template>
	<SidebarLayout :id="sidebarID" position="left" :collapsed=false>
	</SidebarLayout>
</template>

<script setup lang="ts">
import SidebarLayout from "../SidebarLayout.vue";
import { useMapStore } from "../../store/map";
import { SidebarControl } from "../../core/helpers/sidebarControl";
const mapStore = useMapStore()
const sidebarID = "ligfinder-sidebar"

const sidebarControl = new SidebarControl("", sidebarID, document.createElement("div"))
mapStore.map.addControl(sidebarControl, "top-left")
</script>

<style scoped>
</style>
