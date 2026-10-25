<template>
  <div class="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4">
    <UCard class="w-full max-w-md rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800">
      <template #header>
        <div class="text-center space-y-1">
          <h1 class="text-2xl font-black text-slate-900 dark:text-white">Connexion à Ludoccase</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Ouvert à tous les joueurs — avec ou sans compte CWOWD.
          </p>
        </div>
      </template>

      <div class="space-y-5">
        <!-- Option 1 : SSO CWOWD (avec badge de confiance) -->
        <div class="p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
              <UIcon name="i-lucide-shield-check" class="w-4 h-4" />
              Membre du forum CWOWD ?
            </span>
            <span class="text-[11px] text-slate-500">Badge vérifié automatique</span>
          </div>
          <UButton
            to="/api/auth/discourse/connect"
            external
            color="warning"
            variant="solid"
            size="lg"
            block
            icon="i-lucide-message-square"
            class="font-bold rounded-xl"
          >
            Se connecter avec CWOWD
          </UButton>
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">Ou avec votre email</span>
          </div>
        </div>

        <!-- Option 2 : Connexion classique Email / Pseudo -->
        <form class="space-y-4" @submit.prevent="handleLogin">
          <UFormField label="Email ou pseudo" name="identifier">
            <UInput
              v-model="form.identifier"
              placeholder="votre@email.com ou pseudo"
              icon="i-lucide-user"
              size="lg"
              class="w-full"
              required
            />
          </UFormField>

          <UFormField label="Mot de passe" name="password">
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
              required
            />
          </UFormField>

          <p v-if="error" class="text-xs text-red-500 font-medium text-center">{{ error }}</p>

          <UButton
            type="submit"
            color="primary"
            size="lg"
            block
            :loading="loading"
            class="font-bold rounded-xl"
          >
            Se connecter
          </UButton>
        </form>
      </div>

      <template #footer>
        <div class="text-center text-sm text-slate-500">
          Nouveau sur Ludoccase ?
          <NuxtLink to="/register" class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline ml-1">
            Créer un compte gratuit
          </NuxtLink>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { login, loading, isAuthenticated } = useAuth();
const router = useRouter();
const route = useRoute();

const form = reactive({
  identifier: '',
  password: '',
});
const error = ref('');

onMounted(() => {
  if (isAuthenticated.value) {
    router.push((route.query.redirect as string) || '/');
  }
});

const handleLogin = async () => {
  error.value = '';
  const res = await login(form.identifier, form.password);
  if (res.success) {
    router.push((route.query.redirect as string) || '/');
  } else {
    error.value = res.error || 'Erreur de connexion';
  }
};

useHead({ title: 'Connexion' });
</script>
