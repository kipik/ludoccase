<template>
  <UModal v-model:open="isOpen" :title="listings.length > 1 ? `Contacter ${sellerName} pour un lot (${listings.length} jeux)` : `Contacter ${sellerName}`">
    <template #body>
      <form class="space-y-4" @submit.prevent="submitContact">
        <!-- Récapitulatif des jeux sélectionnés -->
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>{{ listings.length > 1 ? 'Jeux inclus dans votre demande de lot' : 'Jeu concerné' }}</span>
            <span class="text-emerald-600 dark:text-emerald-400 text-sm">Total affiché : {{ totalPrice }} €</span>
          </div>
          <ul class="space-y-1 text-sm">
            <li v-for="item in listings" :key="item.documentId" class="flex items-center justify-between text-slate-700 dark:text-slate-200">
              <span class="truncate">• {{ item.game?.nom_fr || item.game?.nom || 'Jeu' }}</span>
              <span class="font-semibold shrink-0 ml-2">{{ Number(item.price).toFixed(0) }} €</span>
            </li>
          </ul>
        </div>

        <UFormField label="Proposer un prix global (optionnel, ex: pour un lot)" name="offeredPrice">
          <UInput
            v-model="offeredPrice"
            type="number"
            min="1"
            step="1"
            :placeholder="`Prix affiché : ${totalPrice} €`"
            icon="i-lucide-euro"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Votre message" name="message" required>
          <UTextarea
            v-model="message"
            :rows="4"
            placeholder="Bonjour ! Votre jeu est-il toujours disponible ? Remise en main propre ou envoi Mondial Relay possible ?"
            class="w-full"
            required
          />
        </UFormField>

        <p v-if="errorMsg" class="text-xs text-red-500 font-medium">{{ errorMsg }}</p>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" label="Annuler" @click="isOpen = false" />
          <UButton type="submit" color="primary" icon="i-lucide-send" label="Envoyer le message" :loading="sending" />
        </div>
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  sellerId: number;
  sellerName: string;
  listings: Record<string, any>[];
}>();

const router = useRouter();
const message = ref('');
const offeredPrice = ref<string | number>('');
const sending = ref(false);
const errorMsg = ref('');

const totalPrice = computed(() =>
  props.listings.reduce((sum, l) => sum + Number(l.price || 0), 0)
);

watch(isOpen, (open) => {
  if (open) {
    errorMsg.value = '';
    if (props.listings.length > 1) {
      message.value = `Bonjour ${props.sellerName}, je suis intéressé par ce lot de ${props.listings.length} jeux. Serait-il toujours disponible ?`;
    } else if (props.listings.length === 1) {
      const gName = props.listings[0]?.game?.nom_fr || props.listings[0]?.game?.nom || 'votre jeu';
      message.value = `Bonjour ${props.sellerName}, votre exemplaire de ${gName} est-il toujours disponible ?`;
    }
  }
});

const submitContact = async () => {
  if (!message.value.trim()) return;
  sending.value = true;
  errorMsg.value = '';
  try {
    const conv: any = await $fetch('/api/conversations', {
      method: 'POST',
      body: {
        sellerId: props.sellerId,
        listingDocumentIds: props.listings.map((l) => l.documentId),
        offeredPrice: offeredPrice.value ? Number(offeredPrice.value) : null,
        message: message.value,
      },
    });
    isOpen.value = false;
    await router.push(`/messages/${conv.documentId}`);
  } catch (e: any) {
    errorMsg.value = e.data?.statusMessage || 'Erreur lors de l\'envoi du message';
  } finally {
    sending.value = false;
  }
};
</script>
