import { defineEventHandler, getCookie } from 'h3';
import { getStrapiBaseUrl, getStrapiAdminHeaders } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const q = ((query.q as string) || '').trim();
  const condition = query.condition as string;
  const language = query.language as string;
  const shippingOnly = query.shipping === 'true';
  const cwowdOnly = query.cwowd === 'true';
  const limit = Number(query.limit || 24);

  const strapiUrl = getStrapiBaseUrl();
  const token = getCookie(event, 'strapi_jwt');
  const publicHeaders = { 'Content-Type': 'application/json' };
  const fallbackHeaders = getStrapiAdminHeaders(token);

  const strapiQuery: Record<string, any> = {
    'filters[status][$eq]': 'active',
    'populate[0]': 'game.image_couverture',
    'populate[1]': 'edition.image_couverture',
    'populate[2]': 'seller',
    'populate[3]': 'photos',
    'sort[0]': 'createdAt:desc',
    'pagination[limit]': limit,
  };

  if (q) {
    strapiQuery['filters[$or][0][game][nom][$containsi]'] = q;
    strapiQuery['filters[$or][1][game][nom_fr][$containsi]'] = q;
    strapiQuery['filters[$or][2][location_city][$containsi]'] = q;
  }

  if (condition && condition !== 'all') {
    strapiQuery['filters[condition_box][$eq]'] = condition;
  }

  if (language && language !== 'all') {
    strapiQuery['filters[language_code][$eq]'] = language;
  }

  if (shippingOnly) {
    strapiQuery['filters[delivery_shipping][$eq]'] = true;
  }

  try {
    const res: any = await $fetch(`${strapiUrl}/api/marketplace-listings`, {
      headers: publicHeaders,
      query: strapiQuery,
    }).catch(() =>
      $fetch(`${strapiUrl}/api/marketplace-listings`, {
        headers: fallbackHeaders,
        query: strapiQuery,
      })
    );

    const listings = res?.data || [];

    const sellerIds = [...new Set(listings.map((l: any) => l.seller?.id).filter(Boolean))];
    const profilesByUserId: Record<number, any> = {};

    if (sellerIds.length > 0) {
      await Promise.all(
        sellerIds.map(async (uid: any) => {
          const profRes: any = await $fetch(`${strapiUrl}/api/seller-profiles`, {
            headers: publicHeaders,
            query: { 'filters[user][id][$eq]': uid, 'pagination[limit]': 1 },
          }).catch(() =>
            $fetch(`${strapiUrl}/api/seller-profiles`, {
              headers: fallbackHeaders,
              query: { 'filters[user][id][$eq]': uid, 'pagination[limit]': 1 },
            }).catch(() => ({ data: [] }))
          );
          if (profRes?.data?.[0]) {
            profilesByUserId[uid] = profRes.data[0];
          }
        })
      );
    }

    let enriched = listings.map((l: any) => ({
      ...l,
      sellerProfile: l.seller?.id ? profilesByUserId[l.seller.id] || null : null,
    }));

    if (cwowdOnly) {
      enriched = enriched.filter((l: any) => l.sellerProfile?.is_cwowd_member || l.seller?.provider === 'discourse');
    }

    return enriched;
  } catch (e) {
    console.error('[listings.get] Erreur:', e);
    return [];
  }
});
