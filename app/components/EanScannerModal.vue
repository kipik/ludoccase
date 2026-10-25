<template>
  <UModal v-model:open="isOpen" title="Scanner le code-barres de la boîte (EAN)">
    <template #body>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Code EAN (12 ou 13 chiffres au dos de la boîte)
          </label>
          <div class="flex gap-2">
            <UInput
              v-model="eanInput"
              placeholder="Ex: 3760175513428"
              class="flex-1 font-mono text-lg"
              size="lg"
              icon="i-lucide-barcode"
              inputmode="numeric"
              maxlength="13"
              @keyup.enter="lookup"
            />
            <UButton
              label="Chercher"
              icon="i-lucide-search"
              color="primary"
              size="lg"
              :loading="isLoading"
              :disabled="!isValidEan"
              @click="lookup"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            :label="isScannerActive ? 'Arrêter la caméra' : 'Utiliser la caméra'"
            :icon="isScannerActive ? 'i-lucide-square' : 'i-lucide-camera'"
            :color="isScannerActive ? 'error' : 'neutral'"
            variant="soft"
            size="sm"
            :disabled="!isCameraSupported"
            @click="toggleScanner"
          />
          <span v-if="!isCameraSupported" class="text-xs text-slate-400">
            Caméra non détectée sur cet appareil
          </span>
        </div>

        <div
          v-if="isScannerActive"
          class="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-500 shadow-lg"
        >
          <video ref="videoRef" autoplay playsinline muted class="w-full aspect-[4/3] object-cover" />
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              class="w-3/4 h-20 border-2 rounded-xl transition-colors"
              :class="scanDetected ? 'border-emerald-400 bg-emerald-400/20' : 'border-white/70 animate-pulse'"
            />
          </div>
        </div>

        <div v-if="notFound" class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-600 dark:text-amber-400">
          Aucune édition trouvée avec l'EAN <span class="font-mono font-bold">{{ eanInput }}</span>. Vous pouvez rechercher le jeu par son titre directement.
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  found: [payload: { game: any; edition: any }];
}>();

const eanInput = ref('');
const isLoading = ref(false);
const notFound = ref(false);

const videoRef = ref<HTMLVideoElement | null>(null);
const isScannerActive = ref(false);
const scanDetected = ref(false);
const isCameraSupported = ref(false);
let mediaStream: MediaStream | null = null;
let stopScanLoop: (() => void) | null = null;

const isValidEan = computed(() => /^\d{12,13}$/.test(eanInput.value.trim()));

onMounted(() => {
  isCameraSupported.value = !!navigator.mediaDevices?.getUserMedia;
});

watch(isOpen, (open) => {
  if (!open) {
    stopScanner();
    notFound.value = false;
  }
});

onBeforeUnmount(() => {
  stopScanner();
});

const toggleScanner = () => {
  if (isScannerActive.value) stopScanner();
  else startScanner();
};

const startScanner = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    isScannerActive.value = true;
    scanDetected.value = false;
    await nextTick();
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      await videoRef.value.play();
    }

    const { BarcodeDetector, setZXingModuleOverrides } = await import('barcode-detector/pure');
    setZXingModuleOverrides({
      locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? '/wasm/zxing_reader.wasm' : prefix + path),
    });

    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a'] });
    let active = true;
    stopScanLoop = () => {
      active = false;
    };

    const loop = async () => {
      if (!active || !isScannerActive.value || !videoRef.value) return;
      if (videoRef.value.readyState >= 2) {
        try {
          const codes = await detector.detect(videoRef.value);
          const raw = codes?.[0]?.rawValue;
          if (raw && /^\d{12,13}$/.test(raw)) {
            scanDetected.value = true;
            eanInput.value = raw;
            active = false;
            setTimeout(() => {
              stopScanner();
              lookup();
            }, 350);
            return;
          }
        } catch {}
      }
      if (active) setTimeout(() => requestAnimationFrame(loop), 200);
    };

    requestAnimationFrame(loop);
  } catch {
    stopScanner();
  }
};

const stopScanner = () => {
  stopScanLoop?.();
  stopScanLoop = null;
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  isScannerActive.value = false;
};

const lookup = async () => {
  if (!isValidEan.value) return;
  isLoading.value = true;
  notFound.value = false;
  try {
    const res: any = await $fetch('/api/lookup-ean', {
      method: 'POST',
      body: { ean: eanInput.value.trim() },
    });
    if (res?.found && res.game) {
      isOpen.value = false;
      emit('found', { game: res.game, edition: res.edition });
    } else {
      notFound.value = true;
    }
  } catch {
    notFound.value = true;
  } finally {
    isLoading.value = false;
  }
};
</script>
