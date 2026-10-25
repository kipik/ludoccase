import { defineEventHandler } from 'h3';
import { requireAuthUser, getStrapiBaseUrl } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const { user, token } = await requireAuthUser(event);
  const strapiUrl = getStrapiBaseUrl();
  const userHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const gamesRes: any = await $fetch(`${strapiUrl}/api/games`, {
    headers: userHeaders,
    query: {
      'filters[for_sale_by][id][$eq]': user.id,
      'populate[0]': 'image_couverture',
      'pagination[limit]': 500,
    },
  }).catch(() => ({ data: [] }));

  const games = gamesRes?.data || [];
  if (games.length === 0) return [];

  const [userDatasRes, existingListingsRes]: any = await Promise.all([
    $fetch(`${strapiUrl}/api/user-game-datas`, {
      headers: userHeaders,
      query: {
        'filters[user][id][$eq]': user.id,
        'populate': '*',
        'pagination[limit]': 500,
      },
    }).catch(() => ({ data: [] })),
    $fetch(`${strapiUrl}/api/marketplace-listings`, {
      headers: userHeaders,
      query: {
        'filters[seller][id][$eq]': user.id,
        'filters[status][$in][0]': 'active',
        'filters[status][$in][1]': 'reserved',
        'populate[0]': 'game',
        'pagination[limit]': 500,
      },
    }).catch(() => ({ data: [] })),
  ]);

  const userDatas = userDatasRes?.data || [];
  const existingGameDocIds = new Set(
    (existingListingsRes?.data || []).map((l: any) => l.game?.documentId).filter(Boolean)
  );

  return games.map((game: any) => {
    const ud = userDatas.find((u: any) => u.game?.documentId === game.documentId);
    return {
      ...game,
      cwowdPrice: ud?.prix || null,
      cwowdNotes: ud?.notes || '',
      cwowdEdition: ud?.edition || null,
      alreadyListed: existingGameDocIds.has(game.documentId),
    };
  });
});
