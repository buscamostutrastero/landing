import type { StorageScene, ViewerView } from './storage-scene';

type Unit = { size: string; image: string; width: number; depth: number };

const dialog = document.querySelector<HTMLDialogElement>('#storage-viewer');
if (dialog && typeof dialog.showModal === 'function') {
  const units: Unit[] = JSON.parse(dialog.dataset.units!);
  const height = Number(dialog.dataset.height);
  const title = dialog.querySelector<HTMLElement>('#viewer-title')!;
  const canvasHost = dialog.querySelector<HTMLElement>('[data-viewer-canvas]')!;
  const loading = dialog.querySelector<HTMLElement>('[data-viewer-loading]')!;
  const fallback = dialog.querySelector<HTMLElement>('[data-viewer-fallback]')!;
  const fallbackImage = dialog.querySelector<HTMLImageElement>('[data-viewer-fallback-image]')!;
  const hint = dialog.querySelector<HTMLElement>('[data-viewer-hint]')!;
  const controls = dialog.querySelector<HTMLElement>('[data-viewer-controls]')!;
  const stage = dialog.querySelector<HTMLElement>('[data-viewer-stage]')!;
  const objects = dialog.querySelector<HTMLInputElement>('[data-viewer-objects]')!;
  const scale = dialog.querySelector<HTMLElement>('[data-viewer-scale]')!;
  const viewButtons = [...controls.querySelectorAll<HTMLButtonElement>('[aria-pressed]')];
  const contact = dialog.querySelector<HTMLAnchorElement>('[data-viewer-contact]')!;
  const radios = [...dialog.querySelectorAll<HTMLInputElement>('[name="viewer-size"]')];
  const largest = units.reduce((max, unit) => ({ width: Math.max(max.width, unit.width), depth: Math.max(max.depth, unit.depth) }), { width: 0, depth: 0 });

  let selected = units[0]!;
  let trigger: HTMLElement | null = null;
  let scene: StorageScene | null = null;
  let loadingScene: Promise<void> | null = null;
  let hintSeen = false;

  const setState = (state: 'loading' | 'ready' | 'failed') => {
    stage.dataset.state = state;
    loading.hidden = state !== 'loading';
    fallback.hidden = state !== 'failed';
    hint.hidden = state !== 'ready' || hintSeen;
    canvasHost.hidden = controls.hidden = state === 'failed';
    controls.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input').forEach((control) => { control.disabled = state !== 'ready'; });
  };

  const fail = () => {
    scene?.dispose();
    scene = null;
    loadingScene = null;
    setState('failed');
  };

  const setView = (view: ViewerView) => {
    stage.dataset.view = view;
    viewButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.viewerAction === (view === 'top' ? 'top' : 'reset')));
    });
  };

  const select = (size: string) => {
    selected = units.find((unit) => unit.size === size) ?? selected;
    title.textContent = `Trastero de ${selected.size} m²`;
    contact.href = `/contacto/?size=${encodeURIComponent(selected.size)}`;
    fallbackImage.src = `/images/sizes/${selected.image}-480.webp`;
    radios.forEach((radio) => { radio.checked = radio.value === selected.size; });
    scene?.setUnit(selected);
  };

  const ensureScene = () => {
    if (scene || loadingScene) return;
    setState('loading');
    loadingScene = import('./storage-scene')
      .then(({ createStorageScene }) => {
        scene = createStorageScene(canvasHost, { height, largest, onContextLost: fail, onViewChange: setView });
        // Dibuja el tamaño elegido más reciente, aunque haya cambiado durante la carga.
        scene.setUnit(selected);
        scene.setObjectsVisible(objects.checked);
        scene.frame();
        if (dialog.open) scene.start();
        setState('ready');
      })
      .catch(fail)
      .finally(() => { loadingScene = null; });
  };

  const open = (size: string, from: HTMLElement) => {
    trigger = from;
    select(size);
    dialog.showModal();
    title.focus();
    if (scene) {
      scene.start();
      scene.frame();
      setState('ready');
    } else ensureScene();
  };

  document.querySelectorAll<HTMLButtonElement>('[data-viewer-size]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => open(button.dataset.viewerSize!, button));
  });
  radios.forEach((radio) => radio.addEventListener('change', () => select(radio.value)));
  objects.addEventListener('change', () => {
    scene?.setObjectsVisible(objects.checked);
    scale.textContent = objects.checked ? 'Mismos objetos, misma escala' : 'Misma escala entre tamaños';
  });
  dialog.querySelector('[data-viewer-close]')!.addEventListener('click', () => dialog.close());
  // Clic en el fondo oscuro: cerrar.
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    scene?.stop();
    trigger?.focus();
  });
  controls.addEventListener('click', (event) => {
    const action = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-viewer-action]')?.dataset.viewerAction : undefined;
    if (!scene || !action) return;
    if (action === 'rotate-left') scene.rotate(-1);
    else if (action === 'rotate-right') scene.rotate(1);
    else if (action === 'zoom-in') scene.zoom(0.82);
    else if (action === 'zoom-out') scene.zoom(1.22);
    else if (action === 'top') scene.top();
    else if (action === 'reset') scene.reset();
  });
  canvasHost.addEventListener('pointerdown', () => { hintSeen = hint.hidden = true; }, { once: true });

  window.addEventListener('pagehide', () => { scene?.stop(); });
  window.addEventListener('pageshow', () => { if (dialog.open) scene?.start(); });
}
