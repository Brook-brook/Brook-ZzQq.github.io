import { createDelivery, sendDelivery, lookupDelivery, deliveryView, deliveryReport } from './delivery-models.js';

const root = document.getElementById('delivery-lab');
if (root) {
  const byId = (name) => document.getElementById(`delivery-${name}`);
  const mode = byId('mode'), fault = byId('fault'), key = byId('key'), units = byId('units');
  const send = byId('send'), lookup = byId('lookup'), reset = byId('reset'), download = byId('export');
  const status = byId('state'), detail = byId('detail');
  const numbers = new Map([['1', 1], ['2', 2], ['3', 3]]);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let state = createDelivery({ mode: mode.value, first_fault: fault.value }), animation;
  const labels = {
    applied: ['回执已匹配。', '接收端本次应用了操作。回执中的累计值是这次操作之后的快照。'],
    replayed: ['取回同一份回执。', '同key同参数命中本组幂等记录，没有再次增加。旧回执不保证是当前最新总值。'],
    found: ['核对到了原回执。', '本次只查询，没有再次写入。结果只在本模型的串行内存契约下成立。'],
    conflict: ['key与参数不匹配。', '没有再次应用。若要核对旧操作，先恢复它当时的参数；换key则表示新操作。'],
    not_found: ['这组缓存没有该回执。', '当前没有可匹配结果；真实系统还可能发生过期、重启或丢记录，不能一概改写成未执行。'],
    lookup_unavailable: ['普通模式没有按key的回执查询。', '未知结果仍未解决；此处不把空结果补成未执行或成功。'],
    write_limit: ['接收端应用上限已到。', '保留已发生的结果；停止不等于完成。']
  };
  function render() {
    const view = deliveryView(state), locked = view.write_attempts > 0;
    mode.value = state.config.mode; fault.value = state.config.first_fault;
    mode.disabled = locked; fault.disabled = locked; key.disabled = false; units.disabled = false;
    send.disabled = view.write_attempts >= 6; lookup.disabled = view.write_attempts === 0 || view.lookup_attempts >= 6;
    reset.disabled = false; download.disabled = state.events.length === 0;
    if (view.current_status === 'not_sent') {
      status.textContent = '尚未发送。'; detail.textContent = '先预测当前设置下能否确认结果，再点击发送。选项改动还没有执行。';
    } else if (view.current_status === 'unknown') {
      status.textContent = '结果未知：没有收到回执。';
      detail.textContent = '不能据此判断是否应用。保留未知，再选择重新发送或核对；下方是教学透视。';
    } else {
      const message = labels[view.response_kind] || ['未取得结果。', '保留当前记录并核对输入。'];
      status.textContent = message[0]; detail.textContent = message[1];
    }
    byId('counts').textContent = `发送尝试${view.write_attempts}次，核对${view.lookup_attempts}次，收到响应${view.responses_received}份，匹配回执${view.accepted_observations}份。`;
    const matched = byId('confirmed'); matched.hidden = !view.receipt;
    matched.textContent = view.receipt ? `已匹配${view.receipt.key} / ${view.receipt.id}：增加${view.receipt.units}，当时累计${view.receipt.value_after}。` : '';
    byId('value').textContent = String(state.receiver.value); byId('writes').textContent = String(state.receiver.writes);
    const cache = byId('cache');
    const rows = state.receiver.receipts.map((receipt) => {
      const li = document.createElement('li');
      li.textContent = `${receipt.key} / ${receipt.id}：增加${receipt.units}，当时累计${receipt.value_after}。`; return li;
    });
    if (!rows.length) { const li = document.createElement('li'); li.textContent = state.config.mode === 'plain' ? '普通模式不按key保存回执。' : '本组还没有保存回执。'; rows.push(li); }
    cache.replaceChildren(...rows);
    const events = state.events.map((event, index) => {
      const li = document.createElement('li');
      const action = event.type === 'write' ? '发送' : '核对';
      li.textContent = `${index + 1}：${action}${event.command.key}，参数${event.command.units}；${event.response ? event.response.status : '未收到回执'}。`; return li;
    });
    if (!events.length) { const li = document.createElement('li'); li.textContent = '尚无操作。'; events.push(li); }
    byId('events').replaceChildren(...events);
    byId('json').textContent = JSON.stringify(deliveryReport(state), null, 2);
  }
  function settle() {
    animation?.cancel();
    if (!reduced.matches && typeof byId('detail').animate === 'function')
      animation = byId('detail').animate([{ opacity: .65, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  function act(operation) {
    try { state = operation(state, key.value, numbers.get(units.value)); render(); settle(); }
    catch {
      status.textContent = '当前设置无效或本组上限已到。';
      detail.textContent = '保留已有记录。请核对选项，或下载后重置；没有补出新的成功结果。';
      byId('confirmed').hidden = true; byId('confirmed').textContent = '';
    }
  }
  send.addEventListener('click', () => act(sendDelivery));
  lookup.addEventListener('click', () => act(lookupDelivery));
  reset.addEventListener('click', () => { state = createDelivery({ mode: mode.value, first_fault: fault.value }); render(); settle(); });
  for (const control of [mode, fault]) control.addEventListener('change', () => {
    if (deliveryView(state).write_attempts === 0) {
      try { state = createDelivery({ mode: mode.value, first_fault: fault.value }); } catch { status.textContent = '请选择有效的实验设置。'; return; }
    }
    render();
  });
  byId('observer-jump').addEventListener('click', () => byId('receiver').focus());
  download.addEventListener('click', () => {
    const report = deliveryReport(state), url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2) + '\n'], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'brook-delivery-practice.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 0);
  });
  reduced.addEventListener('change', () => { if (reduced.matches) animation?.cancel(); });
  window.addEventListener('pagehide', () => animation?.cancel());
  render();
}
