import { categories, validateCampus } from './campus-model.js';

export const EARTH_RADIUS_M = 6371008.8;
export const MAX_CALL_CHARS = 4096;

// Original teaching contracts. This is neither an LLM API envelope nor MCP JSON-RPC.
export const toolDefinitions = [
  {
    name: 'find_places', title: '按文字查地点',
    description: '在已有代表点的名称、英文名和类别中做文字匹配。',
    parameters: { query: '1–80 字符的文字', category: 'all / teaching / library / landscape / study / dining / housing' }
  },
  {
    name: 'measure_distance', title: '计算两点球面距离',
    description: '按已有 WGS84 代表点，以平均地球半径计算短球面弧长。',
    parameters: { from: '已有地点 ID', to: '已有地点 ID' }
  },
  {
    name: 'nearby_places', title: '查半径内代表点',
    description: '排除中心点，按未舍入的球面距离 ≤ 半径筛选，再按距离排序。',
    parameters: { center: '已有地点 ID', radius_m: '0–3000 的有限数值，单位米' }
  }
];

export const toolScenarios = [
  { id: 'distance', title: '两座图书馆相距多远？',
    request: '比较主图书馆和农医图书馆的代表点距离；这能直接用于步行导航吗？',
    call: { name: 'measure_distance', arguments: { from: 'main-library', to: 'medical-library' } } },
  { id: 'nearby', title: '主图书馆 200 米内有什么？',
    request: '在已有目录中，找主图书馆代表点 200 米内的其他代表点。',
    call: { name: 'nearby_places', arguments: { center: 'main-library', radius_m: 200 } } },
  { id: 'search', title: '按名字找图书馆',
    request: '查已有目录中名字包含“图书馆”的地点，不推断开放时间。',
    call: { name: 'find_places', arguments: { query: '图书馆', category: 'all' } } },
  { id: 'invalid', title: '错误案例：把米写成文字',
    request: '这是自编错误案例。修正 radius_m 的类型，再观察能否执行。',
    call: { name: 'nearby_places', arguments: { center: 'main-library', radius_m: '200' } } },
  { id: 'unknown', title: '错误案例：请求未开放工具',
    request: '这是自编错误案例。一个工具名字或请求并不会赋予写入权限。',
    call: { name: 'publish_notes', arguments: {} } },
  { id: 'receipt', title: '错误案例：回执来自另一调用',
    request: '这是自编错误案例。首次交回时故意错配调用 ID；第二次可交回正确回执。',
    call: { name: 'measure_distance', arguments: { from: 'main-library', to: 'qiushi' } } }
];

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
}

function exactKeys(value, keys) {
  if (!object(value) || Object.keys(value).length !== keys.length || !keys.every((key) => Object.hasOwn(value, key)))
    throw new Error(`字段必须且只能是 ${keys.join('、')}。`);
}

export function validateToolCatalog(data) {
  const places = validateCampus(data);
  const checked = typeof data.checked === 'string' ? Date.parse(`${data.checked}T00:00:00Z`) : NaN;
  if (places.length > 100 || data.version !== 1 || data.license !== 'ODbL-1.0' ||
    typeof data.checked !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.checked) ||
    !Number.isFinite(checked) || new Date(checked).toISOString().slice(0, 10) !== data.checked ||
    typeof data.attribution !== 'string' || !data.attribution.trim() || data.attribution.length > 200 ||
    typeof data.note !== 'string' || !data.note.trim() || data.note.length > 2000 ||
    places.some((p) => !/^[a-z][a-z0-9-]{0,59}$/.test(p.id) ||
      ![p.name, p.english].every((s) => typeof s === 'string' && s.length > 0 && s.length <= 200)))
    throw new Error('地点目录未通过边界与来源校验，工具未启用。');
  return places;
}

function validateCall(call, data) {
  const places = validateToolCatalog(data);
  exactKeys(call, ['name', 'arguments']);
  if (!toolDefinitions.some((tool) => tool.name === call.name))
    throw new Error('工具未开放。这里只允许 find_places、measure_distance、nearby_places；不能发布或读取手记。');
  const args = call.arguments;
  const placeId = (id) => {
    if (typeof id !== 'string' || !places.some((p) => p.id === id))
      throw new Error('地点 ID 不在已有目录中。请从下方地点表选取，不猜坐标。');
    return id;
  };
  let checked;
  if (call.name === 'find_places') {
    exactKeys(args, ['query', 'category']);
    if (typeof args.query !== 'string' || !args.query.trim() || args.query.length > 80)
      throw new Error('query 必须是 1–80 字符且不全为空白的文字。');
    if (typeof args.category !== 'string' || !Object.hasOwn(categories, args.category))
      throw new Error('category 必须来自公开的类别枚举。');
    checked = { query: args.query.trim(), category: args.category };
  } else if (call.name === 'measure_distance') {
    exactKeys(args, ['from', 'to']);
    checked = { from: placeId(args.from), to: placeId(args.to) };
  } else {
    exactKeys(args, ['center', 'radius_m']);
    if (typeof args.radius_m !== 'number' || !Number.isFinite(args.radius_m) || args.radius_m < 0 || args.radius_m > 3000)
      throw new Error('radius_m 必须是 0–3000 的有限数值（米），不能是带引号的文字。');
    checked = { center: placeId(args.center), radius_m: args.radius_m };
  }
  return { name: call.name, arguments: checked };
}

export function parseToolCall(text, data) {
  if (typeof text !== 'string' || text.length > MAX_CALL_CHARS || !text.trim())
    throw new Error(`调用必须是非空 JSON，最多 ${MAX_CALL_CHARS} 字符。`);
  let call;
  try { call = JSON.parse(text); }
  catch { throw new Error('JSON 无法解析。请检查双引号、逗号和括号；不会尝试执行其中的文字。'); }
  return validateCall(call, data);
}

export function sphericalDistance(a, b) {
  for (const pair of [a, b]) if (!Array.isArray(pair) || pair.length !== 2 ||
    !pair.every(Number.isFinite) || Math.abs(pair[0]) > 180 || Math.abs(pair[1]) > 90)
    throw new Error('距离输入必须是有效的 [经度, 纬度]。');
  const radians = (n) => n * Math.PI / 180;
  const deltaLat = radians(b[1] - a[1]), deltaLon = radians(b[0] - a[0]);
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(a[1])) *
    Math.cos(radians(b[1])) * Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

function pointSnapshot(p) {
  return { id: p.id, name: p.name, coordinates: [...p.coordinates], osm: p.osm, source: p.source };
}

export function executeLocalTool(input, data) {
  const call = validateCall(input, data), args = call.arguments;
  const places = data.places, get = (id) => places.find((p) => p.id === id);
  const normalize = (text) => text.normalize('NFKC').toLowerCase();
  let result;
  if (call.name === 'find_places') {
    const matches = places.filter((p) =>
      (args.category === 'all' || p.tags.includes(args.category)) &&
      normalize(`${p.name} ${p.english} ${categories[p.category]}`).includes(normalize(args.query)));
    result = { count: matches.length, places: matches.map(pointSnapshot) };
  } else if (call.name === 'measure_distance') {
    const from = get(args.from), to = get(args.to);
    result = { from: pointSnapshot(from), to: pointSnapshot(to),
      distance_m: sphericalDistance(from.coordinates, to.coordinates), earth_radius_m: EARTH_RADIUS_M };
  } else {
    const center = get(args.center);
    const nearby = places.filter((p) => p.id !== center.id).map((p) => ({ ...pointSnapshot(p),
      distance_m: sphericalDistance(center.coordinates, p.coordinates) }))
      .filter((p) => p.distance_m <= args.radius_m)
      .sort((a, b) => a.distance_m - b.distance_m || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    result = { center: pointSnapshot(center), radius_m: args.radius_m, count: nearby.length,
      places: nearby, earth_radius_m: EARTH_RADIUS_M };
  }
  return { catalog_version: data.version, source_checked: data.checked,
    coordinate_system: data.coordinateSystem, catalog_size: places.length, result };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (object(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

export function acceptToolObservation(callId, call, observation, data) {
  if (typeof callId !== 'string' || !/^call-\d{1,6}$/.test(callId)) throw new Error('无效的本机调用 ID。');
  exactKeys(observation, ['call_id', 'tool', 'output']);
  if (observation.call_id !== callId || observation.tool !== call.name)
    throw new Error('回执的调用 ID 或工具名不匹配；不能拿另一调用的结果继续解释。');
  // Only these small deterministic read tools can be recomputed. This does not
  // establish source freshness, real-world correctness or a general API guarantee.
  const expected = executeLocalTool(call, data);
  if (JSON.stringify(canonical(observation.output)) !== JSON.stringify(canonical(expected)))
    throw new Error('回执与当前调用的本机重算结果不一致；不能交回旧结果或改写结果。');
  return structuredClone(observation);
}

export function explainToolObservation(call, observation) {
  const output = observation.output, r = output.result;
  let statement;
  if (call.name === 'measure_distance')
    statement = `${r.from.name}与${r.to.name}的代表点球面距离约 ${r.distance_m.toFixed(1)} 米。`;
  else if (call.name === 'nearby_places')
    statement = `在已有 ${output.catalog_size} 个代表点中，${r.center.name} ${r.radius_m} 米内有 ${r.count} 个其他代表点。`;
  else statement = `在已有 ${output.catalog_size} 个代表点中，文字与类别条件匹配 ${r.count} 个。`;
  return `${statement}目录来源核对日期为 ${output.source_checked}。这不是完整校园覆盖、开放信息或步行路线；球面模型也不等于椭球测地线。`;
}

export function createToolReport(callId, call, observation, data) {
  const checked = validateCall(call, data);
  const accepted = acceptToolObservation(callId, checked, observation, data);
  return { schema_version: 1, kind: 'local-gis-tool-teaching', model_called: false,
    protocol: 'original simplified envelope; not MCP or an LLM API',
    call: { call_id: callId, ...checked }, observation: accepted,
    explanation: { kind: 'fixed-template', text: explainToolObservation(checked, accepted) },
    source: { version: data.version, checked: data.checked, coordinateSystem: data.coordinateSystem,
      license: data.license, attribution: data.attribution, note: data.note,
      places: data.places.map((p) => ({ ...pointSnapshot(p), english: p.english,
        category: p.category, tags: [...p.tags] })) } };
}
