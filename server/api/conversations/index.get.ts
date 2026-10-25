import { defineEventHandler } from 'h3';
import { requireAuthUser, getStrapiBaseUrl } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const { user, token } = await requireAuthUser(event);
  const strapiUrl = getStrapiBaseUrl();
  const userHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const res: any = await $fetch(`${strapiUrl}/api/marketplace-conversations`, {
    headers: userHeaders,
    query: {
      'filters[$or][0][buyer][id][$eq]': user.id,
      'filters[$or][1][seller][id][$eq]': user.id,
      'populate[0]': 'buyer',
      'populate[1]': 'seller',
      'populate[2]': 'listings.game.image_couverture',
      'sort[0]': 'last_message_at:desc',
      'pagination[limit]': 50,
    },
  }).catch(() => ({ data: [] }));

  return res?.data || [];
});
