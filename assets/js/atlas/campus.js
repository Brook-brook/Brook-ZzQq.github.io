import {
  categories,
  filterPlaces,
  projectPlaces,
  clampView,
  validateCampus
} from './campus-model.js';
const root = document.querySelector('[data-campus]');
const $ = (id) => document.getElementById(id);
if (root) {
  const canvas = $('campus-canvas'),
    world = $('map-world'),
    list = $('campus-list');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const sessionKey = 'atlas-campus-view-v1',
    favoriteKey = 'atlas-campus-favorites-v1';
  let places = [],
    view = { zoom: 1, x: 0, y: 0 },
    category = 'all',
    query = '',
    onlyFavorites = false,
    selected = null,
    favorites = [],
    layers = { grid: true, points: true, labels: false },
    drag,
    frame,
    lastTrigger;
  try {
    const f = JSON.parse(localStorage.getItem(favoriteKey));
    if (Array.isArray(f)) favorites = f.filter((v) => typeof v === 'string');
  } catch {
    /* optional storage */
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey));
    if (saved) {
      view = clampView(saved.view || {});
      selected = typeof saved.selected === 'string' ? saved.selected : null;
      category = categories[saved.category] ? saved.category : 'all';
      query = typeof saved.query === 'string' ? saved.query : '';
      onlyFavorites = saved.onlyFavorites === true;
      for (const key of Object.keys(layers))
        if (typeof saved.layers?.[key] === 'boolean')
          layers[key] = saved.layers[key];
    }
  } catch {
    /* optional storage */
  }
  function persist() {
    try {
      sessionStorage.setItem(
        sessionKey,
        JSON.stringify({
          view,
          category,
          query,
          onlyFavorites,
          selected,
          layers
        })
      );
    } catch {
      /* navigation still works */
    }
  }
  function updateListHint() {
    const hint = $('campus-list-hint');
    hint.hidden = list.hidden || list.scrollHeight <= list.clientHeight + 2;
    hint.textContent =
      list.scrollTop + list.clientHeight >= list.scrollHeight - 2
        ? '已到地点列表末尾。'
        : '滚动列表，查看其余地点。';
  }
  function announce(message) {
    $('campus-status').textContent = message;
  }
  function feedback(element) {
    if (!motion.matches && element)
      element.animate(
        [
          { opacity: 0.55, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        { duration: 350, easing: 'cubic-bezier(.22,1,.36,1)' }
      );
  }
  function transform() {
    world.style.transform = `translate(${view.x * canvas.clientWidth}px, ${view.y * canvas.clientHeight}px) scale(${view.zoom})`;
    world.style.setProperty('--inverse-zoom', String(1 / view.zoom));
    $('map-zoom').textContent = `×${view.zoom.toFixed(1)}`;
    $('map-zoom-in').disabled = view.zoom >= 3;
    $('map-zoom-out').disabled = view.zoom <= 1;
  }
  function draw() {
    if (!places.length) return;
    const width = canvas.clientWidth,
      height = canvas.clientHeight;
    const points = projectPlaces(places, width, height);
    // A coordinate-space grid, not invented roads or building footprints.
    const svg = $('campus-graticule');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.replaceChildren();
    const grid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grid.id = 'map-grid-lines';
    svg.append(grid);
    grid.toggleAttribute('hidden', !layers.grid);
    for (let x = 0; x < width; x += 48) line(x, 0, x, height);
    for (let y = 0; y < height; y += 48) line(0, y, width, y);
    function line(x1, y1, x2, y2) {
      const node = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      for (const [key, value] of Object.entries({ x1, y1, x2, y2 }))
        node.setAttribute(key, value);
      grid.append(node);
    }
    // Callout leaders keep close POIs separately clickable without changing coordinates.
    const placed = [];
    for (const point of points) {
      const offsets = [
        [0, 0],
        [0, -58],
        [58, 0],
        [-58, 0],
        [0, 58],
        [58, -58],
        [-58, 58]
      ];
      const candidate =
        offsets
          .map(([dx, dy]) => ({ x: point.x + dx, y: point.y + dy }))
          .find(
            (p) =>
              p.x > 24 &&
              p.x < width - 24 &&
              p.y > 30 &&
              p.y < height - 50 &&
              placed.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= 51)
          ) || point;
      placed.push(candidate);
      const pin = document.querySelector(`[data-pin="${point.id}"]`);
      pin.style.left = `${candidate.x}px`;
      pin.style.top = `${candidate.y}px`;
      if (Math.hypot(candidate.x - point.x, candidate.y - point.y) > 1) {
        const path = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path'
        );
        path.setAttribute(
          'd',
          `M${point.x},${point.y}L${candidate.x},${candidate.y}`
        );
        path.classList.add('pin-leader');
        path.dataset.placeAnchor = point.id;
        svg.append(path);
        const dot = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle'
        );
        dot.setAttribute('cx', point.x);
        dot.setAttribute('cy', point.y);
        dot.setAttribute('r', '3');
        dot.classList.add('pin-anchor');
        dot.dataset.placeAnchor = point.id;
        svg.append(dot);
      }
    }
    updateAnchors(
      new Set(
        filterPlaces(places, { category, query, favorites, onlyFavorites }).map(
          (p) => p.id
        )
      )
    );
    transform();
  }
  function updateAnchors(ids) {
    root
      .querySelectorAll('[data-place-anchor]')
      .forEach((e) =>
        e.toggleAttribute(
          'hidden',
          !layers.points || !ids.has(e.dataset.placeAnchor)
        )
      );
  }
  function favoriteUI() {
    for (const p of places) {
      const saved = favorites.includes(p.id);
      const button = root.querySelector(`[data-favorite="${p.id}"]`);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute(
        'aria-label',
        `${saved ? '取消收藏' : '收藏'}${p.name}`
      );
    }
    if (selected) {
      const saved = favorites.includes(selected);
      $('detail-favorite').textContent = `${saved ? '已收藏' : '收藏地点'}`;
      $('detail-favorite').setAttribute('aria-pressed', String(saved));
    }
  }
  function toggleFavorite(id) {
    favorites = favorites.includes(id)
      ? favorites.filter((v) => v !== id)
      : [...favorites, id];
    let stored = true;
    try {
      localStorage.setItem(favoriteKey, JSON.stringify(favorites));
    } catch {
      stored = false;
    }
    favoriteUI();
    render();
    announce(
      `${places.find((p) => p.id === id).name}${favorites.includes(id) ? '已收藏' : '已取消收藏'}${stored ? '。收藏保存在此浏览器。' : '。浏览器禁用了持久存储，仅在本页有效。'}`
    );
  }
  function select(id, trigger, notify = true) {
    const place = places.find((p) => p.id === id);
    if (!place) return;
    selected = id;
    if (trigger) lastTrigger = trigger;
    $('detail-title').textContent = place.name;
    $('detail-category').textContent = categories[place.category];
    $('detail-description').textContent = place.description;
    const [lon, lat] = place.coordinates;
    $('detail-coordinates').textContent =
      `${lat.toFixed(5)}° N / ${lon.toFixed(5)}° E`;
    $('map-coordinates').textContent =
      `${lat.toFixed(5)}° N / ${lon.toFixed(5)}° E`;
    $('detail-source').href = `https://www.openstreetmap.org/${place.osm}`;
    const detail = $('campus-detail');
    const changed = detail.dataset.selectedPlace !== id;
    detail.dataset.selectedPlace = id;
    detail.hidden = false;
    draw();
    root.querySelectorAll('[data-pin]').forEach((pin) => {
      pin.setAttribute('aria-pressed', String(pin.dataset.pin === id));
    });
    root
      .querySelectorAll('[data-place]')
      .forEach((card) =>
        card.classList.toggle('is-selected', card.dataset.place === id)
      );
    favoriteUI();
    persist();
    if (notify) {
      announce(`已选择${place.name}，已打开地点详情。`);
      detail.focus({ preventScroll: true });
      detail.scrollIntoView({
        block: 'nearest',
        behavior: motion.matches ? 'auto' : 'smooth'
      });
      if (changed) feedback(detail);
    }
  }
  function closeDetail() {
    selected = null;
    $('campus-detail').hidden = true;
    draw();
    root
      .querySelectorAll('[data-pin]')
      .forEach((pin) => pin.setAttribute('aria-pressed', 'false'));
    root
      .querySelectorAll('[data-place]')
      .forEach((card) => card.classList.remove('is-selected'));
    $('map-coordinates').textContent = 'WGS84 / 地点代表点';
    persist();
  }
  function render() {
    const shown = filterPlaces(places, {
      category,
      query,
      favorites,
      onlyFavorites
    });
    const ids = new Set(shown.map((p) => p.id));
    root.querySelectorAll('[data-place]').forEach((card) => {
      card.hidden = !ids.has(card.dataset.place);
    });
    root.querySelectorAll('[data-pin]').forEach((pin) => {
      pin.hidden = !layers.points || !ids.has(pin.dataset.pin);
    });
    if (selected && !ids.has(selected)) closeDetail();
    $('campus-count').textContent = `${shown.length} / ${places.length} 个地点`;
    const activeInList = list.contains(document.activeElement);
    list.hidden = shown.length === 0;
    $('campus-empty').hidden = shown.length !== 0;
    if (!shown.length && activeInList)
      $('campus-clear').focus({ preventScroll: true });
    $('campus-empty-text').textContent = ['dining', 'housing'].includes(
      category
    )
      ? '这类地点尚未收录核实坐标。可以打开官方校园图查看，或先探索其他分类。'
      : onlyFavorites
        ? '这里还没有匹配的收藏。点击地点旁的心形按钮，留下想去的坐标。'
        : '没有匹配的地点。换个关键词，或回到全部地点。';
    root
      .querySelectorAll('[data-category]')
      .forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.category === category))
      );
    $('favorites-only').setAttribute('aria-pressed', String(onlyFavorites));
    root
      .querySelectorAll('[data-layer]')
      .forEach((b) =>
        b.setAttribute('aria-pressed', String(layers[b.dataset.layer]))
      );
    $('map-grid-lines')?.toggleAttribute('hidden', !layers.grid);
    updateAnchors(ids);
    $('campus-markers').classList.toggle('show-labels', layers.labels);
    updateListHint();
    persist();
  }
  async function load() {
    $('campus-retry').hidden = true;
    $('map-loading').hidden = false;
    $('map-load-message').textContent = '正在读取本地地点数据…';
    canvas.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(root.dataset.url, {
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) throw new Error('数据请求失败');
      places = validateCampus(await response.json());
      favorites = favorites.filter((id) => places.some((p) => p.id === id));
      const fragment = document.createDocumentFragment();
      for (const p of places) {
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'campus-pin';
        pin.dataset.pin = p.id;
        pin.setAttribute('aria-label', `查看${p.name}的地点详情`);
        pin.setAttribute('aria-pressed', 'false');
        const icon = document.createElement('span');
        icon.className = 'pin-icon';
        icon.setAttribute('aria-hidden', 'true');
        const svg = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        );
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.5');
        svg.classList.add('atlas-icon');
        const use = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'use'
        );
        const icons = new URL('../../img/atlas/icons.svg', import.meta.url);
        use.setAttribute('href', `${icons.href}#${p.icon}`);
        svg.append(use);
        icon.append(svg);
        const label = document.createElement('span');
        label.className = 'pin-label';
        label.textContent = p.name;
        pin.append(icon, label);
        pin.addEventListener('click', () => {
          if (!drag?.moved) select(p.id, pin);
        });
        fragment.append(pin);
      }
      $('campus-markers').replaceChildren(fragment);
      root.querySelectorAll('[data-map-control]').forEach((el) => {
        el.hidden = false;
      });
      $('campus-search').value = query;
      $('map-loading').hidden = true;
      canvas.setAttribute('aria-busy', 'false');
      draw();
      render();
      favoriteUI();
      if (selected && places.some((p) => p.id === selected))
        select(selected, null, false);
      announce(
        `本地地点数据已就绪，当前显示 ${filterPlaces(places, { category, query, favorites, onlyFavorites }).length} 个地点。`
      );
    } catch {
      canvas.setAttribute('aria-busy', 'false');
      $('map-load-message').textContent =
        '地点数据暂时没有加载成功。下方来源链接仍可使用。';
      $('campus-retry').hidden = false;
      announce('地点数据加载失败，可重试。');
    }
  }
  root
    .querySelectorAll('[data-select]')
    .forEach((b) =>
      b.addEventListener('click', () => select(b.dataset.select, b))
    );
  root
    .querySelectorAll('[data-favorite]')
    .forEach((b) =>
      b.addEventListener('click', () => toggleFavorite(b.dataset.favorite))
    );
  $('detail-favorite').addEventListener('click', () => {
    if (selected) toggleFavorite(selected);
  });
  $('detail-close').addEventListener('click', () => {
    closeDetail();
    if (lastTrigger?.isConnected && lastTrigger.getClientRects().length)
      lastTrigger.focus();
    else canvas.focus({ preventScroll: true });
  });
  $('campus-retry').addEventListener('click', load);
  root.querySelectorAll('[data-category]').forEach((b) =>
    b.addEventListener('click', () => {
      category = b.dataset.category;
      render();
      announce(`${categories[category]}：${$('campus-count').textContent}`);
      feedback($('campus-empty').hidden ? list : $('campus-empty'));
    })
  );
  $('campus-search').addEventListener('input', (event) => {
    query = event.target.value;
    render();
    announce(`搜索结果：${$('campus-count').textContent}`);
  });
  $('favorites-only').addEventListener('click', () => {
    onlyFavorites = !onlyFavorites;
    render();
    announce(
      `${onlyFavorites ? '只看收藏' : '显示全部'}：${$('campus-count').textContent}`
    );
  });
  $('campus-clear').addEventListener('click', () => {
    category = 'all';
    query = '';
    onlyFavorites = false;
    $('campus-search').value = '';
    render();
  });
  root.querySelectorAll('[data-layer]').forEach((b) =>
    b.addEventListener('click', () => {
      const key = b.dataset.layer;
      layers[key] = !layers[key];
      render();
      announce(`${b.textContent}图层已${layers[key] ? '显示' : '隐藏'}。`);
    })
  );
  function zoom(factor) {
    const next = Math.max(1, Math.min(3, view.zoom * factor));
    const ratio = next / view.zoom;
    view = clampView({
      zoom: next,
      x: 0.5 + (view.x - 0.5) * ratio,
      y: 0.5 + (view.y - 0.5) * ratio
    });
    transform();
    persist();
    announce(`地图缩放 ${view.zoom.toFixed(1)} 倍。`);
  }
  function reset() {
    view = { zoom: 1, x: 0, y: 0 };
    transform();
    persist();
    announce('地图视图已复位。');
  }
  $('map-zoom-in').addEventListener('click', () => zoom(1.25));
  $('map-zoom-out').addEventListener('click', () => zoom(0.8));
  $('map-reset').addEventListener('click', reset);
  canvas.addEventListener('keydown', (event) => {
    if (event.target !== canvas) return;
    const moves = {
      ArrowLeft: [0.05, 0],
      ArrowRight: [-0.05, 0],
      ArrowUp: [0, 0.05],
      ArrowDown: [0, -0.05]
    };
    if (moves[event.key]) {
      event.preventDefault();
      view = clampView({
        ...view,
        x: view.x + moves[event.key][0],
        y: view.y + moves[event.key][1]
      });
      transform();
      persist();
    } else if (['+', '=', '-'].includes(event.key)) {
      event.preventDefault();
      zoom(event.key === '-' ? 0.8 : 1.25);
    } else if (event.key === 'Home') {
      event.preventDefault();
      reset();
    }
  });
  canvas.addEventListener(
    'wheel',
    (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      zoom(event.deltaY < 0 ? 1.08 : 1 / 1.08);
    },
    { passive: false }
  );
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button')) return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: { ...view },
      moved: false
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y;
    drag.moved = drag.moved || Math.hypot(dx, dy) > 4;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!drag) return;
      view = clampView({
        ...view,
        x: drag.start.x + dx / canvas.clientWidth,
        y: drag.start.y + dy / canvas.clientHeight
      });
      transform();
    });
  });
  function stopDrag() {
    cancelAnimationFrame(frame);
    drag = null;
    canvas.classList.remove('is-dragging');
    persist();
  }
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  $('map-sidebar-toggle').addEventListener('click', (event) => {
    const button = event.currentTarget,
      expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    button.textContent = expanded ? '展开地点栏' : '收起地点栏';
    if (!expanded) feedback($('campus-sidebar'));
    $('campus-sidebar').hidden = expanded;
    root
      .querySelector('.campus-map-layout')
      .classList.toggle('sidebar-closed', expanded);
    announce(`地点栏已${expanded ? '收起' : '展开'}。`);
  });
  document.addEventListener('keydown', (event) => {
    if (
      event.key === '/' &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) &&
      !$('campus-search').hidden
    ) {
      event.preventDefault();
      if ($('campus-sidebar').hidden) $('map-sidebar-toggle').click();
      $('campus-search').focus();
    }
    if (
      event.key === 'Escape' &&
      !$('campus-detail').hidden &&
      root.contains(document.activeElement)
    )
      $('detail-close').click();
  });
  motion.addEventListener('change', () => {
    if (motion.matches)
      root.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  });
  new ResizeObserver(draw).observe(canvas);
  new ResizeObserver(updateListHint).observe(list);
  list.addEventListener('scroll', updateListHint, { passive: true });
  window.addEventListener('pagehide', persist);
  load();
}
