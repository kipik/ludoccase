import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { requireAuthUser, getStrapiBaseUrl } from '../../../utils/strapi';
import { sendTransactionalEmail } from '../../../utils/email';

export default defineEventHandler(async (event) => {
  const { user, token } = await requireAuthUser(event);
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const config = useRuntimeConfig();

  const content = (body.content || '').trim();
  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'Message vide' });
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
    },
  }).catch(() => null);

  const conversation = convRes?.data;
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation introuvable' });
  }

  const isBuyer = conversation.buyer?.id === user.id;
  const isSeller = conversation.seller?.id === user.id;

  if (!isBuyer && !isSeller) {
    throw createError({ statusCode: 403, statusMessage: 'Accès refusé' });
  }

  // 1. Créer le message
  const msgRes: any = await $fetch(`${strapiUrl}/api/marketplace-messages`, {
    method: 'POST',
    headers: userHeaders,
    body: {
      data: {
        conversation: id,
        sender: user.id,
        content,
        is_system: false,
      },
    },
  });

  // 2. Mettre à jour la conversation
  const recipientUnreadBefore = isBuyer ? (conversation.seller_unread_count || 0) : (conversation.buyer_unread_count || 0);
  const updateData: Record<string, any> = {
    last_message_preview: content.slice(0, 140),
    last_message_at: new Date().toISOString(),
  };

  if (isBuyer) {
    updateData.seller_unread_count = recipientUnreadBefore + 1;
  } else {
    updateData.buyer_unread_count = recipientUnreadBefore + 1;
  }

  await $fetch(`${strapiUrl}/api/marketplace-conversations/${id}`, {
    method: 'PUT',
    headers: userHeaders,
    body: { data: updateData },
  });

  // 3. Anti-spam / économie d'emails : on envoie l'email uniquement sur le 1er message non lu
  if (recipientUnreadBefore === 0) {
    const recipient = isBuyer ? conversation.seller : conversation.buyer;
    if (recipient?.email) {
      const convUrl = `${config.public.siteUrl}/messages/${id}`;
      await sendTransactionalEmail({
        to: recipient.email,
        subject: `💬 Nouvelle réponse de ${user.username} sur Ludoccase`,
        text: `Bonjour ${recipient.username},\n\n${user.username} vous a répondu sur Ludoccase :\n\n"${content}"\n\nVoir la conversation :\n${convUrl}\n\nL'équipe Ludoccase`,
      }).catch(() => {});
    }
  }

  return msgRes?.data;
});
