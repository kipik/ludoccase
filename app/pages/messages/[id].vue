<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
    <div v-if="pending" class="h-96 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse" />

    <template v-else-if="data?.conversation">
      <!-- En-tête de la conversation : Jeux concernés + Actions vendeur -->
      <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <UButton to="/messages" color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" />
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-lg font-black text-slate-900 dark:text-white">
                  Discussion avec
                  <NuxtLink :to="`/vendeur/${encodeURIComponent(otherUser?.username || '')}`" class="text-emerald-600 hover:underline">
                    {{ otherUser?.username }}
                  </NuxtLink>
                </h1>
                <UBadge v-if="data.conversation.status === 'deal_agreed'" color="warning" size="sm">Réservé</UBadge>
                <UBadge v-else-if="data.conversation.status === 'completed'" color="success" size="sm">Transaction conclue</UBadge>
              </div>
              <p class="text-xs text-slate-500">
                Total affiché : <strong>{{ listingsTotal }} €</strong>
                <span v-if="data.conversation.offered_price" class="ml-2 text-indigo-600 dark:text-indigo-400 font-bold">
                  • Offre proposée : {{ data.conversation.offered_price }} €
                </span>
              </p>
            </div>
          </div>

          <!-- Boutons de gestion côté Vendeur -->
          <div v-if="isSeller" class="flex flex-wrap items-center gap-2">
            <UButton
              v-if="data.conversation.status === 'open'"
              color="warning"
              variant="soft"
              size="sm"
              icon="i-lucide-bookmark"
              label="Marquer réservé"
              :loading="updatingStatus"
              @click="changeStatus('deal_agreed')"
            />
            <UButton
              v-if="data.conversation.status !== 'completed'"
              color="primary"
              size="sm"
              icon="i-lucide-check-circle"
              label="Confirmer la vente"
              :loading="updatingStatus"
              @click="changeStatus('completed')"
            />
            <UButton
              v-if="data.conversation.status === 'deal_agreed'"
              color="neutral"
              variant="ghost"
              size="sm"
              label="Remettre en vente"
              :loading="updatingStatus"
              @click="changeStatus('open')"
            />
          </div>
        </div>

        <!-- Rappel visuel des jeux du lot -->
        <div class="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <NuxtLink
            v-for="l in data.conversation.listings"
            :key="l.documentId"
            :to="`/jeux/${l.game?.slug || l.game?.documentId}`"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs font-semibold hover:border-emerald-500"
          >
            <span>🎲 {{ l.game?.nom_fr || l.game?.nom }}</span>
            <span class="font-black text-emerald-600 dark:text-emerald-400">{{ Number(l.price).toFixed(0) }} €</span>
          </NuxtLink>
        </div>

        <!-- Bandeau d'évaluation mutuelle une fois la transaction conclue -->
        <div
          v-if="data.conversation.status === 'completed' && canLeaveReview"
          class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3"
        >
          <p class="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <UIcon name="i-lucide-star" class="w-4 h-4" />
            Évaluez votre transaction avec {{ otherUser?.username }}
          </p>
          <form class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center" @submit.prevent="submitReview">
            <div class="flex items-center gap-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="text-2xl transition-transform hover:scale-110"
                :class="star <= reviewForm.rating ? 'text-amber-500' : 'text-slate-300'"
                @click="reviewForm.rating = star"
              >
                ★
              </button>
            </div>
            <UInput
              v-model="reviewForm.comment"
              placeholder="Votre avis (ex: Envoi rapide, colis blindé, super contact !)"
              class="flex-1"
              required
            />
            <UButton type="submit" color="warning" label="Publier l'avis" :loading="submittingReview" class="font-bold" />
          </form>
        </div>
      </div>

      <!-- Fil de messages -->
      <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 max-h-[55vh] overflow-y-auto">
        <div
          v-for="msg in data.messages"
          :key="msg.documentId"
          class="flex"
          :class="msg.is_system ? 'justify-center' : msg.sender?.id === user?.id ? 'justify-end' : 'justify-start'"
        >
          <div
            v-if="msg.is_system"
            class="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center"
          >
            {{ msg.content }}
          </div>

          <div
            v-else
            class="max-w-[80%] rounded-2xl px-4 py-3 space-y-1"
            :class="
              msg.sender?.id === user?.id
                ? 'bg-emerald-600 text-white rounded-br-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
            "
          >
            <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
            <p
              class="text-[10px] opacity-70 text-right"
            >
              {{ new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Zone d'envoi de réponse -->
      <form class="flex gap-2" @submit.prevent="sendReply">
        <UTextarea
          v-model="replyText"
          :rows="2"
          placeholder="Écrivez votre message..."
          class="flex-1"
          @keydown.enter.exact.prevent="sendReply"
        />
        <UButton
          type="submit"
          color="primary"
          icon="i-lucide-send"
          label="Envoyer"
          size="xl"
          :loading="sending"
          class="font-bold rounded-2xl self-end"
        />
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { user } = useAuth();

const id = computed(() => route.params.id as string);
const { data, pending, refresh } = await useFetch<any>(() => `/api/conversations/${id.value}`);

const replyText = ref('');
const sending = ref(false);
const updatingStatus = ref(false);
const submittingReview = ref(false);

const reviewForm = reactive({
  rating: 5,
  comment: '',
});

const isSeller = computed(() => data.value?.conversation?.seller?.id === user.value?.id);
const isBuyer = computed(() => data.value?.conversation?.buyer?.id === user.value?.id);

const otherUser = computed(() =>
  isBuyer.value ? data.value?.conversation?.seller : data.value?.conversation?.buyer
);

const listingsTotal = computed(() =>
  (data.value?.conversation?.listings || []).reduce((sum: number, l: any) => sum + Number(l.price || 0), 0)
);

const canLeaveReview = computed(() => {
  const conv = data.value?.conversation;
  if (!conv) return false;
  if (isBuyer.value) return !conv.buyer_reviewed;
  if (isSeller.value) return !conv.seller_reviewed;
  return false;
});

const sendReply = async () => {
  if (!replyText.value.trim() || sending.value) return;
  sending.value = true;
  try {
    await $fetch(`/api/conversations/${id.value}/messages`, {
      method: 'POST',
      body: { content: replyText.value },
    });
    replyText.value = '';
    await refresh();
  } finally {
    sending.value = false;
  }
};

const changeStatus = async (status: string) => {
  updatingStatus.value = true;
  try {
    await $fetch(`/api/conversations/${id.value}/status`, {
      method: 'PATCH',
      body: { status },
    });
    await refresh();
  } finally {
    updatingStatus.value = false;
  }
};

const submitReview = async () => {
  submittingReview.value = true;
  try {
    await $fetch('/api/reviews', {
      method: 'POST',
      body: {
        conversationDocumentId: id.value,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      },
    });
    await refresh();
  } finally {
    submittingReview.value = false;
  }
};

useHead({ title: 'Discussion' });
</script>
