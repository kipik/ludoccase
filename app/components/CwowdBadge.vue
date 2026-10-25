<template>
  <UTooltip text="Membre vérifié de la communauté CWOWD">
    <component
      :is="username && linkToForum ? 'a' : 'span'"
      :href="username && linkToForum ? `https://forum.cwowd.com/u/${username}` : undefined"
      :target="username && linkToForum ? '_blank' : undefined"
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-colors"
      @click.stop
    >
      <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5 shrink-0" />
      <span>CWOWD</span>
    </component>
  </UTooltip>
</template>

<script setup lang="ts">
defineProps<{
  username?: string | null;
  linkToForum?: boolean;
}>();
</script>
