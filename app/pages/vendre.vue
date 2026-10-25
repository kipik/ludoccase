<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <!-- En-tête -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Mettre un jeu en vente
        </h1>
        <p class="text-sm text-slate-500">
          Déposez votre annonce en quelques secondes — 0% de commission.
        </p>
      </div>
      <UButton
        color="primary"
        variant="soft"
        icon="i-lucide-barcode"
        label="Scanner le code-barres (EAN)"
        class="font-bold rounded-xl self-start"
        @click="scannerOpen = true"
      />
    </div>

    <UCard class="rounded-3xl shadow-sm border-slate-200/80 dark:border-slate-800">
      <form class="space-y-6" @submit.prevent="publishListing">
        <!-- ÉTAPE 1 : Choix du jeu -->
        <div class="space-y-3">
          <label class="block text-sm font-bold text-slate-800 dark:text-slate-200">
            1. Quel jeu vendez-vous ? *
          </label>

          <!-- Si un jeu est déjà sélectionné -->
          <div
            v-if="selectedGame"
            class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4"
          >
            <div class="flex items-center gap-3.5 min-w-0">
              <img
                v-if="getMediaUrl(selectedGame.image_couverture?.url)"
                :src="getMediaUrl(selectedGame.image_couverture?.url)!"
                class="w-14 h-14 rounded-xl object-cover bg-white shrink-0"
              />
              <div class="min-w-0">
                <p class="font-black text-lg text-slate-900 dark:text-white truncate">
                  {{ selectedGame.nom_fr || selectedGame.nom }}
                </p>
                <p v-if="selectedGame.annee_publication" class="text-xs text-slate-500">
                  Sortie initiale : {{ selectedGame.annee_publication }}
                </p>
              </div>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              label="Changer"
              size="xs"
              @click="clearGame"
            />
          </div>

          <!-- Sinon, barre de recherche du jeu -->
          <div v-else class="relative">
            <UInput
              v-model="gameSearch"
              placeholder="Tapez le nom du jeu (ex: Ark Nova, 7 Wonders Duel, Nemesis)..."
              icon="i-lucide-search"
              size="xl"
              class="w-full"
              @input="onSearchGame"
            />
            <div
              v-if="searchResults.length > 0"
              class="mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto"
            >
              <button
                v-for="g in searchResults"
                :key="g.documentId"
                type="button"
                class="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-emerald-50 dark:hover:bg-slate-800 text-left transition-colors"
                @click="selectGame(g)"
              >
                <img
                  v-if="getMediaUrl(g.image_couverture?.url)"
                  :src="getMediaUrl(g.image_couverture?.url)!"
                  class="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-slate-900 dark:text-white truncate">{{ g.nom_fr || g.nom }}</p>
                  <p class="text-xs text-slate-400">
                    <span v-if="g.annee_publication">{{ g.annee_publication }} • </span>
                    {{ g.editions?.length || 0 }} édition(s) référencée(s)
                  </p>
                </div>
                <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        <!-- ÉTAPE 2 : Édition & Langue -->
        <div v-if="selectedGame" class="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div v-if="selectedGame.editions?.length" class="space-y-2">
            <label class="block text-sm font-bold text-slate-800 dark:text-slate-200">
              2. Édition précise (optionnel)
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                v-for="ed in selectedGame.editions"
                :key="ed.documentId"
                type="button"
                class="p-3 rounded-xl border text-left flex items-center gap-3 transition-all"
                :class="
                  form.editionDocumentId === ed.documentId
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                "
                @click="form.editionDocumentId = form.editionDocumentId === ed.documentId ? '' : ed.documentId"
              >
                <img
                  v-if="getMediaUrl(ed.image_couverture?.url)"
                  :src="getMediaUrl(ed.image_couverture?.url)!"
                  class="w-10 h-10 rounded-lg object-cover shrink-0"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {{ ed.nom_fr || ed.nom_edition || 'Édition Standard' }}
                  </p>
                  <p class="text-[11px] text-slate-500">
                    <span v-if="ed.annee_publication">{{ ed.annee_publication }}</span>
                    <span v-if="ed.EAN" class="font-mono ml-1">• {{ ed.EAN }}</span>
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Langue du jeu *" name="language_code">
              <USelect v-model="form.language_code" :items="languageItems" size="lg" class="w-full" />
            </UFormField>

            <UFormField label="Prix de vente (€) *" name="price">
              <UInput
                v-model="form.price"
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 35"
                icon="i-lucide-euro"
                size="lg"
                class="w-full font-bold"
                required
              />
            </UFormField>
          </div>
        </div>

        <!-- ÉTAPE 3 : État & Remise -->
        <div v-if="selectedGame" class="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="État de la boîte *" name="condition_box">
              <USelect v-model="form.condition_box" :items="conditionBoxItems" size="lg" class="w-full" />
            </UFormField>

            <UFormField label="État du matériel *" name="condition_components">
              <USelect v-model="form.condition_components" :items="conditionCompItems" size="lg" class="w-full" />
            </UFormField>
          </div>

          <UFormField
            label="Précisions sur l'annonce (sleeves, extensions incluses, défaut éventuel...)"
            name="description"
          >
            <UTextarea
              v-model="form.description"
              :rows="3"
              placeholder="Ex: Cartes sleevées dès l'achat, joué 2 fois, remise en main propre sur Lyon ou envoi Mondial Relay soigné (papier bulle)."
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <div class="space-y-2">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Modes de remise acceptés</p>
              <UCheckbox v-model="form.delivery_hand" label="Remise en main propre" />
              <UCheckbox v-model="form.delivery_shipping" label="Expédition (Mondial Relay, Shop2Shop...)" />
            </div>

            <div class="space-y-2">
              <UFormField label="Ville (pour remise en main propre)" name="location_city">
                <UInput v-model="form.location_city" placeholder="Ex: Lyon 3e" icon="i-lucide-map-pin" class="w-full" />
              </UFormField>
              <UFormField label="Code postal" name="location_postal_code">
                <UInput v-model="form.location_postal_code" placeholder="Ex: 69003" class="w-full" />
              </UFormField>
            </div>
          </div>

          <p v-if="errorMsg" class="text-sm text-red-500 font-semibold text-center">{{ errorMsg }}</p>

          <div class="flex justify-end pt-2">
            <UButton
              type="submit"
              color="primary"
              size="xl"
              icon="i-lucide-check-circle"
              label="Publier mon annonce gratuitement"
              :loading="submitting"
              class="font-black rounded-xl"
            />
          </div>
        </div>
      </form>
    </UCard>

    <EanScannerModal v-model:open="scannerOpen" @found="onEanFound" />
  </div>
</template>

<script setup lang="ts">
import { useMediaUrl } from '~/utils/marketplace';

const { user, isAuthenticated } = useAuth();
const router = useRouter();
const route = useRoute();
const getMediaUrl = useMediaUrl();

const scannerOpen = ref(false);
const gameSearch = ref('');
const searchResults = ref<any[]>([]);
const selectedGame = ref<any | null>(null);
const submitting = ref(false);
const errorMsg = ref('');
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const form = reactive({
  editionDocumentId: '',
  language_code: 'VF',
  price: '',
  condition_box: 'like_new',
  condition_components: 'complete_like_new',
  description: '',
  delivery_hand: true,
  delivery_shipping: true,
  location_city: '',
  location_postal_code: '',
});

const languageItems = [
  { label: '🇫🇷 Français (VF)', value: 'VF' },
  { label: '🇬🇧 Anglais (VO)', value: 'VO_EN' },
  { label: '🇩🇪 Allemand', value: 'VO_DE' },
  { label: '🌍 Multilingue', value: 'MULTILINGUAL' },
  { label: '🎲 Indépendant de la langue', value: 'LANGUAGE_INDEPENDENT' },
];

const conditionBoxItems = [
  { label: 'Neuf sous blister (cello)', value: 'mint' },
  { label: 'Comme neuf (aucune trace)', value: 'like_new' },
  { label: 'Bon état (légères traces d\'usage)', value: 'good' },
  { label: 'Boîte abîmée / blanchie', value: 'fair' },
];

const conditionCompItems = [
  { label: 'Neuf non dépunché', value: 'mint' },
  { label: '100% Complet — Comme neuf', value: 'complete_like_new' },
  { label: '100% Complet — Bon état', value: 'complete_good' },
  { label: 'Pièce manquante (préciser en description)', value: 'missing_parts' },
];

onMounted(async () => {
  if (!isAuthenticated.value) {
    router.push('/login?redirect=/vendre');
    return;
  }
  if (user.value?.sellerProfile) {
    form.location_city = user.value.sellerProfile.city || '';
    form.location_postal_code = user.value.sellerProfile.postal_code || '';
  }

  // Pré-remplir si on arrive depuis une fiche jeu (?game=slug)
  const gameSlug = route.query.game as string;
  if (gameSlug) {
    try {
      const data: any = await $fetch(`/api/games/${gameSlug}`);
      if (data?.game) {
        selectGame(data.game);
      }
    } catch {}
  }
});

const onSearchGame = () => {
  if (searchTimer) clearTimeout(searchTimer);
  const q = gameSearch.value.trim();
  if (q.length < 2) {
    searchResults.value = [];
    return;
  }
  searchTimer = setTimeout(async () => {
    try {
      searchResults.value = await $fetch<any[]>('/api/games/search', { query: { q } });
    } catch {
      searchResults.value = [];
    }
  }, 250);
};

const selectGame = (game: any) => {
  selectedGame.value = game;
  searchResults.value = [];
  gameSearch.value = '';
};

const clearGame = () => {
  selectedGame.value = null;
  form.editionDocumentId = '';
};

const onEanFound = async ({ game, edition }: { game: any; edition: any }) => {
  // Charger toutes les éditions du jeu trouvé
  try {
    const fullData: any = await $fetch(`/api/games/${game.slug || game.documentId}`);
    selectedGame.value = fullData?.game || game;
  } catch {
    selectedGame.value = game;
  }
  if (edition?.documentId) {
    form.editionDocumentId = edition.documentId;
  }
};

const publishListing = async () => {
  if (!selectedGame.value || !form.price) return;
  submitting.value = true;
  errorMsg.value = '';

  try {
    await $fetch('/api/listings', {
      method: 'POST',
      body: {
        gameDocumentId: selectedGame.value.documentId,
        editionDocumentId: form.editionDocumentId || null,
        price: Number(form.price),
        condition_box: form.condition_box,
        condition_components: form.condition_components,
        language_code: form.language_code,
        description: form.description,
        delivery_hand: form.delivery_hand,
        delivery_shipping: form.delivery_shipping,
        location_city: form.location_city,
        location_postal_code: form.location_postal_code,
      },
    });

    await router.push(`/jeux/${selectedGame.value.slug || selectedGame.value.documentId}`);
  } catch (e: any) {
    errorMsg.value = e.data?.statusMessage || 'Erreur lors de la publication de l\'annonce';
  } finally {
    submitting.value = false;
  }
};

useHead({ title: 'Vendre un jeu' });
</script>
