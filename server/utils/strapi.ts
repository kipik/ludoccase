import { H3Event, getCookie, getHeader, createError } from 'h3';

export const getStrapiBaseUrl = () => {
  const config = useRuntimeConfig();
  return process.env.STRAPI_INTERNAL_URL || config.public.strapiUrl || 'http://127.0.0.1:1337';
};

export const getStrapiAdminHeaders = (userToken?: string | null) => {
  const config = useRuntimeConfig();
  const bearer = config.strapiToken || userToken || '';
  return {
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    'Content-Type': 'application/json',
  };
};

export const requireAuthUser = async (event: H3Event) => {
  const authHeader = getHeader(event, 'Authorization');
  const cookieToken = getCookie(event, 'strapi_jwt');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Authentification requise' });
  }

  const strapiUrl = getStrapiBaseUrl();
  try {
    const user: any = await $fetch(`${strapiUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!user || !user.id) {
      throw createError({ statusCode: 401, statusMessage: 'Utilisateur invalide' });
    }

    return { user, token };
  } catch (err) {
    throw createError({ statusCode: 401, statusMessage: 'Session expirée ou invalide' });
  }
};

export const ensureSellerProfile = async (
  user: { id: number; username: string; provider?: string },
  userToken?: string | null
) => {
  const strapiUrl = getStrapiBaseUrl();
  // On essaie d'abord avec le token utilisateur (puisque Authenticated a les droits) puis fallback sur strapiToken
  const headers = userToken
    ? { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' }
    : getStrapiAdminHeaders();

  const existingRes: any = await $fetch(`${strapiUrl}/api/seller-profiles`, {
    headers,
    query: {
      'filters[user][id][$eq]': user.id,
      'pagination[limit]': 1,
    },
  }).catch(() => ({ data: [] }));

  if (existingRes?.data?.length > 0) {
    return existingRes.data[0];
  }

  const isCwowd = user.provider === 'discourse';
  try {
    const createdRes: any = await $fetch(`${strapiUrl}/api/seller-profiles`, {
      method: 'POST',
      headers,
      body: {
        data: {
          user: user.id,
          display_name: user.username,
          is_cwowd_member: isCwowd,
          cwowd_username: isCwowd ? user.username : null,
        },
      },
    });
    return createdRes?.data;
  } catch (e) {
    console.warn('[ensureSellerProfile] Impossible de créer le profil avec ce token, essai avec AdminToken...');
    const adminRes: any = await $fetch(`${strapiUrl}/api/seller-profiles`, {
      method: 'POST',
      headers: getStrapiAdminHeaders(),
      body: {
        data: {
          user: user.id,
          display_name: user.username,
          is_cwowd_member: isCwowd,
          cwowd_username: isCwowd ? user.username : null,
        },
      },
    }).catch(() => null);
    return adminRes?.data || null;
  }
};
