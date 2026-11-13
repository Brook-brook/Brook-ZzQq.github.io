// Original bounded linear public-goods teaching model. Points are abstract, not
// experimental observations, money, social preferences or a world forecast.
export const goodsDefaults = { endowment: 20, multiplier_tenths: 16, contributions: [10, 10, 10, 10] };

export function validateGoodsParameters(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
    Object.keys(value).length !== 3 || !['endowment', 'multiplier_tenths', 'contributions'].every((k) => Object.hasOwn(value, k)) ||
    !Number.isInteger(value.endowment) || value.endowment < 1 || value.endowment > 100 ||
    !Number.isInteger(value.multiplier_tenths) || value.multiplier_tenths < 0 || value.multiplier_tenths > 100 ||
    !Array.isArray(value.contributions) || value.contributions.length < 2 || value.contributions.length > 8 ||
    Array.from(value.contributions).some((c) => !Number.isInteger(c) || c < 0 || c > value.endowment))
    throw new Error('参数须为 2–8 人、1–100 点初始额度、0–100 的整数倍率十分数和界内整数贡献。');
  return { endowment: value.endowment, multiplier_tenths: value.multiplier_tenths, contributions: [...value.contributions] };
}

export function evaluatePublicGoods(value) {
  const parameters = validateGoodsParameters(value);
  const { endowment: w, multiplier_tenths: mt, contributions } = parameters;
  const n = contributions.length, total = contributions.reduce((sum, c) => sum + c, 0);
  const denominator = 10 * n, privateNumerator = mt - denominator;
  const socialNumerator = mt - 10;
  const share = mt * total / denominator;
  const players = contributions.map((c, index) => {
    const best = privateNumerator < 0 ? 0 : privateNumerator > 0 ? w : null;
    const gainNumerator = best === null ? 0 : (best - c) * privateNumerator;
    return { id: `P${index + 1}`, contribution: c, retained: w - c, share,
      payoff: ((w - c) * denominator + mt * total) / denominator,
      best_contribution: best, gain_numerator: gainNumerator, gain_denominator: denominator,
      deviation_gain: gainNumerator / denominator, can_improve: gainNumerator > 0 };
  });
  const totalPayoff = (n * w * 10 + socialNumerator * total) / 10;
  const optimum = socialNumerator > 0 ? mt * n * w / 10 : n * w;
  return { parameters, group_size: n, multiplier: mt / 10,
    contribution_total: total, public_return: mt * total / 10, share,
    total_payoff: totalPayoff, private_marginal: privateNumerator / denominator,
    social_marginal: socialNumerator / 10, players,
    is_nash: players.every((p) => !p.can_improve),
    nash_profiles: privateNumerator < 0 ? 'all-zero' : privateNumerator > 0 ? 'all-full' : 'any',
    social_profiles: socialNumerator < 0 ? 'all-zero' : socialNumerator > 0 ? 'all-full' : 'any',
    is_social_optimum: socialNumerator === 0 || (socialNumerator < 0 ? total === 0 : total === n * w),
    optimal_total: optimum, social_gap: optimum - totalPayoff };
}

export function goodsEndpointSlice(value) {
  const parameters = validateGoodsParameters(value), w = parameters.endowment;
  return [0, w].flatMap((first) => [0, w].map((second) => {
    const contributions = [...parameters.contributions]; contributions[0] = first; contributions[1] = second;
    const result = evaluatePublicGoods({ ...parameters, contributions });
    return { first, second, remaining_contributions: contributions.slice(2),
      first_payoff: result.players[0].payoff, second_payoff: result.players[1].payoff };
  }));
}

export function createGoodsReport(value) {
  const result = evaluatePublicGoods(value);
  return { schema_version: 1, kind: 'linear-public-goods-teaching', empirical: false,
    assumptions: { rounds: 1, equal_endowments: true, unit_contribution_cost: 1,
      allocation: 'equal return to every player', preference: 'own final points',
      actions: 'integer contributions from zero to endowment',
      best_contribution_null: 'any allowed integer contribution is a best response',
      equilibrium: 'pure profiles; every player checked holding all others fixed',
      objective: 'sum of final points; not fairness or real-world policy' },
    result, endpoint_slice: goodsEndpointSlice(result.parameters),
    comparison: { zero: evaluatePublicGoods({ ...result.parameters, contributions: Array(result.group_size).fill(0) }),
      full: evaluatePublicGoods({ ...result.parameters, contributions: Array(result.group_size).fill(result.parameters.endowment) }) } };
}
