import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { requireAuthUser, getStrapiBaseUrl } from '../../../utils/strapi';

export default defineEventHandler(async (event) => {
  const { user, token } = await requireAuthUser(event);
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const { status } = body;

  if (!['open', 'deal_agreed', 'completed', 'cancelled'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Statut invalide' });
  }

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
      'populate[2]': 'listings',
    },
  }).catch(() => null);

  const conversation = convRes?.data;
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation introuvable' });
  }

  if (conversation.seller?.id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Seul le vendeur peut modifier le statut de la vente' });
  }

  const listingStatusMap: Record<string, string> = {
    open: 'active',
    deal_agreed: 'reserved',
    completed: 'sold',
    cancelled: 'active',
  };

  const targetListingStatus = listingStatusMap[status];
  if (targetListingStatus && Array.isArray(conversation.listings)) {
    await Promise.all(
      conversation.listings.map((l: any) =>
        $fetch(`${strapiUrl}/api/marketplace-listings/${l.documentId}`, {
          method: 'PUT',
          headers: userHeaders,
          body: { data: { status: targetListingStatus } },
        }).catch(() => {})
      )
    );
  }

  const statusLabels: Record<string, string> = {
    open: '🔄 Annonce(s) remise(s) en vente active.',
    deal_agreed: '🤝 Le vendeur a réservé le(s) jeu(x) pour cette transaction.',
    completed: '✅ Transaction marquée comme finalisée ! Vous pouvez maintenant vous laisser une évaluation mutuelle.',
    cancelled: '❌ La transaction a été annulée.',
  };

  await $fetch(`${strapiUrl}/api/marketplace-messages`, {
    method: 'POST',
    headers: userHeaders,
    body: {
      data: {
        conversation: id,
        sender: user.id,
        content: statusLabels[status] || `Statut mis à jour : ${status}`,
        is_system: true,
      },
    },
  }).catch(() => {});

  const updatedConv: any = await $fetch(`${strapiUrl}/api/marketplace-conversations/${id}`, {
    method: 'PUT',
    headers: userHeaders,
    body: {
      data: {
        status,
        last_message_preview: statusLabels[status],
        last_message_at: new Date().toISOString(),
        buyer_unread_count: (conversation.buyer_unread_count || 0) + 1,
      },
    },
  });

  return updatedConv?.data;
});
