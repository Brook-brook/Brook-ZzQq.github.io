import { analyzeMatrix } from './models.js';
const inputs = [...document.querySelectorAll('.nash-input')];
if (inputs.length) {
  function render() {
    const valid = inputs.every(
      (input) => input.value.trim() !== '' && input.checkValidity()
    );
    if (!valid) {
      document.getElementById('nash-status').textContent =
        '请填写 −20 到 20 之间、步长为 0.5 的有效收益值。';
      document.getElementById('nash-reasons').replaceChildren();
      document.querySelectorAll('[id^="eq-"]').forEach((el) => {
        el.textContent = '';
      });
      return;
    }
    const matrix = [
      [
        [0, 0],
        [0, 0]
      ],
      [
        [0, 0],
        [0, 0]
      ]
    ];
    inputs.forEach((input) => {
      matrix[input.dataset.r][input.dataset.c][input.dataset.player] = Number(
        input.value
      );
    });
    const { equilibria, bestTotal } = analyzeMatrix(matrix);
    document.getElementById('nash-status').textContent =
      `找到 ${equilibria.length} 个纯策略纳什均衡；当前最大收益总和 ${bestTotal}。`;
    const reasons = [];
    matrix.forEach((row, i) =>
      row.forEach((cell, j) => {
        const eq = equilibria.some(([a, b]) => a === i && b === j);
        document.getElementById(`eq-${i}-${j}`).textContent = eq
          ? '★ 纯策略均衡'
          : '';
        const article = document.createElement('article');
        const heading = document.createElement('h3');
        heading.textContent = `${['A', 'B'][i]} / ${['A', 'B'][j]}${eq ? ' ★' : ''}`;
        const p = document.createElement('p');
        const dRow = matrix[1 - i][j][0] - cell[0],
          dCol = matrix[i][1 - j][1] - cell[1];
        p.textContent = `行玩家单方换策略：收益变化 ${dRow > 0 ? '+' : ''}${dRow}；列玩家单方换策略：${dCol > 0 ? '+' : ''}${dCol}。${eq ? '双方都不能严格获益，因此是均衡。' : '存在有利的单方面偏离，因此不是均衡。'}${cell[0] + cell[1] === bestTotal ? '达到最大收益总和。' : ''}`;
        article.append(heading, p);
        reasons.push(article);
      })
    );
    document.getElementById('nash-reasons').replaceChildren(...reasons);
  }
  function preset(matrix) {
    inputs.forEach((input) => {
      input.value =
        matrix[input.dataset.r][input.dataset.c][input.dataset.player];
    });
    render();
  }
  document.getElementById('nash-prisoner').addEventListener('click', () =>
    preset([
      [
        [3, 3],
        [0, 5]
      ],
      [
        [5, 0],
        [1, 1]
      ]
    ])
  );
  document.getElementById('nash-matching').addEventListener('click', () =>
    preset([
      [
        [1, -1],
        [-1, 1]
      ],
      [
        [-1, 1],
        [1, -1]
      ]
    ])
  );
  inputs.forEach((input) => input.addEventListener('input', render));
  document.getElementById('nash-prisoner').click();
}
