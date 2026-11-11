import {
  LEARNING_KEY, MAX_BACKUP_BYTES, emptyLearningState, parseLearningBackup,
  updateLearningEntry, mergeLearningStates, nextLearningStep
} from './learning-models.js';

const workspace = document.querySelector('[data-learning-workspace]');
if (workspace) {
  const steps = [...workspace.querySelectorAll('[data-learning-step]')];
  const ids = new Set(steps.map((step) => step.dataset.learningStep));
  const groups = [...workspace.querySelectorAll('[data-learning-path]')]
    .map((path) => [...path.querySelectorAll('[data-learning-step]')].map((step) => step.dataset.learningStep));
  const storageStatus = document.getElementById('learning-storage');
  const progress = document.getElementById('learning-progress');
  const resumeTitle = document.getElementById('learning-resume-title');
  const continueLink = document.getElementById('learning-continue');
  const fileInput = document.getElementById('learning-import');
  const preview = document.getElementById('learning-import-preview');
  const previewSummary = document.getElementById('learning-import-summary');
  const confirmImport = document.getElementById('learning-import-confirm');
  const backupFeedback = document.getElementById('learning-backup-feedback');
  let state = emptyLearningState();
  let lastStored = null;
  let writable = true;
  let pendingImport = null;
  let importRequest = 0;
  try {
    lastStored = localStorage.getItem(LEARNING_KEY);
    if (lastStored !== null) state = parseLearningBackup(lastStored, ids);
    storageStatus.textContent = '只在当前浏览器保存。请定期导出备份。';
  } catch {
    writable = false;
    storageStatus.textContent = '本机存储不可用或已有数据无法读取。旧数据未覆盖；本页只暂存，请导出后再离开。';
  }

  function render() {
    if (pendingImport) renderImportPreview();
    let completed = 0;
    for (const step of steps) {
      const entry = state.entries[step.dataset.learningStep] || { completed: false, note: '' };
      step.querySelector('[data-step-complete]').checked = entry.completed;
      const note = step.querySelector('[data-step-note]');
      if (note.value !== entry.note) note.value = entry.note;
      step.classList.toggle('is-self-checked', entry.completed);
      if (entry.completed) completed++;
    }
    const progressText = `已自检 ${completed} / ${steps.length} 步。由你手动记录，不代表系统评定掌握程度。`;
    if (progress.textContent !== progressText) progress.textContent = progressText;
    const nextId = nextLearningStep(groups, state);
    if (nextId) {
      const target = steps.find((step) => step.dataset.learningStep === nextId);
      resumeTitle.textContent = Object.keys(state.entries).length ? '接着已有的线索' : '从一个小问题开始';
      continueLink.textContent = `继续：${target.querySelector('h3').textContent}`;
      continueLink.href = `#${nextId}`;
    } else {
      resumeTitle.textContent = '这些自检都已有记录';
      continueLink.textContent = '回看路线，挑一个问题再验证';
      continueLink.href = `#${workspace.querySelector('[data-learning-path]').id}`;
    }
  }

  function persist() {
    if (!writable) return;
    try {
      if (localStorage.getItem(LEARNING_KEY) !== lastStored) {
        writable = false;
        storageStatus.textContent = '其他标签页修改了记录。为避免覆盖，本页只暂存；请先导出，再刷新。';
        return;
      }
      const text = JSON.stringify(state);
      localStorage.setItem(LEARNING_KEY, text);
      lastStored = text;
      const savedText = '已保存在当前浏览器。没有上传或发布。';
      if (storageStatus.textContent !== savedText) storageStatus.textContent = savedText;
    } catch {
      writable = false;
      storageStatus.textContent = '无法写入本机存储。本页记录仍在，请导出备份；刷新后可能丢失。';
    }
  }

  function renderImportPreview() {
    const keys = Object.keys(pendingImport.entries);
    const additions = keys.filter((id) => !Object.hasOwn(state.entries, id)).length;
    const summaryText = `备份包含 ${keys.length} 条记录，可补入 ${additions} 条。已有记录以本页为准；导入前不会改动任何记录。`;
    if (previewSummary.textContent !== summaryText) previewSummary.textContent = summaryText;
    confirmImport.disabled = additions === 0;
  }

  function cancelImport() {
    pendingImport = null;
    preview.hidden = true;
    fileInput.value = '';
  }

  for (const step of steps) {
    const id = step.dataset.learningStep;
    step.querySelector('[data-step-complete]').addEventListener('change', (event) => {
      state = updateLearningEntry(state, id, { completed: event.target.checked }, ids);
      render(); persist();
    });
    step.querySelector('[data-step-note]').addEventListener('input', (event) => {
      state = updateLearningEntry(state, id, { note: event.target.value.slice(0, 2000) }, ids);
      render(); persist();
    });
  }
  window.addEventListener('storage', (event) => {
    if (event.key !== LEARNING_KEY && event.key !== null) return;
    writable = false;
    storageStatus.textContent = '其他标签页修改了存储。本页已暂停自动保存；可导出当前记录后刷新。';
  });

  document.getElementById('learning-export').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'brooks-learning-backup.json';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  fileInput.addEventListener('change', async () => {
    const request = ++importRequest;
    pendingImport = null; preview.hidden = true;
    const file = fileInput.files[0];
    backupFeedback.textContent = '';
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('文件超过 256 KB，未导入。');
      backupFeedback.textContent = '正在检查备份…';
      const text = await file.text();
      if (request !== importRequest) return;
      pendingImport = parseLearningBackup(text, ids);
      backupFeedback.textContent = '备份已读取，尚未合并。';
      renderImportPreview();
      preview.hidden = false;
      if (confirmImport.disabled) document.getElementById('learning-import-cancel').focus();
      else confirmImport.focus();
    } catch (error) {
      if (request !== importRequest) return;
      backupFeedback.textContent = error.message;
      fileInput.value = '';
    }
  });
  confirmImport.addEventListener('click', () => {
    if (!pendingImport) return;
    const additions = Object.keys(pendingImport.entries).filter((id) => !Object.hasOwn(state.entries, id)).length;
    state = mergeLearningStates(state, pendingImport, ids);
    cancelImport(); render(); persist(); fileInput.focus();
    backupFeedback.textContent = writable
      ? `已补入 ${additions} 条记录并保存在当前浏览器。原有手记已保留。`
      : `已补入本页 ${additions} 条记录，当前无法保存；请先导出备份再离开。`;
  });
  document.getElementById('learning-import-cancel').addEventListener('click', () => {
    importRequest++; cancelImport(); fileInput.focus();
    backupFeedback.textContent = '已取消导入，原记录未改动。';
  });
  document.getElementById('learning-clear').addEventListener('click', () => {
    if (!window.confirm('清除本机学习记录？这不会删除已导出的备份。建议先导出。')) return;
    try {
      localStorage.removeItem(LEARNING_KEY);
      lastStored = null; writable = true;
      storageStatus.textContent = '本机学习记录已清除，主题和校园收藏不受影响。';
    } catch {
      writable = false;
      storageStatus.textContent = '本页记录已重置，但无法清除浏览器存储；刷新可能恢复旧记录。';
    }
    importRequest++; cancelImport(); state = emptyLearningState(); render();
    backupFeedback.textContent = storageStatus.textContent;
  });
  workspace.querySelectorAll('[data-learning-controls]').forEach((element) => { element.hidden = false; });
  render();
}
