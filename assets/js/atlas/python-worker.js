/* global loadPyodide */
let runtime;
self.onmessage = async ({ data }) => {
  if (data.type === 'load') {
    try {
      importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
      runtime = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'
      });
      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({ type: 'load-error', message: String(error) });
    }
    return;
  }
  if (data.type !== 'run' || !runtime) return;
  let output = '',
    capped = false;
  const write = (text) => {
    const remaining = 20000 - output.length;
    if (remaining > 0) {
      const line = text + '\n';
      output += line.slice(0, remaining);
      if (line.length > remaining) capped = true;
    } else capped = true;
  };
  runtime.setStdout({ batched: write });
  runtime.setStderr({ batched: write });
  runtime.setStdin({ stdin: () => undefined });
  const globals = runtime.globals.get('dict')();
  let errorText = '';
  try {
    const result = await runtime.runPythonAsync(data.code, { globals });
    if (result && typeof result.destroy === 'function') result.destroy();
  } catch (error) {
    errorText = String(error).slice(0, 6000);
  } finally {
    globals.destroy();
  }
  self.postMessage({
    type: 'result',
    output: output + (capped ? '\n[输出已截断为 20,000 字符]\n' : ''),
    error: errorText
  });
};
