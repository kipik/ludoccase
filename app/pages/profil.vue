<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Mon Espace Vendeur
        </h1>
        <p class="text-sm text-slate-500">
          Gérez vos annonces, votre vitrine et importez vos jeux depuis CWOWD.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="user?.username"
          :to="`/vendeur/${encodeURIComponent(user.username)}`"
          color="neutral"
          variant="soft"
          icon="i-lucide-external-link"
          label="Voir ma vitrine publique"
          class="rounded-xl font-bold"
        />
        <UButton
          to="/vendre"
          color="primary"
          icon="i-lucide-plus-circle"
          label="Nouvelle annonce"
          class="rounded-xl font-bold"
        />
      </div>
    </div>

    <!-- Section 1 : Paramètres de la vitrine vendeur -->
    <UCard class="rounded-3xl border-slate-200/80 dark:border-slate-800">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UIcon name="i-lucide-store" class="w-5 h-5 text-emerald-600" />
            Paramètres de ma vitrine & réductions sur les lots
          </h2>
          <CwowdBadge
            v-if="user?.sellerProfile?.is_cwowd_member || user?.provider === 'discourse'"
            :username="user?.sellerProfile?.cwowd_username || user?.username"
            link-to-forum
          />
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="saveProfile">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UFormField label="Nom affiché" name="display_name">
            <UInput v-model="settings.display_name" class="w-full" />
          </UFormField>
          <UFormField label="Ville (remise en main propre)" name="city">
            <UInput v-model="settings.city" placeholder="Ex: Lyon" icon="i-lucide-map-pin" class="w-full" />
          </UFormField>
          <UFormField label="Code postal" name="postal_code">
            <UInput v-model="settings.postal_code" placeholder="Ex: 69003" class="w-full" />
          </UFormField>
        </div>

        <UFormField
          label="Offre spéciale sur les lots (affiché en haut de votre vitrine)"
          name="lot_discount_info"
        >
          <UInput
            v-model="settings.lot_discount_info"
            placeholder="Ex: -10% à partir de 3 jeux achetés, ou frais de port offerts dès 80 € !"
            icon="i-lucide-layers"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Présentation / Conditions d'envoi" name="bio">
          <UTextarea
            v-model="settings.bio"
            :rows="2"
            placeholder="Ex: Jeux non-fumeur, envoi rapide sous 24h en carton blindé via Mondial Relay."
            class="w-full"
          />
        </UFormField>

        <div class="flex items-center justify-end gap-3">
          <span v-if="savedSuccess" class="text-xs font-bold text-emerald-600">
            ✓ Paramètres enregistrés
          </span>
          <UButton type="submit" color="primary" label="Enregistrer mes préférences" :loading="saving" class="font-bold rounded-xl" />
        </div>
      </form>
    </UCard>

    <!-- Section 2 : Import en 1 clic depuis la liste "À vendre" de cwowd.fr -->
    <UCard v-if="cwowdGames && cwowdGames.length > 0" class="rounded-3xl border-orange-500/30 bg-orange-500/5">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-orange-500" />
              Synchroniser ma liste « À vendre » depuis CWOWD ({{ cwowdGames.length }})
            </h2>
            <p class="text-xs text-slate-500">
              Nous avons détecté des jeux marqués « À vendre » sur votre profil cwowd.fr. Publiez-les en 1 clic sur Ludoccase !
            </p>
          </div>
        </div>
      </template>

      <div class="divide-y divide-slate-200/60 dark:divide-slate-800">
        <div
          v-for="g in cwowdGames"
          :key="g.documentId"
          class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3 min-w-0">
            <img
              v-if="getMediaUrl(g.image_couverture?.url)"
              :src="getMediaUrl(g.image_couverture?.url)!"
              class="w-11 h-11 rounded-lg object-cover bg-white shrink-0"
            />
            <div class="min-w-0">
              <p class="font-bold text-sm text-slate-900 dark:text-white truncate">{{ g.nom_fr || g.nom }}</p>
              <p class="text-xs text-slate-500 truncate">
                Prix CWOWD : <strong>{{ g.cwowdPrice ? `${g.cwowdPrice} €` : 'Non défini' }}</strong>
                <span v-if="g.cwowdNotes"> • {{ g.cwowdNotes }}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <UBadge v-if="g.alreadyListed" color="success" variant="subtle">Déjà en vente sur Ludoccase</UBadge>
            <UButton
              v-else
              color="primary"
              size="sm"
              icon="i-lucide-upload-cloud"
              :label="g.cwowdPrice ? `Publier à ${g.cwowdPrice} €` : 'Compléter et publier'"
              :loading="importingId === g.documentId"
              class="font-bold rounded-xl"
              @click="quickPublishFromCwowd(g)"
            />
          </div>
        </div>
      </div>
    </UCard>

    <!-- Section 3 : Mes annonces en cours -->
    <div class="space-y-4">
      <h2 class="text-xl font-black text-slate-900 dark:text-white">
        Mes annonces publiées ({{ myListings.length }})
      </h2>

      <div v-if="myListings.length === 0" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-500">
        Vous n'avez aucune annonce active pour le moment.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in myListings"
          :key="item.documentId"
          class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <img
              v-if="getMediaUrl(item.game?.image_couverture?.url)"
              :src="getMediaUrl(item.game?.image_couverture?.url)!"
              class="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
            />
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <NuxtLink :to="`/jeux/${item.game?.slug || item.game?.documentId}`" class="font-bold text-slate-900 dark:text-white hover:text-emerald-600 truncate">
                  {{ item.game?.nom_fr || item.game?.nom }}
                </NuxtLink>
                <span class="font-black text-emerald-600">{{ Number(item.price).toFixed(0) }} €</span>
                <UBadge :color="item.status === 'active' ? 'success' : item.status === 'reserved' ? 'warning' : 'neutral'" size="xs">
                  {{ item.status === 'active' ? 'En vente' : item.status === 'reserved' ? 'Réservé' : 'Vendu / Archivé' }}
                </UBadge>
              </div>
              <p class="text-xs text-slate-500 truncate mt-0.5">
                {{ item.description || 'Aucune description' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <UButton
              v-if="item.status === 'active'"
              color="warning"
              variant="soft"
              size="xs"
              label="Réserver"
              @click="updateListingStatus(item.documentId, 'reserved')"
            />
            <UButton
              v-if="item.status === 'reserved'"
              color="primary"
              variant="soft"
              size="xs"
              label="Remettre en vente"
              @click="updateListingStatus(item.documentId, 'active')"
            />
            <UButton
              v-if="item.status !== 'sold'"
              color="neutral"
              variant="outline"
              size="xs"
              label="Marquer vendu"
              @click="updateListingStatus(item.documentId, 'sold')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMediaUrl } from '~/utils/marketplace';

const { user, isAuthenticated, fetchUser } = useAuth();
const router = useRouter();
const getMediaUrl = useMediaUrl();

const saving = ref(false);
const savedSuccess = ref(false);
const importingId = ref<string | null>(null);

const settings = reactive({
  display_name: '',
  city: '',
  postal_code: '',
  lot_discount_info: '',
  bio: '',
});

const { data: cwowdGames, refresh: refreshCwowd } = await useFetch<any[]>('/api/profile/cwowd-for-sale', {
  lazy: true,
  server: false,
});

const { data: sellerData, refresh: refreshSeller } = await useFetch<any>(
  () => (user.value?.username ? `/api/sellers/${encodeURIComponent(user.value.username)}` : null),
  { lazy: true, server: false }
);

const myListings = computed(() => sellerData.value?.listings || []);

onMounted(async () => {
  if (!isAuthenticated.value) {
    router.push('/login?redirect=/profil');
    return;
  }
  await fetchUser();
  if (user.value) {
    const sp = user.value.sellerProfile || {};
    settings.display_name = sp.display_name || user.value.username || '';
    settings.city = sp.city || '';
    settings.postal_code = sp.postal_code || '';
    settings.lot_discount_info = sp.lot_discount_info || '';
    settings.bio = sp.bio || '';
  }
});

const saveProfile = async () => {
  saving.value = true;
  savedSuccess.value = false;
  try {
    await $fetch('/api/profile/settings', {
      method: 'PUT',
      body: settings,
    });
    await fetchUser();
    savedSuccess.value = true;
  } finally {
    saving.value = false;
  }
};

const quickPublishFromCwowd = async (g: any) => {
  if (!g.cwowdPrice) {
    router.push(`/vendre?game=${g.slug || g.documentId}`);
    return;
  }
  importingId.value = g.documentId;
  try {
    await $fetch('/api/listings', {
      method: 'POST',
      body: {
        gameDocumentId: g.documentId,
        editionDocumentId: g.cwowdEdition?.documentId || null,
        price: Number(g.cwowdPrice),
        condition_box: 'like_new',
        condition_components: 'complete_like_new',
        language_code: 'VF',
        description: g.cwowdNotes || '',
        delivery_hand: true,
        delivery_shipping: true,
        location_city: settings.city,
        location_postal_code: settings.postal_code,
      },
    });
    await Promise.all([refreshCwowd(), refreshSeller()]);
  } finally {
    importingId.value = null;
  }
};

const updateListingStatus = async (docId: string, status: string) => {
  await $fetch(`/api/listings/${docId}`, {
    method: 'PATCH',
    body: { status },
  });
  await refreshSeller();
};

useHead({ title: 'Mon Espace Vendeur' });
</script>
