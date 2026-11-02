export function gameModel(kind, t) {
  const matrix =
    kind === 'stag'
      ? [
          [
            [4, 4],
            [0, t]
          ],
          [
            [t, 0],
            [2, 2]
          ]
        ]
      : [
          [
            [3, 3],
            [0, t]
          ],
          [
            [t, 0],
            [1, 1]
          ]
        ];
  return analyzeMatrix(matrix);
}
export function analyzeMatrix(matrix) {
  const equilibria = [];
  let bestTotal = -Infinity;
  matrix.forEach((row, i) =>
    row.forEach((cell, j) => {
      if (cell[0] >= matrix[1 - i][j][0] && cell[1] >= matrix[i][1 - j][1])
        equilibria.push([i, j]);
      bestTotal = Math.max(bestTotal, cell[0] + cell[1]);
    })
  );
  return { matrix, equilibria, bestTotal };
}
export function mercatorScale(latitude) {
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 80)
    throw new RangeError('演示纬度须在 −80° 到 80° 之间');
  return 1 / Math.cos((latitude * Math.PI) / 180);
}
export function copyState(deep, step) {
  return {
    aAlive: step < 3,
    bAlive: step >= 1,
    aAddress: 'H1',
    bAddress: deep ? 'H2' : 'H1',
    aValue: step >= 2 ? 9 : 7,
    bValue: step >= 2 && !deep ? 9 : 7,
    dangling: step >= 3 && !deep
  };
}
