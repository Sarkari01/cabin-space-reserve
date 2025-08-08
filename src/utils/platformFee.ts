// Utility to compute platform fee based on business settings
// Fee applies to the provided baseAmount (post discounts), not exceeding baseAmount
export type PlatformFeeConfig = {
  platform_fee_enabled?: boolean;
  platform_fee_type?: 'flat' | 'percent' | string | null;
  platform_fee_value?: number | null;
};

export const computePlatformFee = (
  baseAmount: number,
  config: PlatformFeeConfig | null | undefined
): number => {
  if (!config || !config.platform_fee_enabled) return 0;
  const type = config.platform_fee_type === 'flat' ? 'flat' : 'percent';
  const value = Number(config.platform_fee_value ?? 0);
  if (value <= 0) return 0;
  let fee = 0;
  if (type === 'percent') {
    fee = Math.max(0, Math.round((baseAmount * value) / 100));
  } else {
    fee = Math.max(0, Math.round(value));
  }
  // Do not exceed the base amount
  return Math.min(fee, Math.max(0, Math.round(baseAmount)));
};
