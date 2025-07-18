export type AdaptationMode = 'RULE_BASED' | 'AI';

export const AdaptationModes = {
  RULE_BASED: 'RULE_BASED' as const,
  AI: 'AI' as const,
};

// Adaption Mode switch
export const CURRENT_ADAPTATION_MODE: AdaptationMode = AdaptationModes.AI;