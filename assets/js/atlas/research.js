import {
  analyzeResearchEntries,
  RESEARCH_MAX_BYTES,
  RESEARCH_MAX_ENTRIES,
  ResearchInputError
} from './research-models.js';

const form = document.getElementById('research-form');
const input = document.getElementById('research-xml');
const run = document.getElementById('research-run');
const sample = document.getElementById('research-example');
const load = document.getElementById('research-load');
const tracking = document.getElementById('research-tracking');
const status = document.getElementById('research-status');
const results = document.getElementById('research-results');
const decisions = document.getElementById('research-decisions');
const rows = document.getElementById('research-rows');
const json = document.getElementById('research-json');
const download = document.getElementById('research-download');
const initialRss = input?.defaultValue;
const atomExample = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>本地练习样本</title>
  <entry>
    <title>练习：检查空间分辨率</title>
    <link href="https://example.test/dataset?id=1&amp;utm_source=lab#note"/>
  </entry>
  <entry>
    <title>同一链接的另一条记录</title>
    <link href="https://example.test/dataset?id=1"/>
  </entry>
  <entry>
    <title>练习：记录时间范围</title>
    <link href="https://example.test/dataset?id=2"/>
  </entry>
  <entry><title>这条缺少链接</title></entry>
</feed>`;
const atomNamespace = 'http://www.w3.org/2005/Atom';
let exportText = null;
let hasRun = false;

function children(element, name, namespace = null) {
  return [...element.children].filter((child) =>
    child.localName === name && child.namespaceURI === namespace
  );
}

function parseFeed(text) {
  if (new TextEncoder().encode(text).byteLength > RESEARCH_MAX_BYTES) {
    throw new ResearchInputError('byte_limit', '输入超过 50 KB，请缩小样本后重试。');
  }
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/iu.test(text)) {
    throw new ResearchInputError('xml_declaration', '练习不接受 DTD 或实体声明，请移除后重试。');
  }
  const parsed = new DOMParser().parseFromString(text, 'application/xml');
  if (parsed.getElementsByTagName('parsererror').length) {
    throw new ResearchInputError('invalid_xml', 'XML 无法解析。检查闭合标签，以及链接中的 & 是否写为 &amp;。');
  }
  const root = parsed.documentElement;
  let entries;
  let sourceFormat;
  if (root.localName === 'rss' && !root.namespaceURI && root.getAttribute('version') === '2.0') {
    const channel = children(root, 'channel')[0];
    if (!channel) throw new ResearchInputError('missing_channel', 'RSS 2.0 需要 channel 元素。');
    sourceFormat = 'rss';
    entries = children(channel, 'item').map((item) => ({
      title: children(item, 'title')[0]?.textContent || '',
      url: children(item, 'link')[0]?.textContent || ''
    }));
  } else if (root.localName === 'feed' && root.namespaceURI === atomNamespace) {
    sourceFormat = 'atom';
    entries = children(root, 'entry', atomNamespace).map((entry) => ({
      title: children(entry, 'title', atomNamespace)[0]?.textContent || '',
      url: children(entry, 'link', atomNamespace).find((link) =>
        !link.hasAttribute('rel') || link.getAttribute('rel') === 'alternate'
      )?.getAttribute('href') || ''
    }));
  } else {
    throw new ResearchInputError('unsupported_feed', '仅支持 RSS 2.0 或带标准命名空间的 Atom feed。');
  }
  if (entries.length > RESEARCH_MAX_ENTRIES) {
    throw new ResearchInputError('entry_limit', '输入超过 200 条，请缩小样本后重试。');
  }
  return { entries, sourceFormat };
}

function invalidate(message) {
  exportText = null;
  download.disabled = true;
  results.hidden = true;
  decisions.hidden = true;
  rows.replaceChildren();
  json.value = '';
  input.removeAttribute('aria-invalid');
  if (status.textContent !== message) status.textContent = message;
  status.dataset.state = 'idle';
}

function renderRows(items) {
  const names = { kept: '保留', duplicate: '重复', invalid: '需修正' };
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const li = document.createElement('li');
    li.dataset.result = item.status;
    const heading = document.createElement('h3');
    heading.textContent = `${item.index}. ${item.title}`;
    const badge = document.createElement('span');
    badge.className = 'research-row-state';
    badge.textContent = names[item.status];
    const reason = document.createElement('p');
    reason.textContent = item.reason;
    li.append(badge, heading, reason);
    for (const [label, value] of [['原始链接', item.original_url], ['规范化后', item.canonical_url]]) {
      if (!value) continue;
      const p = document.createElement('p');
      p.className = 'research-row-url';
      const prefix = document.createElement('span');
      prefix.textContent = label;
      const code = document.createElement('code');
      code.textContent = value;
      p.append(prefix, code);
      li.append(p);
    }
    fragment.append(li);
  }
  rows.replaceChildren(fragment);
}

if (form && input) {
  run.disabled = false;
  load.disabled = false;
  const changed = () => invalidate(hasRun
    ? '输入或规则已变化，请重新运行后核对与下载。'
    : '样本已修改，运行后查看规范化与去重结果。');
  input.addEventListener('input', changed);
  tracking.addEventListener('change', changed);
  load.addEventListener('click', () => {
    input.value = sample.value === 'atom' ? atomExample : initialRss;
    invalidate(`已载入 ${sample.value === 'atom' ? 'Atom' : 'RSS 2.0'} 自编样本，运行后核对结果。`);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    hasRun = true;
    invalidate('正在解析当前输入。');
    form.setAttribute('aria-busy', 'true');
    try {
      const { entries, sourceFormat } = parseFeed(input.value);
      const analysis = analyzeResearchEntries(entries, {
        sourceFormat, removeTracking: tracking.checked
      });
      const counts = analysis.counts;
      document.getElementById('research-kept').textContent = counts.kept;
      document.getElementById('research-duplicates').textContent = counts.duplicate;
      document.getElementById('research-invalid').textContent = counts.invalid;
      json.value = JSON.stringify(analysis.output, null, 2);
      renderRows(analysis.rows);
      results.hidden = false;
      decisions.hidden = counts.input === 0;
      status.dataset.state = 'complete';
      status.textContent = counts.input
        ? `已处理 ${counts.input} 条：保留 ${counts.kept} 条，重复 ${counts.duplicate} 条，需修正 ${counts.invalid} 条。${counts.kept ? '结果尚未人工复核。' : '没有可导出的有效记录。'}`
        : 'XML 有效，但没有找到 item 或 entry。请添加条目后重试。';
      exportText = counts.kept ? json.value : null;
      download.disabled = exportText === null;
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error instanceof ResearchInputError
        ? error.message
        : '本次处理失败。请检查输入，或重新载入练习样本。';
      if (error instanceof ResearchInputError) {
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      }
    } finally {
      form.removeAttribute('aria-busy');
    }
  });
  download.addEventListener('click', () => {
    if (!exportText) return;
    const objectUrl = URL.createObjectURL(new Blob([exportText], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'research-records.json';
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    status.textContent = '已导出当前待复核 JSON。文件没有被上传或发布。';
  });
}
