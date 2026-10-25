<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
    <div v-if="pending" class="h-64 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse" />

    <template v-else-if="data?.game">
      <!-- En-tête de la Fiche Jeu -->
      <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div class="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700 mx-auto md:mx-0">
          <img
            v-if="gameCoverUrl"
            :src="gameCoverUrl"
            :alt="gameTitle"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
            <UIcon name="i-lucide-dices" class="w-12 h-12" />
          </div>
        </div>

        <div class="flex-1 space-y-3 text-center md:text-left">
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span v-if="data.game.annee_publication" class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {{ data.game.annee_publication }}
            </span>
            <span v-if="data.game.nombre_joueurs_min" class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              👥 {{ data.game.nombre_joueurs_min }}–{{ data.game.nombre_joueurs_max || data.game.nombre_joueurs_min }} joueurs
            </span>
            <span v-if="data.game.duree_estimee || data.game.duree_mini" class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              ⏱️ {{ data.game.duree_estimee || data.game.duree_mini }} min
            </span>
          </div>

          <h1 class="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            {{ gameTitle }}
          </h1>

          <p v-if="data.game.author_names || data.game.publisher_names" class="text-xs text-slate-500">
            <span v-if="data.game.author_names">Auteur(s) : <strong>{{ data.game.author_names }}</strong></span>
            <span v-if="data.game.author_names && data.game.publisher_names"> • </span>
            <span v-if="data.game.publisher_names">Éditeur(s) : <strong>{{ data.game.publisher_names }}</strong></span>
          </p>

          <div class="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <UButton
              :to="`/vendre?game=${data.game.slug || data.game.documentId}`"
              color="primary"
              icon="i-lucide-tag"
              label="Vendre mon exemplaire"
              class="font-bold rounded-xl"
            />
            <UButton
              v-if="data.game.slug"
              :to="`https://cwowd.fr/jeux/${data.game.slug}`"
              target="_blank"
              color="neutral"
              variant="soft"
              icon="i-lucide-external-link"
              label="Voir la fiche complète sur CWOWD"
              size="sm"
              class="rounded-xl"
            />
          </div>
        </div>

        <!-- Résumé des prix -->
        <div v-if="data.listings?.length > 0" class="w-full md:w-auto p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center shrink-0">
          <p class="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {{ data.listings.length }} offre{{ data.listings.length > 1 ? 's' : '' }} dès
          </p>
          <p class="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {{ Number(data.listings[0].price).toFixed(0) }} €
          </p>
        </div>
      </div>

      <!-- Liste des offres façon Okkazeo (mais moderne) -->
      <div class="space-y-4">
        <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-shopping-bag" class="w-5 h-5 text-emerald-600" />
          Exemplaires d'occasion disponibles ({{ data.listings?.length || 0 }})
        </h2>

        <div v-if="!data.listings || data.listings.length === 0" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-10 text-center space-y-3">
          <p class="text-slate-600 dark:text-slate-300 font-semibold">
            Aucun exemplaire de {{ gameTitle }} n'est en vente pour le moment.
          </p>
          <UButton
            :to="`/vendre?game=${data.game.slug || data.game.documentId}`"
            color="primary"
            variant="soft"
            icon="i-lucide-plus-circle"
            label="Mettre en vente le vôtre"
          />
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="listing in data.listings"
            :key="listing.documentId"
            class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-emerald-500/50 transition-all"
          >
            <!-- Colonne 1 : Prix & État -->
            <div class="flex items-start sm:items-center gap-4">
              <div class="text-center px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shrink-0 min-w-[90px]">
                <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {{ Number(listing.price).toFixed(0) }} €
                </span>
                <div v-if="listing.status === 'reserved'" class="text-[10px] font-bold uppercase text-amber-500 mt-0.5">
                  Réservé
                </div>
              </div>

              <div class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800">
                    {{ getLang(listing.language_code).flag }} {{ getLang(listing.language_code).label }}
                  </span>
                  <UBadge :color="(getCondBox(listing.condition_box).color as any)" variant="subtle" size="sm">
                    Boîte : {{ getCondBox(listing.condition_box).label }}
                  </UBadge>
                  <span class="text-xs text-slate-500">
                    • Matériel : {{ getCondComp(listing.condition_components) }}
                  </span>
                </div>

                <p v-if="listing.edition" class="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Édition : {{ listing.edition.nom_fr || listing.edition.nom_edition }}
                  <span v-if="listing.edition.annee_publication">({{ listing.edition.annee_publication }})</span>
                </p>

                <p v-if="listing.description" class="text-sm text-slate-700 dark:text-slate-300 pt-1">
                  {{ listing.description }}
                </p>
              </div>
            </div>

            <!-- Colonne 2 : Infos Vendeur, Lot & Contact -->
            <div class="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center justify-between gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <NuxtLink
                    v-if="listing.seller?.username"
                    :to="`/vendeur/${encodeURIComponent(listing.seller.username)}`"
                    class="font-bold text-slate-900 dark:text-white hover:text-emerald-600 flex items-center gap-1.5"
                  >
                    <UIcon name="i-lucide-user-check" class="w-4 h-4 text-emerald-600" />
                    {{ listing.sellerProfile?.display_name || listing.seller.username }}
                  </NuxtLink>
                  <span v-if="listing.sellerProfile?.rating_count > 0" class="text-xs font-bold text-amber-500">
                    ★ {{ Number(listing.sellerProfile.rating_average).toFixed(1) }} ({{ listing.sellerProfile.rating_count }})
                  </span>
                  <CwowdBadge
                    v-if="listing.sellerProfile?.is_cwowd_member || listing.seller?.provider === 'discourse'"
                    :username="listing.sellerProfile?.cwowd_username || listing.seller?.username"
                    link-to-forum
                  />
                </div>

                <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span v-if="listing.delivery_hand && listing.location_city" class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-map-pin" class="w-3.5 h-3.5 text-slate-400" />
                    Main propre : <strong>{{ listing.location_city }}</strong>
                  </span>
                  <span v-if="listing.delivery_shipping" class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <UIcon name="i-lucide-package" class="w-3.5 h-3.5" />
                    Envoi possible
                  </span>
                </div>

                <!-- Lien direct pour faire un lot chez ce vendeur -->
                <div v-if="listing.sellerTotalActiveListings > 1 && listing.seller?.username" class="pt-0.5">
                  <NuxtLink
                    :to="`/vendeur/${encodeURIComponent(listing.seller.username)}`"
                    class="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <UIcon name="i-lucide-layers" class="w-3.5 h-3.5" />
                    Voir les {{ listing.sellerTotalActiveListings - 1 }} autre(s) jeu(x) de ce vendeur (créer un lot) →
                  </NuxtLink>
                </div>
              </div>

              <UButton
                color="primary"
                icon="i-lucide-message-square"
                label="Contacter"
                class="font-bold rounded-xl w-full sm:w-auto"
                :disabled="listing.status === 'reserved'"
                @click="openContactModal(listing)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <ContactSellerModal
      v-if="activeContactListing"
      v-model:open="contactModalOpen"
      :seller-id="activeContactListing.seller?.id"
      :seller-name="activeContactListing.sellerProfile?.display_name || activeContactListing.seller?.username"
      :listings="[{ ...activeContactListing, game: data?.game }]"
    />
  </div>
</template>

<script setup lang="ts">
import {
  CONDITION_BOX_LABELS,
  CONDITION_COMPONENTS_LABELS,
  LANGUAGE_LABELS,
  useMediaUrl,
} from '~/utils/marketplace';

const route = useRoute();
const router = useRouter();
const { isAuthenticated } = useAuth();
const getMediaUrl = useMediaUrl();

const slug = computed(() => route.params.slug as string);

const { data, pending } = await useFetch<any>(() => `/api/games/${slug.value}`);

const gameTitle = computed(() => data.value?.game?.nom_fr || data.value?.game?.nom || 'Jeu');
const gameCoverUrl = computed(() =>
  getMediaUrl(data.value?.game?.image_couverture?.url || data.value?.game?.cached_main_image_url)
);

const getCondBox = (c: string) => CONDITION_BOX_LABELS[c] || CONDITION_BOX_LABELS.like_new!;
const getCondComp = (c: string) => CONDITION_COMPONENTS_LABELS[c] || 'Complet';
const getLang = (l: string) => LANGUAGE_LABELS[l] || LANGUAGE_LABELS.VF!;

const contactModalOpen = ref(false);
const activeContactListing = ref<any | null>(null);

const openContactModal = (listing: any) => {
  if (!isAuthenticated.value) {
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
    return;
  }
  activeContactListing.value = listing;
  contactModalOpen.value = true;
};

useHead({
  title: computed(() => `${gameTitle.value} d'occasion`),
});
</script>
