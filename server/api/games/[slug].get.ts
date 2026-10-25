import { defineEventHandler, getRouterParam, getCookie, createError } from 'h3';
import { getStrapiBaseUrl, getStrapiAdminHeaders } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug requis' });
  }

  const strapiUrl = getStrapiBaseUrl();
  const token = getCookie(event, 'strapi_jwt');
  const fallbackHeaders = getStrapiAdminHeaders(token);

  const gameQuery = {
    'filters[$or][0][slug][$eq]': slug,
    'filters[$or][1][documentId][$eq]': slug,
    'populate[0]': 'image_couverture',
    'populate[1]': 'editions.image_couverture',
    'populate[2]': 'editions.langues',
    'pagination[limit]': 1,
  };

  const gameRes: any = await $fetch(`${strapiUrl}/api/games`, {
    query: gameQuery,
  }).catch(() =>
    $fetch(`${strapiUrl}/api/games`, {
      headers: fallbackHeaders,
      query: gameQuery,
    })
  );

  const game = gameRes?.data?.[0];
  if (!game) {
    throw createError({ statusCode: 404, statusMessage: 'Jeu introuvable' });
  }

  const listingsQuery = {
    'filters[game][documentId][$eq]': game.documentId,
    'filters[status][$in][0]': 'active',
    'filters[status][$in][1]': 'reserved',
    'populate[0]': 'seller',
    'populate[1]': 'edition',
    'populate[2]': 'photos',
    'sort[0]': 'price:asc',
    'pagination[limit]': 100,
  };

  const listingsRes: any = await $fetch(`${strapiUrl}/api/marketplace-listings`, {
    query: listingsQuery,
  }).catch(() =>
    $fetch(`${strapiUrl}/api/marketplace-listings`, {
      headers: fallbackHeaders,
      query: listingsQuery,
    }).catch(() => ({ data: [] }))
  );

  const listings = listingsRes?.data || [];

  const sellerIds = [...new Set(listings.map((l: any) => l.seller?.id).filter(Boolean))];
  const profilesByUserId: Record<number, any> = {};
  const countsByUserId: Record<number, number> = {};

  if (sellerIds.length > 0) {
    await Promise.all(
      sellerIds.map(async (uid: any) => {
        const [profRes, countRes]: any = await Promise.all([
          $fetch(`${strapiUrl}/api/seller-profiles`, {
            query: { 'filters[user][id][$eq]': uid, 'pagination[limit]': 1 },
          }).catch(() => ({ data: [] })),
          $fetch(`${strapiUrl}/api/marketplace-listings`, {
            query: {
              'filters[seller][id][$eq]': uid,
              'filters[status][$eq]': 'active',
              'pagination[pageSize]': 1,
            },
          }).catch(() => ({ meta: { pagination: { total: 1 } } })),
        ]);
        if (profRes?.data?.[0]) {
          profilesByUserId[uid] = profRes.data[0];
        }
        countsByUserId[uid] = countRes?.meta?.pagination?.total || 1;
      })
    );
  }

  const enrichedListings = listings.map((l: any) => ({
    ...l,
    sellerProfile: l.seller?.id ? profilesByUserId[l.seller.id] || null : null,
    sellerTotalActiveListings: l.seller?.id ? countsByUserId[l.seller.id] || 1 : 1,
  }));

  return {
    game,
    listings: enrichedListings,
  };
});
