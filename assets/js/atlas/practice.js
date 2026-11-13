import { filterPracticeQuestions, nextPracticeQuestion } from './practice-models.js';

const workspace = document.querySelector('[data-practice-workspace]');
if (workspace) {
  let initialized = false;
  let refresh = null;
  function initialize() {
    if (initialized || workspace.dataset.learningReady !== 'true') return;
    initialized = true;
    try {
      const steps = [...workspace.querySelectorAll('[data-learning-step]')];
      const byId = new Map(steps.map((step) => [step.dataset.learningStep, step]));
      const paths = [...workspace.querySelectorAll('[data-learning-path]')];
      const topic = workspace.querySelector('#practice-path');
      const query = workspace.querySelector('#practice-query');
      const pick = workspace.querySelector('#practice-pick');
      const next = workspace.querySelector('#practice-next');
      const status = workspace.querySelector('#practice-status');
      const resumeId = workspace.querySelector('#learning-continue').getAttribute('href').slice(1);
      let selected = byId.has(location.hash.slice(1)) ? location.hash.slice(1) : byId.has(resumeId) ? resumeId : steps[0].dataset.learningStep;
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
      let questionMotion;
      reducedMotion.addEventListener?.('change', () => { if (reducedMotion.matches) questionMotion?.cancel(); });
      window.addEventListener('pagehide', () => questionMotion?.cancel());
      let composing = false;
      const questions = () => steps.map((step) => ({
        id: step.dataset.learningStep, path: step.closest('[data-learning-path]').id,
        title: step.querySelector('h3').textContent, question: step.querySelector('.learning-question').textContent,
        note: step.querySelector('[data-step-note]').value
      }));
      function matches() { return filterPracticeQuestions(questions(), query.value, topic.value); }
      function render() {
        const ids = matches();
        // Keep the worksheet pinned while filtering or editing. Only an explicit
        // question selection changes it, so a draft never disappears mid-input.
        for (const step of steps) step.hidden = step.dataset.learningStep !== selected;
        for (const path of paths) path.hidden = !path.contains(byId.get(selected));
        workspace.querySelectorAll('[data-practice-jump]').forEach((link) => {
          if (link.dataset.practiceJump === selected) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
        const choices = ids.includes(selected) ? ids : [selected, ...ids];
        const before = [...pick.options].map((option) => option.value).join('|');
        if (before !== choices.join('|')) {
          pick.replaceChildren(...choices.map((id) => {
            const option = document.createElement('option'); option.value = id;
            option.textContent = `${ids.includes(id) ? '' : '当前保留：'}${byId.get(id).querySelector('h3').textContent}`;
            return option;
          }));
        } else {
          for (const option of pick.options) option.textContent = `${ids.includes(option.value) ? '' : '当前保留：'}${byId.get(option.value).querySelector('h3').textContent}`;
        }
        pick.value = selected;
        next.disabled = !ids.some((id) => id !== selected);
        const message = `${ids.length} 个匹配问题。${ids.includes(selected) ? '当前问题保留。' : '当前问题不在筛选中，仍保留草稿；选题或清空筛选后继续。'}`;
        if (status.textContent !== message) status.textContent = message;
      }
      function choose(id, focus = false) {
        if (!byId.has(id)) return;
        const changed = selected !== id;
        selected = id; render();
        if (focus) byId.get(id).querySelector('h3').focus();
        if (changed) {
          questionMotion?.cancel();
          const step = byId.get(id);
          if (!reducedMotion.matches && typeof step.animate === 'function') questionMotion = step.animate(
            [{ opacity: .8, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }],
            { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' }
          );
        }
      }
      topic.addEventListener('change', render);
      query.addEventListener('compositionstart', () => { composing = true; });
      query.addEventListener('compositionend', () => { composing = false; render(); });
      query.addEventListener('input', (event) => { if (!composing && !event.isComposing) render(); });
      pick.addEventListener('change', () => choose(pick.value, true));
      next.addEventListener('click', () => { const id = nextPracticeQuestion(matches(), selected); if (id) choose(id, true); });
      workspace.querySelector('#practice-reset').addEventListener('click', () => { topic.value = 'all'; query.value = ''; composing = false; render(); query.focus(); });
      workspace.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');
        if (!link || !workspace.contains(link)) return;
        const id = link.getAttribute('href').slice(1);
        if (byId.has(id)) choose(id);
        else if (paths.some((path) => path.id === id)) choose(workspace.querySelector(`#${id} [data-learning-step]`).dataset.learningStep);
      });
      window.addEventListener('hashchange', () => {
        if (byId.has(location.hash.slice(1))) choose(location.hash.slice(1));
      });
      refresh = () => { if (!composing) render(); };
      workspace.dataset.practiceReady = 'true';
      workspace.querySelectorAll('[data-practice-controls]').forEach((node) => { node.hidden = false; });
      render();
    } catch {
      workspace.removeAttribute('data-practice-ready');
      workspace.querySelectorAll('[data-learning-step], [data-learning-path]').forEach((node) => { node.hidden = false; });
      workspace.querySelectorAll('[data-practice-controls]').forEach((node) => { node.hidden = true; });
      // Native questions/references and the original journal remain available.
    }
  }
  workspace.addEventListener('learning:render', () => { if (!initialized) initialize(); else refresh?.(); });
  initialize();
}
