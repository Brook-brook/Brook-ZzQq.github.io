import { connectionKinds, validateKnowledgeModel, knowledgeNeighborhood } from './knowledge-models.js';

const root = document.querySelector('[data-knowledge-connections]');
if (root) {
  const get = (id) => root.querySelector(`#${id}`);
  const select = get('connection-current'), controls = get('connection-controls');
  const region = get('connection-neighborhood'), status = get('connection-status');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let model, current, kind = 'all', animation;
  const element = (tag, text) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; };
  const anchor = (url, text) => { const node = element('a', text); node.href = url; return node; };

  function render(animate = false) {
    const view = knowledgeNeighborhood(model, current, kind);
    const note = get('connection-note'); note.replaceChildren();
    const heading = element('h3'); heading.append(anchor(view.note.url, view.note.title)); note.append(heading);
    note.append(element('p', view.note.summary));
    const actions = element('div'); actions.className = 'connection-note-links';
    actions.append(anchor(view.note.url, '阅读本篇'));
    if (view.note.lab_url) actions.append(anchor(view.note.lab_url, '打开对应实验'));
    note.append(actions);
    if (view.note.practice.length) {
      const details = element('details'), list = element('ul');
      details.append(element('summary', `在已有路线里练习（${view.note.practice.length} 题）`));
      for (const step of view.note.practice) {
        const item = element('li'); item.append(anchor(step.url, step.title)); list.append(item);
      }
      details.append(list); note.append(details);
    }
    for (const [name, rows] of Object.entries(view.groups)) {
      const group = root.querySelector(`[data-connection-group="${name}"]`);
      group.hidden = rows.length === 0;
      const list = group.querySelector('ul'); list.replaceChildren();
      for (const row of rows) {
        const item = element('li'); item.dataset.connectionId = row.link.id;
        const head = element('h4'); head.append(anchor(row.note.url, row.note.title)); item.append(head);
        item.append(element('p', row.link.reason));
        const links = element('div'); links.className = 'connection-row-links';
        links.append(element('span', connectionKinds[row.link.kind]));
        if (row.note.lab_url) links.append(anchor(row.note.lab_url, '对应实验'));
        item.append(links); list.append(item);
      }
    }
    const allCount = knowledgeNeighborhood(model, current).count;
    get('connection-empty').hidden = view.count > 0;
    get('connection-empty-text').textContent = allCount === 0 ?
      '这篇暂未编排跨笔记联系。可以阅读本篇，或沿已有路线练习。' :
      '这个类型暂未编排联系。可以换一种类型，或查看全部联系。';
    get('connection-show-all').hidden = allCount === 0 || kind === 'all';
    status.textContent = `当前笔记：${view.note.title}\n${view.count} 条${kind === 'all' ? '已编排' : connectionKinds[kind]}联系；这是阅读建议，不是完成记录。`;
    select.value = current;
    root.querySelectorAll('[data-connection-kind]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.connectionKind === kind)));
    animation?.cancel();
    if (animate && !motion.matches && region.animate)
      animation = region.animate([{ opacity: .7, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
  }

  function fromHash() {
    const match = location.hash.match(/^#connection-([a-z][a-z0-9-]{0,79})$/);
    return model.notes.some((note) => note.id === match?.[1]) ? match[1] : null;
  }

  select.addEventListener('change', () => {
    current = select.value;
    try { history.replaceState(history.state, '', `#connection-${current}`); } catch { /* optional public context */ }
    render(true);
  });
  controls.addEventListener('click', (event) => {
    const button = event.target.closest('[data-connection-kind]');
    if (!button) return;
    kind = button.dataset.connectionKind; render(true);
  });
  get('connection-show-all').addEventListener('click', () => { kind = 'all'; render(true); select.focus(); });
  const restore = () => { if (!model) return; const requested = fromHash(); if (requested && requested !== current) { current = requested; render(); } };
  window.addEventListener('hashchange', restore); window.addEventListener('popstate', restore);
  motion.addEventListener('change', () => { if (motion.matches) animation?.cancel(); });
  try {
    const text = root.querySelector('[data-knowledge-model]').textContent;
    if (text.length > 512 * 1024) throw new Error('Too large');
    model = validateKnowledgeModel(JSON.parse(text), root.dataset.base);
    current = fromHash() || (model.notes.some((note) => note.id === 'reading-ai-evidence') ? 'reading-ai-evidence' : model.notes[0].id);
    render(); controls.hidden = false; region.hidden = false;
    get('connection-directory').open = false;
  } catch {
    status.textContent = '学习连接无法校验，请使用下方完整目录与笔记继续阅读。没有改写任何本机记录。';
  }
}
