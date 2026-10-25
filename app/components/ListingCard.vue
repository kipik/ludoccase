<template>
  <div class="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
    <!-- En-tête : Jeu & Prix -->
    <NuxtLink :to="`/jeux/${listing.game?.slug || listing.game?.documentId}`" class="p-4 flex gap-3.5 items-start flex-1">
      <div class="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700/60">
        <img v-if="coverUrl" :src="coverUrl" :alt="gameTitle" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
          <UIcon name="i-lucide-dices" class="w-8 h-8" />
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {{ gameTitle }}
          </h3>
          <span class="text-lg font-black text-emerald-600 dark:text-emerald-400 shrink-0">
            {{ Number(listing.price).toFixed(0) }} €
          </span>
        </div>

        <p v-if="editionLabel" class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
          {{ editionLabel }}
        </p>

        <!-- Tags état & langue -->
        <div class="flex flex-wrap items-center gap-1.5 mt-2">
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {{ langInfo.flag }} {{ listing.language_code || 'VF' }}
          </span>
          <UBadge :color="(condInfo.color as any)" variant="subtle" size="xs">
            {{ condInfo.short }}
          </UBadge>
          <UBadge v-if="listing.status === 'reserved'" color="warning" variant="solid" size="xs">
            Réservé
          </UBadge>
        </div>

        <p v-if="listing.description" class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">
          {{ listing.description }}
        </p>
      </div>
    </NuxtLink>

    <!-- Pied de carte : Vendeur & Remise -->
    <div class="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
      <NuxtLink
        v-if="listing.seller?.username"
        :to="`/vendeur/${encodeURIComponent(listing.seller.username)}`"
        class="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 truncate"
      >
        <UIcon name="i-lucide-user" class="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span class="truncate">{{ listing.sellerProfile?.display_name || listing.seller.username }}</span>
        <span v-if="listing.sellerProfile?.rating_count > 0" class="inline-flex items-center text-amber-500 font-bold">
          ★ {{ Number(listing.sellerProfile.rating_average).toFixed(1) }}
        </span>
        <CwowdBadge
          v-if="listing.sellerProfile?.is_cwowd_member || listing.seller?.provider === 'discourse'"
          :username="listing.sellerProfile?.cwowd_username || listing.seller?.username"
        />
      </NuxtLink>

      <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0">
        <span v-if="listing.location_city" class="inline-flex items-center gap-0.5 truncate max-w-[110px]">
          <UIcon name="i-lucide-map-pin" class="w-3.5 h-3.5 text-slate-400" />
          {{ listing.location_city }}
        </span>
        <UTooltip v-if="listing.delivery_shipping" text="Expédition possible (Mondial Relay, etc.)">
          <UIcon name="i-lucide-package" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </UTooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CONDITION_BOX_LABELS, LANGUAGE_LABELS, useMediaUrl } from '~/utils/marketplace';

const props = defineProps<{
  listing: Record<string, any>;
}>();

const getMediaUrl = useMediaUrl();

const gameTitle = computed(() => props.listing.game?.nom_fr || props.listing.game?.nom || 'Jeu');

const editionLabel = computed(() => {
  const ed = props.listing.edition;
  if (!ed) return null;
  return ed.nom_fr || ed.nom_edition || (ed.annee_publication ? `Édition ${ed.annee_publication}` : null);
});

const coverUrl = computed(() => {
  const url =
    props.listing.photos?.[0]?.url ||
    props.listing.edition?.image_couverture?.url ||
    props.listing.game?.image_couverture?.url ||
    props.listing.game?.cached_main_image_url;
  return getMediaUrl(url);
});

const condInfo = computed(() => CONDITION_BOX_LABELS[props.listing.condition_box] || CONDITION_BOX_LABELS.like_new!);
const langInfo = computed(() => LANGUAGE_LABELS[props.listing.language_code] || LANGUAGE_LABELS.VF!);
</script>
