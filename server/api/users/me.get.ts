import { defineEventHandler } from 'h3';
import { requireAuthUser, ensureSellerProfile } from '../../utils/strapi';

export default defineEventHandler(async (event) => {
  const { user, token } = await requireAuthUser(event);
  const sellerProfile = await ensureSellerProfile(user, token).catch(() => null);

  return {
    ...user,
    sellerProfile,
  };
});
