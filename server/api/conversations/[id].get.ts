import { defineEventHandler, getRouterParam, createError } from 'h3';
import { requireAuthUser, getStrapiBaseUrl } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const { user, token } = await requireAuthUser(event);
  const id = getRouterParam(event, 'id');
  const strapiUrl = getStrapiBaseUrl();
  const userHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const convRes: any = await $fetch(`${strapiUrl}/api/marketplace-conversations/${id}`, {
    headers: userHeaders,
    query: {
      'populate[0]': 'buyer',
      'populate[1]': 'seller',
      'populate[2]': 'listings.game.image_couverture',
    },
  }).catch(() => null);

  const conversation = convRes?.data;
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation introuvable' });
  }

  const isBuyer = conversation.buyer?.id === user.id;
  const isSeller = conversation.seller?.id === user.id;

  if (!isBuyer && !isSeller) {
    throw createError({ statusCode: 403, statusMessage: 'Accès refusé à cette conversation' });
  }

  if ((isBuyer && conversation.buyer_unread_count > 0) || (isSeller && conversation.seller_unread_count > 0)) {
    await $fetch(`${strapiUrl}/api/marketplace-conversations/${id}`, {
      method: 'PUT',
      headers: userHeaders,
      body: {
        data: isBuyer ? { buyer_unread_count: 0 } : { seller_unread_count: 0 },
      },
    }).catch(() => {});
  }

  const messagesRes: any = await $fetch(`${strapiUrl}/api/marketplace-messages`, {
    headers: userHeaders,
    query: {
      'filters[conversation][documentId][$eq]': id,
      'populate[0]': 'sender',
      'sort[0]': 'createdAt:asc',
      'pagination[limit]': 200,
    },
  }).catch(() => ({ data: [] }));

  return {
    conversation,
    messages: messagesRes?.data || [],
  };
});
