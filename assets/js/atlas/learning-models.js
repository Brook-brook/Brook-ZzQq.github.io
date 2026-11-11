export const LEARNING_KEY = 'brooks-universe.learning.v1';
export const MAX_BACKUP_BYTES = 256 * 1024;
export const MAX_NOTE_LENGTH = 2000;

const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const sameKeys = (value, keys) => object(value) && Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));

export function emptyLearningState() {
  return { version: 1, entries: {} };
}

export function validateLearningState(value, ids) {
  if (!sameKeys(value, ['version', 'entries']) || value.version !== 1 || !object(value.entries)) {
    throw new Error('备份格式或版本不受支持。请使用本站导出的 JSON。');
  }
  const entries = [];
  for (const [id, entry] of Object.entries(value.entries)) {
    if (!ids.has(id) || !sameKeys(entry, ['completed', 'note']) ||
        typeof entry.completed !== 'boolean' || typeof entry.note !== 'string' ||
        entry.note.length > MAX_NOTE_LENGTH) {
      throw new Error('备份含未知步骤或无效记录；手记最多 2000 字符。原记录未改动。');
    }
    if (entry.completed || entry.note.length) entries.push([id, { completed: entry.completed, note: entry.note }]);
  }
  return { version: 1, entries: Object.fromEntries(entries) };
}

export function parseLearningBackup(text, ids) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error('备份超过 256 KB，请选择本站导出的较小 JSON。');
  }
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('无法解析 JSON。请检查备份文件，原记录未改动。'); }
  return validateLearningState(value, ids);
}

export function updateLearningEntry(state, id, patch, ids) {
  if (!ids.has(id)) throw new Error('未知学习步骤。');
  const before = state.entries[id] || { completed: false, note: '' };
  return validateLearningState({ version: 1, entries: { ...state.entries, [id]: { ...before, ...patch } } }, ids);
}

export function mergeLearningStates(local, incoming, ids) {
  const current = validateLearningState(local, ids);
  const backup = validateLearningState(incoming, ids);
  return validateLearningState({ version: 1, entries: { ...backup.entries, ...current.entries } }, ids);
}

export function nextLearningStep(groups, state) {
  const incomplete = (id) => !state.entries[id]?.completed;
  const active = groups.find((group) => group.some((id) => state.entries[id]) && group.some(incomplete));
  return (active || groups.flat()).find(incomplete) || null;
}
