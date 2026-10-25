<template>
  <UApp>
    <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <!-- Top Navbar -->
      <header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <!-- Brand Logo -->
          <NuxtLink to="/" class="flex items-center gap-2.5 shrink-0">
            <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
              <UIcon name="i-lucide-dices" class="w-5 h-5" />
            </div>
            <div class="flex flex-col">
              <span class="text-xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
                Lud<span class="text-emerald-600 dark:text-emerald-400">occase</span>
              </span>
              <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-400 leading-tight">
                0% commission
              </span>
            </div>
          </NuxtLink>

          <!-- Navigation Links -->
          <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <NuxtLink to="/" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" active-class="text-emerald-600 dark:text-emerald-400">
              Annonces récentes
            </NuxtLink>
            <NuxtLink to="/vendre" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" active-class="text-emerald-600 dark:text-emerald-400">
              Vendre un jeu
            </NuxtLink>
          </nav>

          <!-- Right Actions -->
          <div class="flex items-center gap-2 sm:gap-3">
            <UButton
              to="/vendre"
              color="primary"
              icon="i-lucide-plus-circle"
              label="Vendre un jeu"
              size="sm"
              class="font-bold rounded-xl shadow-sm"
            />

            <UColorModeButton size="sm" />

            <ClientOnly>
              <template v-if="isAuthenticated">
                <UButton
                  to="/messages"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-message-square"
                  size="sm"
                  class="relative"
                  aria-label="Messagerie"
                />
                <UDropdownMenu :items="userMenuItems">
                  <UButton
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-user"
                    :label="user?.username"
                    size="sm"
                    class="font-bold rounded-xl"
                  />
                </UDropdownMenu>
              </template>
              <template v-else>
                <UButton
                  :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`"
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-log-in"
                  label="Connexion"
                  size="sm"
                  class="font-semibold rounded-xl"
                />
              </template>
            </ClientOnly>
          </div>
        </div>
      </header>

      <!-- Main Page Content -->
      <main class="flex-1">
        <NuxtPage />
      </main>

      <!-- Footer -->
      <footer class="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 mt-16">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-200">Ludoccase</span>
            <span>— Plateforme libre & 100% gratuite de jeux de société d'occasion.</span>
          </div>
          <div class="flex items-center gap-4">
            <span>Catalogue propulsé par la base communautaire <a href="https://cwowd.fr" target="_blank" class="text-emerald-600 hover:underline font-semibold">CWOWD</a></span>
          </div>
        </div>
      </footer>
    </div>
  </UApp>
</template>

<script setup lang="ts">
const route = useRoute();
const { isAuthenticated, user, logout } = useAuth();

const userMenuItems = computed(() => [
  [
    {
      label: 'Ma vitrine publique',
      icon: 'i-lucide-store',
      to: user.value?.username ? `/vendeur/${encodeURIComponent(user.value.username)}` : '/profil',
    },
    {
      label: 'Mes annonces & Profil',
      icon: 'i-lucide-settings',
      to: '/profil',
    },
    {
      label: 'Ma messagerie',
      icon: 'i-lucide-message-square',
      to: '/messages',
    },
  ],
  [
    {
      label: 'Déconnexion',
      icon: 'i-lucide-log-out',
      onSelect: () => logout(),
    },
  ],
]);
</script>
