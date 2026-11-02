export const categories = {
  all: '全部地点',
  teaching: '教学楼',
  library: '图书馆',
  dining: '食堂',
  housing: '宿舍区',
  landscape: '校园景观',
  study: '学习空间'
};
export const symbols = { book: '▤', building: '⌂', spark: '✧', wave: '≈' };
export function filterPlaces(
  places,
  { category = 'all', query = '', favorites = [], onlyFavorites = false }
) {
  const text = query.trim().toLocaleLowerCase();
  return places.filter(
    (p) =>
      (category === 'all' || p.tags.includes(category)) &&
      (!onlyFavorites || favorites.includes(p.id)) &&
      `${p.name} ${p.english} ${categories[p.category]}`
        .toLocaleLowerCase()
        .includes(text)
  );
}
export function projectPlaces(places, width, height) {
  const mercator = ([lon, lat]) => [
    (lon * Math.PI) / 180,
    Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
  ];
  const xy = places.map((p) => mercator(p.coordinates));
  const xs = xy.map((p) => p[0]),
    ys = xy.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const scale = Math.min(
    (width - 180) / (maxX - minX),
    (height - 140) / (maxY - minY)
  );
  return places.map((p, i) => ({
    id: p.id,
    x: width / 2 + (xy[i][0] - (minX + maxX) / 2) * scale,
    y: height / 2 - (xy[i][1] - (minY + maxY) / 2) * scale
  }));
}
export function clampView(view) {
  return {
    zoom: Math.max(1, Math.min(3, Number(view.zoom) || 1)),
    x: Math.max(-1.2, Math.min(1.2, Number(view.x) || 0)),
    y: Math.max(-1.2, Math.min(1.2, Number(view.y) || 0))
  };
}
export function validateCampus(data) {
  if (
    !data ||
    data.coordinateSystem !== 'WGS84' ||
    !Array.isArray(data.places) ||
    !data.places.length
  )
    throw new Error('无效的地点数据');
  const ids = new Set();
  for (const p of data.places) {
    if (
      typeof p.id !== 'string' ||
      ids.has(p.id) ||
      !categories[p.category] ||
      !Array.isArray(p.tags) ||
      !p.tags.every((t) => categories[t]) ||
      !Array.isArray(p.coordinates) ||
      p.coordinates.length !== 2 ||
      !p.coordinates.every(Number.isFinite) ||
      p.coordinates[0] < 120.06 ||
      p.coordinates[0] > 120.1 ||
      p.coordinates[1] < 30.29 ||
      p.coordinates[1] > 30.32 ||
      !/^https:\/\/mapcarta.com\/[NW]\d+$/.test(p.source) ||
      !/^(way|node)\/\d+$/.test(p.osm)
    )
      throw new Error('地点记录未通过校验');
    ids.add(p.id);
  }
  return data.places;
}
