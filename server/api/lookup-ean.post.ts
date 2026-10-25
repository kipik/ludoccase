import { defineEventHandler, readBody } from 'h3';
import { getStrapiBaseUrl, getStrapiAdminHeaders } from '../utils/strapi';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { ean } = body;

  if (!ean || !/^\d{12,13}$/.test(ean)) {
    return { found: false, error: 'EAN invalide — 12 ou 13 chiffres attendus.' };
  }

  const strapiUrl = getStrapiBaseUrl();

  try {
    const res: any = await $fetch(`${strapiUrl}/api/editions`, {
      headers: getStrapiAdminHeaders(),
      query: {
        'filters[EAN][$eq]': ean,
        'populate[0]': 'image_couverture',
        'populate[1]': 'langues',
        'populate[2]': 'jeu.image_couverture',
        'pagination[limit]': 1,
      },
    });

    const editions = res?.data || [];
    if (editions.length > 0) {
      const edition = editions[0];
      return {
        found: true,
        source: 'local',
        game: edition.jeu || null,
        edition,
      };
    }
  } catch (e) {
    console.warn('[lookup-ean] Erreur Strapi:', e);
  }

  return { found: false, ean };
});
