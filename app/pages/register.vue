<template>
  <div class="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4">
    <UCard class="w-full max-w-md rounded-2xl shadow-lg border-slate-200/80 dark:border-slate-800">
      <template #header>
        <div class="text-center space-y-1">
          <h1 class="text-2xl font-black text-slate-900 dark:text-white">Créer un compte Ludoccase</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            100% gratuit • Aucune commission sur vos ventes et achats.
          </p>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <UFormField label="Pseudo public" name="username" required>
          <UInput
            v-model="form.username"
            placeholder="Ex: Meeple69"
            icon="i-lucide-user"
            size="lg"
            class="w-full"
            required
          />
        </UFormField>

        <UFormField label="Adresse email" name="email" required>
          <UInput
            v-model="form.email"
            type="email"
            placeholder="votre@email.com"
            icon="i-lucide-mail"
            size="lg"
            class="w-full"
            required
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Ville (remise en main propre)" name="city">
            <UInput v-model="form.city" placeholder="Ex: Lyon" icon="i-lucide-map-pin" class="w-full" />
          </UFormField>
          <UFormField label="Code postal" name="postal_code">
            <UInput v-model="form.postal_code" placeholder="Ex: 69003" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Mot de passe (6 caractères min.)" name="password" required>
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
          Créer mon compte
        </UButton>
      </form>

      <template #footer>
        <div class="text-center text-sm text-slate-500">
          Déjà inscrit ou membre CWOWD ?
          <NuxtLink to="/login" class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline ml-1">
            Se connecter
          </NuxtLink>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { register, loading } = useAuth();
const router = useRouter();

const form = reactive({
  username: '',
  email: '',
  city: '',
  postal_code: '',
  password: '',
});
const error = ref('');

const handleRegister = async () => {
  error.value = '';
  if (form.password.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caractères';
    return;
  }
  const res = await register(form);
  if (res.success) {
    router.push('/');
  } else {
    error.value = res.error || 'Erreur lors de la création du compte';
  }
};

useHead({ title: 'Créer un compte' });
</script>
