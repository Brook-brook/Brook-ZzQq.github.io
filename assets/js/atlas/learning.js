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
  let recoveryRaw = null;
  let pendingImport = null;
  let importRequest = 0;
  try {
    lastStored = localStorage.getItem(LEARNING_KEY);
    if (lastStored !== null) state = parseLearningBackup(lastStored, ids);
    storageStatus.textContent = '只在当前浏览器保存。请定期导出备份。';
  } catch {
    if (typeof lastStored === 'string') recoveryRaw = lastStored;
    writable = false;
    storageStatus.textContent = '本机存储不可用或已有数据无法读取。旧数据未覆盖；本页只暂存，请导出后再离开。';
  }

  function syncStorageFeedback() {
    for (const step of steps) {
      const warning = step.querySelector('[data-storage-warning]');
      const note = step.querySelector('[data-step-note]');
      warning.hidden = writable;
      const helpId = `help-${step.dataset.learningStep}`;
      note.setAttribute('aria-describedby', writable ? helpId : `${helpId} ${warning.id}`);
    }
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
      const nextTitle = target.querySelector('h3').textContent;
      continueLink.textContent = workspace.hasAttribute('data-practice-workspace') ? '继续自检' : `继续：${nextTitle}`;
      continueLink.setAttribute('aria-label', workspace.hasAttribute('data-practice-workspace') ? `继续自检：${nextTitle}` : continueLink.textContent);
      continueLink.href = `#${nextId}`;
    } else {
      resumeTitle.textContent = '这些自检都已有记录';
      continueLink.textContent = workspace.hasAttribute('data-practice-workspace') ? '回看路线' : '回看路线，挑一个问题再验证';
      continueLink.setAttribute('aria-label', continueLink.textContent);
      continueLink.href = `#${workspace.querySelector('[data-learning-path]').id}`;
    }
    syncStorageFeedback();
    workspace.dataset.learningReady = 'true';
    workspace.dispatchEvent(new Event('learning:render'));
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
    } finally {
      syncStorageFeedback();
    }
  }

  function renderImportPreview() {
    const keys = Object.keys(pendingImport.entries);
    const additions = keys.filter((id) => !Object.hasOwn(state.entries, id)).length;
    const summaryText = `备份包含 ${keys.length} 条记录，可补入 ${additions} 条。已有记录以本页为准；导入前不会改动任何记录。`;
    if (previewSummary.textContent !== summaryText) previewSummary.textContent = summaryText;
    confirmImport.disabled = additions === 0;
    const details = document.getElementById('learning-import-details');
    details.replaceChildren(...keys.map((id) => {
      const row = document.createElement('li');
      const title = steps.find((step) => step.dataset.learningStep === id).querySelector('h3').textContent;
      const incoming = pendingImport.entries[id];
      row.textContent = `${Object.hasOwn(state.entries, id) ? '保留本页记录' : '可补入'} · ${title} · 备份中${incoming.completed ? '已自检' : '未勾选'}，手记 ${incoming.note.length} 字符。`;
      return row;
    }));
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
    syncStorageFeedback();
  });

  function downloadRecord(value, filename, type) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type }));
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  document.getElementById('learning-export').addEventListener('click', () => {
    downloadRecord(state, 'brooks-learning-backup.json', 'application/json');
  });
  document.getElementById('learning-raw-recovery').hidden = recoveryRaw === null;
  document.getElementById('learning-export-raw').addEventListener('click', () => {
    if (recoveryRaw === null) return;
    // JSON escaping preserves even an unpaired UTF-16 surrogate in raw storage.
    // This diagnostic envelope is deliberately not an importable v1 backup.
    downloadRecord({ format: 'brooks-learning-raw-recovery', storage_key: LEARNING_KEY, raw_value: recoveryRaw }, 'brooks-learning-recovery.txt', 'text/plain');
    backupFeedback.textContent = '已生成打开本页时保留的原始存储恢复文件。它不是普通学习备份；本机原文未修改。';
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
      if (localStorage.getItem(LEARNING_KEY) !== lastStored) {
        writable = false;
        storageStatus.textContent = '其他标签页修改了记录，未清除。本页草稿与浏览器记录均保留；请先导出，再刷新。';
        backupFeedback.textContent = storageStatus.textContent;
        syncStorageFeedback();
        return;
      }
      localStorage.removeItem(LEARNING_KEY);
    } catch {
      writable = false;
      storageStatus.textContent = '无法清除本机存储，未重置本页草稿。当前内容仍可导出；浏览器原记录未由本页删除。';
      backupFeedback.textContent = storageStatus.textContent;
      syncStorageFeedback();
      return;
    }
    lastStored = null; writable = true; recoveryRaw = null;
    document.getElementById('learning-raw-recovery').hidden = true;
    storageStatus.textContent = '本机学习记录已清除，主题和校园收藏不受影响。';
    importRequest++; cancelImport(); state = emptyLearningState(); render();
    backupFeedback.textContent = storageStatus.textContent;
  });
  workspace.querySelectorAll('[data-learning-controls]').forEach((element) => { element.hidden = false; });
  render();
}
