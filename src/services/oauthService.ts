import type { OAuthProfile } from '@/types/auth';

const oauthService = {
  handleOAuthProfile: async (profile: OAuthProfile): Promise<string> => {
    // TODO: Implement
    throw new Error('Method not implemented');
  },

  verifyGoogleIdToken: async (idToken: string): Promise<OAuthProfile> => {
    // TODO: Implement this method
    throw new Error('Method not implemented');
  },

  verifyFacebookToken: async (accessToken: string): Promise<OAuthProfile> => {
    // TODO: Implement this method
    throw new Error('Method not implemented');
  },
};

export default oauthService;
