import { ref, computed } from 'vue';

export const useAuth = () => {
  const token = useCookie('strapi_jwt', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  const user = useState<any>('ludoccase_user', () => null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  const fetchUser = async () => {
    if (!token.value) return null;

    try {
      const data = await $fetch('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });
      user.value = data;
      return data;
    } catch (e) {
      token.value = null;
      user.value = null;
      return null;
    }
  };

  const login = async (identifier: string, password: string) => {
    loading.value = true;
    try {
      const data: any = await $fetch('/api/auth/local', {
        method: 'POST',
        body: { identifier, password },
      });

      token.value = data.jwt;
      user.value = data.user;
      return { success: true };
    } catch (e: any) {
      return {
        success: false,
        error: e.data?.statusMessage || e.data?.message || 'Identifiants invalides',
      };
    } finally {
      loading.value = false;
    }
  };

  const register = async (payload: {
    username: string;
    email: string;
    password: string;
    city?: string;
    postal_code?: string;
  }) => {
    loading.value = true;
    try {
      const data: any = await $fetch('/api/auth/register', {
        method: 'POST',
        body: payload,
      });

      token.value = data.jwt;
      user.value = data.user;
      return { success: true };
    } catch (e: any) {
      return {
        success: false,
        error: e.data?.statusMessage || e.data?.message || 'Erreur lors de la création du compte',
      };
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    token.value = null;
    user.value = null;
    await navigateTo('/');
  };

  if (token.value && !user.value && import.meta.client) {
    fetchUser();
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
  };
};
