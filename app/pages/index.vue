<template>
  <div class="space-y-8 pb-12">
    <!-- Hero / Search Banner -->
    <section class="bg-gradient-to-b from-emerald-950/95 via-slate-900 to-slate-900 text-white py-10 sm:py-14 px-4 border-b border-emerald-500/20">
      <div class="max-w-4xl mx-auto text-center space-y-5">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
          <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5" />
          <span>100% Gratuit • Sans commission • Mise en relation directe</span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-black tracking-tight">
          Achetez et vendez vos <span class="text-emerald-400">jeux de société</span> d'occasion
        </h1>
        <p class="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
          Catalogue structuré par jeu et par édition, création de lots pour réduire les frais de port, et profils vérifiés.
        </p>

        <!-- Barre de recherche instantanée (Jeu ou Annonce) -->
        <div class="relative max-w-2xl mx-auto pt-2">
          <div class="flex gap-2">
            <UInput
              v-model="searchQuery"
              placeholder="Rechercher un jeu (ex: Ark Nova, Brass, Dune Imperium) ou une ville..."
              icon="i-lucide-search"
              size="xl"
              class="flex-1"
              @input="onSearchInput"
              @keyup.enter="applyFilters"
            />
            <UButton
              color="primary"
              size="xl"
              icon="i-lucide-sliders-horizontal"
              label="Filtrer"
              class="font-bold rounded-xl"
              @click="applyFilters"
            />
          </div>

          <!-- Résultats rapides du catalogue de jeux -->
          <div
            v-if="gameSuggestions.length > 0 && showSuggestions"
            class="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-30 text-left"
          >
            <div class="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center">
              <span>Fiches Jeux du catalogue</span>
              <button class="text-slate-400 hover:text-slate-600" @click="showSuggestions = false">Fermer</button>
            </div>
            <NuxtLink
              v-for="g in gameSuggestions"
              :key="g.documentId"
              :to="`/jeux/${g.slug || g.documentId}`"
              class="flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800"
              @click="showSuggestions = false"
            >
              <div class="flex items-center gap-3 min-w-0">
                <img
                  v-if="getMediaUrl(g.image_couverture?.url)"
                  :src="getMediaUrl(g.image_couverture?.url)!"
                  class="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div class="truncate">
                  <p class="font-bold text-sm text-slate-900 dark:text-white truncate">{{ g.nom_fr || g.nom }}</p>
                  <p v-if="g.annee_publication" class="text-xs text-slate-400">{{ g.annee_publication }}</p>
                </div>
              </div>
              <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                Voir les annonces →
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Filtres & Liste des annonces -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
      <!-- Barre de filtres rapides -->
      <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <USelect
            v-model="filters.language"
            :items="languageOptions"
            size="sm"
            class="w-40"
            @change="applyFilters"
          />
          <USelect
            v-model="filters.condition"
            :items="conditionOptions"
            size="sm"
            class="w-44"
            @change="applyFilters"
          />
          <UCheckbox
            v-model="filters.shipping"
            label="Envoi possible"
            @change="applyFilters"
          />
          <UCheckbox
            v-model="filters.cwowd"
            label="Membres CWOWD vérifiés"
            @change="applyFilters"
          />
        </div>

        <div class="text-xs font-semibold text-slate-500">
          {{ listings?.length || 0 }} annonce{{ (listings?.length || 0) > 1 ? 's' : '' }} disponible{{ (listings?.length || 0) > 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Grille d'annonces -->
      <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="h-36 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse" />
      </div>

      <div v-else-if="!listings || listings.length === 0" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-4">
        <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
          <UIcon name="i-lucide-tag" class="w-8 h-8" />
        </div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Aucune annonce pour ces critères</h2>
        <p class="text-sm text-slate-500 max-w-md mx-auto">
          Soyez le premier à mettre en vente vos jeux de société gratuitement et sans commission !
        </p>
        <UButton to="/vendre" color="primary" icon="i-lucide-plus-circle" label="Déposer une annonce en 15 secondes" size="lg" class="font-bold rounded-xl" />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ListingCard v-for="item in listings" :key="item.documentId" :listing="item" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useMediaUrl } from '~/utils/marketplace';

const getMediaUrl = useMediaUrl();

const searchQuery = ref('');
const showSuggestions = ref(false);
const gameSuggestions = ref<any[]>([]);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const filters = reactive({
  language: 'all',
  condition: 'all',
  shipping: false,
  cwowd: false,
});

const languageOptions = [
  { label: 'Toutes les langues', value: 'all' },
  { label: '🇫🇷 Français (VF)', value: 'VF' },
  { label: '🇬🇧 Anglais (VO)', value: 'VO_EN' },
  { label: '🌍 Multilingue', value: 'MULTILINGUAL' },
  { label: '🎲 Sans texte', value: 'LANGUAGE_INDEPENDENT' },
];

const conditionOptions = [
  { label: 'Tous les états', value: 'all' },
  { label: 'Neuf sous blister', value: 'mint' },
  { label: 'Comme neuf', value: 'like_new' },
  { label: 'Bon état', value: 'good' },
  { label: 'Boîte usée', value: 'fair' },
];

const { data: listings, pending, refresh: applyFilters } = await useFetch<any[]>('/api/listings', {
  query: computed(() => ({
    q: searchQuery.value,
    language: filters.language,
    condition: filters.condition,
    shipping: filters.shipping ? 'true' : undefined,
    cwowd: filters.cwowd ? 'true' : undefined,
  })),
});

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer);
  const q = searchQuery.value.trim();
  if (q.length < 2) {
    gameSuggestions.value = [];
    showSuggestions.value = false;
    return;
  }
  searchTimer = setTimeout(async () => {
    try {
      const res = await $fetch<any[]>('/api/games/search', { query: { q } });
      gameSuggestions.value = res || [];
      showSuggestions.value = gameSuggestions.value.length > 0;
    } catch {
      gameSuggestions.value = [];
    }
  }, 250);
};

useHead({ title: 'Jeux de société d\'occasion sans commission' });
</script>
