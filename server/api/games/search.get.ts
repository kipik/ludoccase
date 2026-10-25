import { defineEventHandler, getQuery, getCookie } from 'h3';
import { getStrapiBaseUrl, getStrapiAdminHeaders } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const q = ((query.q as string) || '').trim();

  if (q.length < 2) {
    return [];
  }

  const strapiUrl = getStrapiBaseUrl();
  const token = getCookie(event, 'strapi_jwt');
  const queryParams = {
    'filters[$or][0][nom][$containsi]': q,
    'filters[$or][1][nom_fr][$containsi]': q,
    'populate[0]': 'image_couverture',
    'populate[1]': 'editions.image_couverture',
    'populate[2]': 'editions.langues',
    'pagination[limit]': 12,
  };

  try {
    const res: any = await $fetch(`${strapiUrl}/api/games`, {
      query: queryParams,
    }).catch(() =>
      $fetch(`${strapiUrl}/api/games`, {
        headers: getStrapiAdminHeaders(token),
        query: queryParams,
      })
    );

    return res?.data || [];
  } catch (e) {
    console.error('[games/search] Erreur:', e);
    return [];
  }
});
