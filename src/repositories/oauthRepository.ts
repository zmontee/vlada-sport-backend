import type { OAuthProfile } from '@/types/auth';

const oauthRepository = {
  findByProviderId: async (
    provider: string,
    providerId: string
  ): Promise<OAuthProfile | null> => {
    // TODO: Implement this method
    throw new Error('Method not implemented');
  },

  create: async (userId: string, data: OAuthProfile): Promise<OAuthProfile> => {
    // TODO: Implement this method
    throw new Error('Method not implemented');
  },
};

export default oauthRepository;
