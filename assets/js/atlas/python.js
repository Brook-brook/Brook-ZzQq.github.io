const examples = {
  basics:
    '# 变量、数据类型与条件判断\nname = "Brook"\nvisits = 3\nlatitude = 30.0\nprint(name, type(name).__name__)\nprint(visits, type(visits).__name__)\nprint(latitude, type(latitude).__name__)\n\nif visits >= 3:\n    print("Keep exploring!")\nelse:\n    print("Welcome to the Atlas")\n',
  loops:
    '# 函数、列表与循环\ndef mean(values):\n    if not values:\n        raise ValueError("Need at least one value")\n    return sum(values) / len(values)\n\nheights = [12, 18, 24]\nfor i, height in enumerate(heights, start=1):\n    print(f"Point {i}: {height} m")\n\nprint("Mean:", mean(heights))\n',
  dict: '# 字典与演示空间数据（不是个人位置）\nimport math\n\npoint = {"label": "Demo", "latitude": 60.0}\nphi = math.radians(point["latitude"])\nscale = 1 / math.cos(phi)\n\nprint(point["label"])\nprint(f"Spherical Mercator local scale: {scale:.3f}")\n'
};
const byId = (id) => document.getElementById(id);
const lab = byId('python-lab');
if (lab) {
  const selection = byId('python-example');
  const asyncSource = byId('python-async-source')?.content?.querySelector('code')?.textContent;
  if (asyncSource?.trim()) examples.async = asyncSource;
  else if (selection.querySelector('[value="async"]')) selection.querySelector('[value="async"]').disabled = true;
  // A public initial preset, never an automatic load/run or private query.
  if (location.hash === '#async-wait' && examples.async) selection.value = 'async';
  const editor = byId('python-code'),
    output = byId('python-output'),
    status = byId('python-status');
  const load = byId('python-load'),
    run = byId('python-run'),
    stop = byId('python-stop');
  let worker,
    timer,
    state = 'idle';
  function controls(next, message) {
    state = next;
    status.textContent = message;
    load.disabled = ['loading', 'ready', 'running'].includes(state);
    run.disabled = state !== 'ready';
    stop.disabled = !worker;
    byId('python-output-jump').hidden = output.textContent === '输出将在这里显示。';
    editor.readOnly = state === 'running';
    selection.disabled = state === 'running';
    byId('python-reset').disabled = state === 'running';
  }
  function dispose(message) {
    clearTimeout(timer);
    if (worker) worker.terminate();
    worker = undefined;
    controls('idle', message);
  }
  function restore() {
    editor.value = examples[selection.value];
    if (state === 'ready' && output.textContent !== '输出将在这里显示。')
      status.textContent = '示例已恢复。当前输出保留上次结果，运行后更新。';
  }
  byId('python-example').addEventListener('change', restore);
  byId('python-reset').addEventListener('click', restore);
  restore();
  controls('idle', status.textContent);
  editor.addEventListener('input', () => {
    if (state === 'ready' && output.textContent !== '输出将在这里显示。' &&
        status.textContent !== '代码已修改。当前输出保留上次结果，点击运行更新。')
      status.textContent = '代码已修改。当前输出保留上次结果，点击运行更新。';
  });
  load.addEventListener('click', () => {
    try {
      worker = new Worker(lab.dataset.worker);
      controls('loading', '正在下载并初始化 Python… 首次需要网络，请稍候。');
      timer = setTimeout(
        () => dispose('加载超过 60 秒。请检查网络后重试。'),
        60000
      );
      worker.onerror = () => {
        output.textContent = '运行时加载或 Worker 执行失败。';
        dispose('无法启动 Python，请检查网络后重试。');
      };
      worker.onmessage = ({ data }) => {
        clearTimeout(timer);
        if (data.type === 'ready')
          controls('ready', 'Python 已就绪。修改代码，然后点击运行。');
        if (data.type === 'load-error') {
          output.textContent = data.message;
          dispose('下载失败。可点击加载 Python 重试。');
        }
        if (data.type === 'result') {
          output.textContent =
            data.output + (data.error ? '\n' + data.error : '') ||
            '执行结束，无输出。请用 print() 查看结果。';
          controls(
            'ready',
            data.error
              ? '执行遇到错误，详见输出区。可以修改后重试。'
              : '执行完成。每次运行使用新的全局命名空间。'
          );
        }
      };
      worker.postMessage({ type: 'load' });
    } catch {
      dispose('当前浏览器无法启动 Worker。请使用现代浏览器重试。');
    }
  });
  run.addEventListener('click', () => {
    if (state !== 'ready') return;
    controls('running', '正在执行… 最长运行 5 秒，可以随时停止。');
    output.textContent = '运行中…';
    timer = setTimeout(() => {
      output.textContent = '程序超过 5 秒执行限制，Worker 已终止。';
      dispose('执行超时。修正代码后重新加载 Python。');
    }, 5000);
    worker.postMessage({ type: 'run', code: editor.value });
  });
  stop.addEventListener('click', () => {
    if (state === 'running') output.textContent = '运行时已停止，没有接收本次完整结果。';
    dispose('运行时已停止并释放。需要时可重新加载。');
  });
  window.addEventListener('pagehide', () => dispose('运行时已释放。'));
}
