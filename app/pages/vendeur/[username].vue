<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-28">
    <div v-if="pending" class="h-48 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse" />

    <template v-else-if="data?.seller">
      <!-- En-tête de la Vitrine Vendeur -->
      <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-2xl shrink-0">
              {{ (data.sellerProfile?.display_name || data.seller.username).slice(0, 2).toUpperCase() }}
            </div>

            <div class="space-y-1.5">
              <div class="flex flex-wrap items-center gap-2.5">
                <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {{ data.sellerProfile?.display_name || data.seller.username }}
                </h1>
                <CwowdBadge
                  v-if="data.sellerProfile?.is_cwowd_member || data.seller.provider === 'discourse'"
                  :username="data.sellerProfile?.cwowd_username || data.seller.username"
                  link-to-forum
                />
              </div>

              <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span v-if="data.sellerProfile?.city" class="inline-flex items-center gap-1 font-medium">
                  <UIcon name="i-lucide-map-pin" class="w-3.5 h-3.5 text-emerald-600" />
                  {{ data.sellerProfile.city }}
                  <span v-if="data.sellerProfile.postal_code">({{ data.sellerProfile.postal_code }})</span>
                </span>
                <span v-if="data.sellerProfile?.rating_count > 0" class="inline-flex items-center gap-1 font-bold text-amber-500">
                  ★ {{ Number(data.sellerProfile.rating_average).toFixed(1) }} / 5
                  <span class="text-slate-400 font-normal">({{ data.sellerProfile.rating_count }} avis)</span>
                </span>
                <span v-else class="text-slate-400">Aucune évaluation pour le moment</span>
              </div>
            </div>
          </div>

          <!-- Encart Info réduction sur les lots -->
          <div
            v-if="data.sellerProfile?.lot_discount_info"
            class="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 max-w-md text-xs text-indigo-700 dark:text-indigo-300"
          >
            <p class="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <UIcon name="i-lucide-layers" class="w-4 h-4" />
              Offre sur les lots
            </p>
            <p>{{ data.sellerProfile.lot_discount_info }}</p>
          </div>
        </div>

        <p v-if="data.sellerProfile?.bio" class="text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-4">
          {{ data.sellerProfile.bio }}
        </p>
      </div>

      <!-- Onglets : Jeux en vente (avec sélection de lot) / Avis reçus -->
      <UTabs :items="tabItems" class="w-full">
        <template #listings>
          <div class="space-y-4 mt-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <div class="flex items-center gap-2.5 text-sm text-emerald-800 dark:text-emerald-300 font-semibold">
                <UIcon name="i-lucide-package-plus" class="w-5 h-5 shrink-0 text-emerald-600" />
                <span>
                  Astuce frais de port : Cochez plusieurs jeux ci-dessous pour proposer un lot en un seul message !
                </span>
              </div>
              <UButton
                v-if="selectedListingIds.length > 0"
                color="neutral"
                variant="ghost"
                size="xs"
                label="Tout désélectionner"
                @click="selectedListingIds = []"
              />
            </div>

            <div v-if="!data.listings?.length" class="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500">
              Ce vendeur n'a aucun jeu actif en vente actuellement.
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="item in data.listings"
                :key="item.documentId"
                class="bg-white dark:bg-slate-900 rounded-2xl border p-4 flex items-start gap-4 transition-all cursor-pointer"
                :class="
                  isSelected(item.documentId)
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                "
                @click="toggleSelection(item)"
              >
                <div class="pt-1" @click.stop>
                  <UCheckbox
                    :model-value="isSelected(item.documentId)"
                    :disabled="item.status === 'reserved'"
                    @update:model-value="toggleSelection(item)"
                  />
                </div>

                <img
                  v-if="getMediaUrl(item.game?.image_couverture?.url)"
                  :src="getMediaUrl(item.game?.image_couverture?.url)!"
                  class="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                />

                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <NuxtLink
                      :to="`/jeux/${item.game?.slug || item.game?.documentId}`"
                      class="font-bold text-slate-900 dark:text-white hover:text-emerald-600 truncate"
                      @click.stop
                    >
                      {{ item.game?.nom_fr || item.game?.nom }}
                    </NuxtLink>
                    <span class="text-lg font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                      {{ Number(item.price).toFixed(0) }} €
                    </span>
                  </div>

                  <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span class="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                      {{ item.language_code || 'VF' }}
                    </span>
                    <UBadge :color="(getCondBox(item.condition_box).color as any)" variant="subtle" size="xs">
                      {{ getCondBox(item.condition_box).short }}
                    </UBadge>
                    <UBadge v-if="item.status === 'reserved'" color="warning" size="xs">Réservé</UBadge>
                  </div>

                  <p v-if="item.description" class="text-xs text-slate-500 line-clamp-2 mt-1.5">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #reviews>
          <div class="space-y-3 mt-4">
            <div v-if="!data.reviews?.length" class="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500">
              Aucun avis reçu pour le moment.
            </div>
            <div
              v-for="rev in data.reviews"
              :key="rev.documentId"
              class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-slate-900 dark:text-white">
                    {{ rev.reviewer?.username || 'Membre' }}
                  </span>
                  <span class="text-amber-500 font-bold text-sm">
                    {{ '★'.repeat(rev.rating) }}{{ '☆'.repeat(5 - rev.rating) }}
                  </span>
                </div>
                <span class="text-xs text-slate-400">
                  {{ new Date(rev.createdAt).toLocaleDateString('fr-FR') }}
                </span>
              </div>
              <p v-if="rev.comment" class="text-sm text-slate-600 dark:text-slate-300">
                {{ rev.comment }}
              </p>
            </div>
          </div>
        </template>
      </UTabs>

      <!-- Barre flottante de création de lot en bas de l'écran -->
      <div
        v-if="selectedListings.length > 0"
        class="fixed bottom-4 inset-x-4 max-w-3xl mx-auto z-40 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
            {{ selectedListings.length }}
          </div>
          <div>
            <p class="font-bold text-sm">
              {{ selectedListings.length > 1 ? `Lot de ${selectedListings.length} jeux sélectionné` : '1 jeu sélectionné' }}
            </p>
            <p class="text-xs text-slate-300">
              Total cumulé : <strong class="text-emerald-400 text-sm">{{ selectedTotal }} €</strong>
            </p>
          </div>
        </div>

        <UButton
          color="primary"
          size="lg"
          icon="i-lucide-send"
          :label="selectedListings.length > 1 ? 'Proposer ce lot au vendeur' : 'Contacter le vendeur'"
          class="font-black rounded-xl w-full sm:w-auto"
          @click="openLotModal"
        />
      </div>

      <ContactSellerModal
        v-model:open="contactModalOpen"
        :seller-id="data.seller.id"
        :seller-name="data.sellerProfile?.display_name || data.seller.username"
        :listings="selectedListings"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { CONDITION_BOX_LABELS, useMediaUrl } from '~/utils/marketplace';

const route = useRoute();
const router = useRouter();
const { isAuthenticated } = useAuth();
const getMediaUrl = useMediaUrl();

const username = computed(() => route.params.username as string);
const { data, pending } = await useFetch<any>(() => `/api/sellers/${encodeURIComponent(username.value)}`);

const tabItems = computed(() => [
  {
    label: `Jeux en vente (${data.value?.listings?.length || 0})`,
    slot: 'listings',
    icon: 'i-lucide-package',
  },
  {
    label: `Évaluations (${data.value?.reviews?.length || 0})`,
    slot: 'reviews',
    icon: 'i-lucide-star',
  },
]);

const getCondBox = (c: string) => CONDITION_BOX_LABELS[c] || CONDITION_BOX_LABELS.like_new!;

const selectedListingIds = ref<string[]>([]);
const contactModalOpen = ref(false);

const isSelected = (docId: string) => selectedListingIds.value.includes(docId);

const toggleSelection = (item: any) => {
  if (item.status === 'reserved') return;
  const idx = selectedListingIds.value.indexOf(item.documentId);
  if (idx >= 0) {
    selectedListingIds.value.splice(idx, 1);
  } else {
    selectedListingIds.value.push(item.documentId);
  }
};

const selectedListings = computed(() =>
  (data.value?.listings || []).filter((l: any) => selectedListingIds.value.includes(l.documentId))
);

const selectedTotal = computed(() =>
  selectedListings.value.reduce((sum: number, l: any) => sum + Number(l.price || 0), 0)
);

const openLotModal = () => {
  if (!isAuthenticated.value) {
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
    return;
  }
  contactModalOpen.value = true;
};

useHead({
  title: computed(() => `Vitrine de ${username.value}`),
});
</script>
