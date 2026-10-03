const form = document.querySelector<HTMLFormElement>('#inquiry-form');
if (form) {
  const sizeStep = form.querySelector<HTMLFieldSetElement>('[data-step="1"]')!;
  const detailsStep = form.querySelector<HTMLFieldSetElement>('[data-step="2"]')!;
  const next = form.querySelector<HTMLButtonElement>('.inquiry-next')!;
  const previous = form.querySelector<HTMLButtonElement>('.inquiry-previous')!;
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const status = form.querySelector<HTMLDivElement>('#form-status')!;
  const success = document.querySelector<HTMLDivElement>('#inquiry-success')!;
  let sending = false;

  const showStep = (step: number, focus = true) => {
    sizeStep.hidden = step !== 1;
    detailsStep.hidden = step !== 2;
    document.querySelectorAll<HTMLElement>('[data-progress]').forEach((item) => {
      if (item.dataset.progress === String(step)) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    const chosen = new FormData(form).get('size');
    form.querySelector('#chosen-size')!.textContent = chosen === 'unknown'
      ? 'Te ayudaremos a elegir el tamaño. Déjanos cómo contactar contigo.'
      : `Te interesa un trastero de ${chosen} m². Déjanos cómo contactar contigo.`;
    if (focus) (step === 1 ? sizeStep : detailsStep).querySelector<HTMLElement>('legend')!.focus();
  };
  const selection = new URLSearchParams(location.search).get('size');
  if (selection) {
    const option = [...form.querySelectorAll<HTMLInputElement>('[name="size"]')].find((input) => input.value === selection);
    if (option) option.checked = true;
  }
  next.hidden = previous.hidden = false;
  showStep(1, false);
  next.addEventListener('click', () => showStep(2));
  previous.addEventListener('click', () => { if (!sending) showStep(1); });
  form.addEventListener('input', (event) => {
    const input = event.target;
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      input.setCustomValidity('');
      input.removeAttribute('aria-invalid');
    }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    sending = true;
    submit.disabled = previous.disabled = true;
    submit.textContent = 'Enviando…';
    form.setAttribute('aria-busy', 'true');
    status.hidden = false;
    status.textContent = 'Estamos enviando tu consulta.';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        status.textContent = result.message || 'No se ha podido enviar. Tus datos siguen aquí; inténtalo de nuevo.';
        if (result.errors) {
          for (const [name, message] of Object.entries(result.errors)) {
            const input = form.elements.namedItem(name);
            if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
              input.setCustomValidity(String(message));
              input.setAttribute('aria-invalid', 'true');
            }
          }
          form.reportValidity();
        } else status.focus();
        return;
      }
      form.hidden = true;
      document.querySelector<HTMLElement>('.inquiry-progress')!.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      status.textContent = 'No hemos podido confirmar el envío. Tus datos siguen aquí. Puedes reintentar o escribir al correo que aparece debajo.';
      status.focus();
    } finally {
      sending = false;
      form.removeAttribute('aria-busy');
      submit.disabled = previous.disabled = false;
      submit.textContent = 'Enviar';
    }
  });
}
