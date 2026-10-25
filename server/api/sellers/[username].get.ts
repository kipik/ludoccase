import { defineEventHandler, getRouterParam, getCookie, createError } from 'h3';
import { getStrapiBaseUrl, getStrapiAdminHeaders, ensureSellerProfile } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const username = decodeURIComponent(getRouterParam(event, 'username') || '');
  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'Nom d\'utilisateur requis' });
  }

  const strapiUrl = getStrapiBaseUrl();
  const token = getCookie(event, 'strapi_jwt');
  const fallbackHeaders = getStrapiAdminHeaders(token);

  const users: any[] = await $fetch(`${strapiUrl}/api/users`, {
    query: {
      'filters[username][$eqi]': username,
      'pagination[limit]': 1,
    },
  }).catch(() =>
    $fetch(`${strapiUrl}/api/users`, {
      headers: fallbackHeaders,
      query: {
        'filters[username][$eqi]': username,
        'pagination[limit]': 1,
      },
    }).catch(() => [])
  );

  const targetUser = users?.[0];
  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'Vendeur introuvable' });
  }

  const [sellerProfile, listingsRes, reviewsRes]: any = await Promise.all([
    ensureSellerProfile(targetUser, token).catch(() => null),
    $fetch(`${strapiUrl}/api/marketplace-listings`, {
      query: {
        'filters[seller][id][$eq]': targetUser.id,
        'filters[status][$in][0]': 'active',
        'filters[status][$in][1]': 'reserved',
        'populate[0]': 'game.image_couverture',
        'populate[1]': 'edition.image_couverture',
        'populate[2]': 'photos',
        'sort[0]': 'createdAt:desc',
        'pagination[limit]': 100,
      },
    }).catch(() => ({ data: [] })),
    $fetch(`${strapiUrl}/api/marketplace-reviews`, {
      query: {
        'filters[target_user][id][$eq]': targetUser.id,
        'populate[0]': 'reviewer',
        'sort[0]': 'createdAt:desc',
        'pagination[limit]': 50,
      },
    }).catch(() => ({ data: [] })),
  ]);

  return {
    seller: {
      id: targetUser.id,
      username: targetUser.username,
      createdAt: targetUser.createdAt,
      provider: targetUser.provider,
    },
    sellerProfile,
    listings: listingsRes?.data || [],
    reviews: reviewsRes?.data || [],
  };
});
