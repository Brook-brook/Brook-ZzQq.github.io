import { goodsDefaults, evaluatePublicGoods, goodsEndpointSlice, createGoodsReport } from './goods-models.js';

const root = document.querySelector('[data-goods-lab]');
if (root) {
  const get = (id) => root.querySelector(`#${id}`);
  let state = structuredClone(goodsDefaults), latest;
  const ranges = new Map(), outputs = new Map(), playerFeedback = new Map();
  const point = (n) => n.toFixed(1);
  const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2).replace(/0$/, '').replace(/\.0$/, '')}`;
  const make = (tag, text) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; };

  function contributionControls() {
    ranges.clear(); outputs.clear(); playerFeedback.clear(); get('goods-first-inputs').replaceChildren(); get('goods-other-inputs').replaceChildren();
    state.contributions.forEach((value, index) => {
      const id = `goods-c-P${index + 1}`, row = make('div'); row.className = 'goods-player-input';
      const label = make('label', `玩家${index + 1}投入 `); label.htmlFor = id;
      const output = make('output', String(value)); output.setAttribute('for', id); label.append(output, ' 点');
      const input = make('input'); input.type = 'range'; input.id = id; input.min = '0'; input.max = String(state.endowment); input.step = '1'; input.value = String(value);
      input.setAttribute('aria-valuetext', `${value} 点`);
      input.addEventListener('input', () => { state.contributions[index] = Number(input.value); update(); });
      row.append(label, input); (index === 0 ? get('goods-first-inputs') : get('goods-other-inputs')).append(row);
      if (index > 0) {
        const feedback = make('p'); feedback.className = 'goods-player-feedback';
        feedback.id = `goods-feedback-P${index + 1}`; input.setAttribute('aria-describedby', feedback.id);
        row.append(feedback); playerFeedback.set(index, feedback);
      }
      ranges.set(index, input); outputs.set(index, output);
    });
    get('goods-others-summary').textContent = `调整其余 ${state.contributions.length - 1} 人的贡献`;
  }

  function update() {
    try {
      if (Number(get('goods-size').value) !== state.contributions.length || Number(get('goods-multiplier').value) !== state.multiplier_tenths)
        throw new Error('Controls do not match applied parameters');
      const r = evaluatePublicGoods(state); latest = r;
      const first = r.players[0];
      get('goods-multiplier-value').textContent = `${r.multiplier.toFixed(1)} 倍`;
      get('goods-multiplier').setAttribute('aria-valuetext', `${r.multiplier.toFixed(1)} 倍`);
      for (const [index, range] of ranges) {
        range.value = String(state.contributions[index]); range.setAttribute('aria-valuetext', `${state.contributions[index]} 点`);
        outputs.get(index).value = String(state.contributions[index]);
        if (index > 0) playerFeedback.get(index).textContent = `本玩家收益 ${point(r.players[index].payoff)} 点；固定别人时可多得 ${point(r.players[index].deviation_gain)} 点。`;
      }
      get('goods-retained').textContent = point(first.retained); get('goods-share').textContent = point(r.share); get('goods-payoff').textContent = point(first.payoff);
      get('goods-pool').textContent = `总投入 ${r.contribution_total} 点，放大为 ${point(r.public_return)} 点，${r.group_size} 人各得 ${point(r.share)} 点公共返还。`;
      get('goods-private-marginal').textContent = signed(r.private_marginal); get('goods-social-marginal').textContent = signed(r.social_marginal);
      get('goods-nash').textContent = r.is_nash ? '是' : '否';
      const improving = r.players.filter((p) => p.can_improve).length;
      get('goods-nash-detail').textContent = r.is_nash ? '；固定其他人时，没有人能单方面提高自己的点数。' : `；有 ${improving} 名玩家可以单方面提高自己的点数。`;
      get('goods-nash-set').textContent = r.nash_profiles === 'any' ?
        `m = n，每个 0 到 ${state.endowment} 点的整数贡献都是最佳回应；所有纯策略组合都是均衡。` :
        `当前规则的纯策略均衡：全员投 ${r.nash_profiles === 'all-zero' ? 0 : state.endowment} 点；这是各人的严格占优策略。`;
      get('goods-optimum').textContent = r.is_social_optimum ? '是' : '否';
      get('goods-optimum-detail').textContent = `；当前 ${point(r.total_payoff)} 点，最大 ${point(r.optimal_total)} 点，相差 ${point(r.social_gap)} 点。`;
      get('goods-social-set').textContent = r.social_profiles === 'any' ?
        `m = 1，所有贡献组合的总收益都是 ${point(r.total_payoff)} 点；各人分配仍可能不同。` :
        `当前规则的总收益最大组合：全员投 ${r.social_profiles === 'all-zero' ? 0 : state.endowment} 点。总和最优不等于公平的定义。`;
      const zero = evaluatePublicGoods({ ...state, contributions: Array(r.group_size).fill(0) });
      const full = evaluatePublicGoods({ ...state, contributions: Array(r.group_size).fill(state.endowment) });
      const totals = { zero: zero.total_payoff, current: r.total_payoff, full: full.total_payoff };
      const maximum = Math.max(...Object.values(totals));
      for (const [name, value] of Object.entries(totals)) {
        root.querySelector(`[data-goods-total="${name}"]`).value = point(value);
        root.querySelector(`[data-goods-bar="${name}"]`).style.setProperty('--goods-share', value / maximum);
      }
      const rows = get('goods-player-rows'); rows.replaceChildren();
      for (const player of r.players) {
        const row = make('tr'), heading = make('th', player.id); heading.scope = 'row'; row.append(heading);
        row.append(make('td', point(player.payoff)), make('td', player.best_contribution === null ? `0 到 ${state.endowment} 任意整数` : `${player.best_contribution} 点`), make('td', point(player.deviation_gain)));
        rows.append(row);
      }
      const slice = goodsEndpointSlice(state), matrix = get('goods-slice-rows'); matrix.replaceChildren();
      for (const firstContribution of [0, state.endowment]) {
        const row = make('tr'), heading = make('th', `投 ${firstContribution} 点`); heading.scope = 'row'; row.append(heading);
        for (const secondContribution of [0, state.endowment]) {
          const cell = slice.find((s) => s.first === firstContribution && s.second === secondContribution);
          row.append(make('td', `(${point(cell.first_payoff)}, ${point(cell.second_payoff)})`));
        }
        matrix.append(row);
      }
      get('goods-slice-scope').textContent = `行列只让玩家1、2选择投 0 或 ${state.endowment} 点；${r.group_size > 2 ? `其余 ${r.group_size - 2} 人保持当前贡献 [${state.contributions.slice(2).join(', ')}]。` : '此时没有其他玩家。'}每格只显示两人的收益。完整均衡仍逐人检查全体玩家，切片也未列出中间的整数动作。`;
      get('goods-status').textContent = `玩家1收益 ${point(first.payoff)} 点，固定别人时可多得 ${point(first.deviation_gain)} 点；群体总收益 ${point(r.total_payoff)} 点。`;
      get('goods-status').dataset.error = 'false'; get('goods-export').disabled = false;
    } catch {
      latest = null; get('goods-export').disabled = true;
      get('goods-status').dataset.error = 'true';
      get('goods-status').textContent = '参数未通过边界检查；保留上次显示，导出已暂停。请重置例子后再试。';
    }
  }

  get('goods-size').addEventListener('change', () => {
    const n = Number(get('goods-size').value);
    if (!Number.isInteger(n) || n < 2 || n > 8) {
      latest = null; get('goods-export').disabled = true;
      get('goods-status').textContent = '人数超出 2 到 8 的范围；保留上次显示，导出暂停。请重置例子。';
      get('goods-status').dataset.error = 'true'; return;
    }
    state.contributions = Array.from({ length: n }, (_, i) => state.contributions[i] ?? state.endowment / 2);
    contributionControls(); update();
  });
  get('goods-multiplier').addEventListener('input', () => { state.multiplier_tenths = Number(get('goods-multiplier').value); update(); });
  get('goods-m-one').addEventListener('click', () => { state.multiplier_tenths = 10; get('goods-multiplier').value = '10'; update(); });
  get('goods-m-equal').addEventListener('click', () => { state.multiplier_tenths = state.contributions.length * 10; get('goods-multiplier').value = String(state.multiplier_tenths); update(); });
  for (const [id, value] of [['goods-zero', 0], ['goods-full', 20]]) get(id).addEventListener('click', () => { state.contributions.fill(value); update(); });
  get('goods-reset').addEventListener('click', () => {
    state = structuredClone(goodsDefaults); get('goods-size').value = String(state.contributions.length);
    get('goods-multiplier').value = String(state.multiplier_tenths); contributionControls(); update();
  });
  get('goods-export').addEventListener('click', () => {
    if (!latest) return;
    const report = createGoodsReport(state);
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2) + '\n'], { type: 'application/json' }));
    const link = make('a'); link.href = url; link.download = 'brooks-public-goods-experiment.json'; link.hidden = true;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  contributionControls(); update(); get('goods-controls').disabled = false;
}
