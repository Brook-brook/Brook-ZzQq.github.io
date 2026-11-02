import { gameModel, mercatorScale, copyState } from './models.js';
const el = (id) => document.getElementById(id);
if (el('game')) {
  function renderGame() {
    const kind = el('game-kind').value;
    const t = Number(el('temptation').value);
    const i = Number(el('row-choice').value),
      j = Number(el('col-choice').value);
    const { matrix, equilibria, bestTotal } = gameModel(kind, t);
    el('temptation-value').textContent = t;
    const names = kind === 'stag' ? ['猎鹿', '猎兔'] : ['合作', '背叛'];
    el('matrix').replaceChildren(
      ...matrix.map((row, r) => {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = names[r];
        tr.append(th);
        row.forEach((cell, c) => {
          const td = document.createElement('td');
          const eq = equilibria.some(([a, b]) => a === r && b === c);
          td.textContent = `(${cell.join(', ')})${eq ? ' ★' : ''}`;
          if (eq)
            td.setAttribute('aria-label', `${cell.join('，')}，纯策略纳什均衡`);
          if (r === i && c === j) td.className = 'selected';
          tr.append(td);
        });
        return tr;
      })
    );
    const [a, b] = matrix[i][j];
    el('game-result').textContent =
      `当前收益：你 ${a}，对方 ${b}；总收益 ${a + b}。${a + b === bestTotal ? '达到当前矩阵的最大总收益。' : `当前最大总收益为 ${bestTotal}。`}`;
    el('equilibria').textContent =
      '★ 纯策略纳什均衡：' +
      equilibria.map(([r, c]) => `${names[r]} / ${names[c]}`).join('、') +
      '。各方均不能靠单方面偏离提高收益。';
    el('game-explanation').textContent =
      kind === 'prisoner'
        ? t > 3
          ? '满足 T > R > P > S：背叛是双方的严格占优策略，但双方合作的总收益更高。'
          : '当前参数不满足标准囚徒困境的严格收益排序。注意均衡集合如何变化。'
        : t < 4
          ? '双方猎鹿与双方猎兔都是均衡；猎鹿需要协调。是否总收益最高，仍应逐格比较。'
          : '当前收益使单方猎兔至少与双方猎鹿一样有利；在边界存在无差异，严格的标准猎鹿条件发生变化。';
  }
  ['game-kind', 'temptation', 'row-choice', 'col-choice'].forEach((id) =>
    el(id).addEventListener('input', renderGame)
  );
  el('game-kind').addEventListener('change', () => {
    el('temptation').value = el('game-kind').value === 'stag' ? 2 : 5;
    renderGame();
  });
  renderGame();
  let step = 0;
  function renderCopy() {
    const deep = el('copy-kind').value === 'deep';
    const state = copyState(deep, step);
    el('copy-step').textContent =
      `${step + 1} / 4 · ` +
      [
        '创建 A，分配 H1，保存整数 7。',
        deep
          ? '复制构造 B：分配 H2 并复制数值。'
          : '复制构造 B：逐成员复制指针，指向同一 H1。',
        '通过 A 的指针把数值改为 9。',
        deep
          ? '销毁 A，释放 H1；B 的 H2 仍有效。'
          : '销毁 A，释放 H1；B 的指针悬空。停止：再次解引用或 delete 都有未定义行为风险。'
      ][step];
    el('memory').replaceChildren(
      ...[
        state.aAlive
          ? `对象 A → H1 → ${state.aValue}`
          : '对象 A 已销毁；H1 已释放',
        state.bAlive
          ? `对象 B → ${state.bAddress} → ${state.dangling ? '已释放（悬空，禁止访问）' : state.bValue}`
          : '对象 B 尚未创建'
      ].map((text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div;
      })
    );
    el('copy-next').disabled = step === 3;
    el('copy-code').textContent = `#include <optional> // C++17

struct Box {
  int* p;
  explicit Box(int n) : p(new int(n)) {}
  ${deep ? 'Box(const Box& b) : p(new int(*b.p)) {}' : 'Box(const Box&) = default; // 仅复制地址'}
  ~Box() { delete p; }
  // 教学片段：未实现复制赋值
};

int main() {
  std::optional<Box> a(std::in_place, 7);
  Box b(*a);
  *a->p = 9;
  // ${deep ? '*b.p 仍为 7' : '*b.p 也变为 9'}
  a.reset(); // 显式先销毁 A
  // ${deep ? 'B 的资源仍有效，离开作用域时释放 H2' : 'B 已悬空；离开作用域会重复释放！'}
  // ${deep ? '此分支正常结束' : '仅供分析：浅拷贝版本有未定义行为，不应运行'}
}`;
  }
  el('copy-next').addEventListener('click', () => {
    step = Math.min(3, step + 1);
    renderCopy();
  });
  el('copy-reset').addEventListener('click', () => {
    step = 0;
    renderCopy();
  });
  el('copy-kind').addEventListener('change', () => {
    step = 0;
    renderCopy();
  });
  renderCopy();
  function renderGeo() {
    const lat = Number(el('latitude').value),
      scale = mercatorScale(lat);
    el('latitude-value').textContent = `${lat}°`;
    el('projected-circle').setAttribute('r', 16 * scale);
    el('geo-result').textContent =
      `局部尺度 ×${scale.toFixed(3)}；局部面积尺度 ×${(scale * scale).toFixed(3)}。`;
    el('geo-ai').textContent =
      `流程输出：在纬度 ${lat}°，投影平面上的局部距离约是球面地面距离的 ${scale.toFixed(3)} 倍。不能把投影米数直接当作该处地面米数。`;
  }
  el('latitude').addEventListener('input', renderGeo);
  renderGeo();
}
