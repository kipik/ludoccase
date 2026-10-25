<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Ma Messagerie</h1>
        <p class="text-sm text-slate-500">Retrouvez vos discussions d'achat et de vente.</p>
      </div>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-24 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse" />
    </div>

    <div v-else-if="!conversations || conversations.length === 0" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
      <UIcon name="i-lucide-message-square" class="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
      <h2 class="text-lg font-bold text-slate-900 dark:text-white">Aucune conversation pour le moment</h2>
      <p class="text-xs text-slate-500">
        Lorsque vous contactez un vendeur ou qu'un acheteur vous écrit, vos échanges apparaissent ici.
      </p>
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="conv in conversations"
        :key="conv.documentId"
        :to="`/messages/${conv.documentId}`"
        class="block bg-white dark:bg-slate-900 rounded-2xl border p-4 hover:border-emerald-500/50 transition-all"
        :class="
          hasUnread(conv)
            ? 'border-emerald-500/60 bg-emerald-500/5'
            : 'border-slate-200/80 dark:border-slate-800'
        "
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-emerald-600 shrink-0">
              {{ getOtherUser(conv)?.username?.slice(0, 2).toUpperCase() || '??' }}
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900 dark:text-white">
                  {{ getOtherUser(conv)?.username || 'Utilisateur' }}
                </span>
                <UBadge :color="conv.buyer?.id === user?.id ? 'info' : 'primary'" variant="subtle" size="xs">
                  {{ conv.buyer?.id === user?.id ? 'Achat' : 'Vente' }}
                </UBadge>
                <UBadge v-if="conv.status === 'deal_agreed'" color="warning" size="xs">Réservé</UBadge>
                <UBadge v-else-if="conv.status === 'completed'" color="success" size="xs">Vendu</UBadge>
                <span
                  v-if="hasUnread(conv)"
                  class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black"
                >
                  Nouveau
                </span>
              </div>

              <p class="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5">
                Jeu(x) : {{ (conv.listings || []).map((l: any) => l.game?.nom_fr || l.game?.nom).join(', ') || 'Annonce' }}
              </p>

              <p class="text-xs text-slate-400 truncate mt-0.5">
                {{ conv.last_message_preview || 'Ouvrir la discussion' }}
              </p>
            </div>
          </div>

          <div class="text-right shrink-0">
            <p v-if="conv.last_message_at" class="text-[11px] text-slate-400">
              {{ new Date(conv.last_message_at).toLocaleDateString('fr-FR') }}
            </p>
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-slate-400 mt-1 ml-auto" />
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, isAuthenticated } = useAuth();
const router = useRouter();

onMounted(() => {
  if (!isAuthenticated.value) {
    router.push('/login?redirect=/messages');
  }
});

const { data: conversations, pending } = await useFetch<any[]>('/api/conversations');

const getOtherUser = (conv: any) => {
  if (conv.buyer?.id === user.value?.id) return conv.seller;
  return conv.buyer;
};

const hasUnread = (conv: any) => {
  if (conv.buyer?.id === user.value?.id) return (conv.buyer_unread_count || 0) > 0;
  return (conv.seller_unread_count || 0) > 0;
};

useHead({ title: 'Messagerie' });
</script>
