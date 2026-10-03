const limits = { firstName: 80, lastName: 120, phone: 30, email: 254, address: 200, postalCode: 5, need: 2000 };

export function validateInquiry(input, sizes) {
  const errors = {};
  const data = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { errors: { form: 'Revisa los datos de tu consulta.' } };
  for (const [name, limit] of Object.entries(limits)) {
    const value = input[name] ?? '';
    if (typeof value !== 'string' || value.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
      errors[name] = 'Revisa este campo: contiene datos no válidos o demasiado largos.';
      continue;
    }
    data[name] = value.trim();
    if (name !== 'need' && /[\r\n]/.test(value)) errors[name] = 'Escribe este dato en una sola línea.';
  }
  for (const [name, label] of Object.entries({ firstName: 'tu nombre', lastName: 'tus apellidos', phone: 'tu teléfono', email: 'tu correo electrónico' })) {
    if (!data[name] && !errors[name]) errors[name] = `Indica ${label}.`;
  }
  if (data.phone && (!/^[+\d\s().-]+$/.test(data.phone) || !/^\d{7,15}$/.test(data.phone.replace(/\D/g, '')))) errors.phone = 'Introduce un teléfono válido, con prefijo si es de fuera de España.';
  if (data.email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)) errors.email = 'Introduce un correo electrónico válido.';
  if (data.postalCode && !/^\d{5}$/.test(data.postalCode)) errors.postalCode = 'El código postal debe tener cinco cifras.';
  if (input.size !== 'unknown' && !sizes.includes(input.size)) errors.size = 'Elige un tamaño de la lista o indica que necesitas ayuda.';
  if (input.consent !== 'yes') errors.consent = 'Lee y acepta la Política de privacidad para enviar tu consulta.';
  if (input.website) errors.form = 'No se ha podido procesar esta consulta.';
  data.size = input.size;
  return { data, errors };
}

export function buildInquiryEmail(data, recipient) {
  return {
    from: { name: 'Buscamos tu Trastero · Web', address: recipient },
    to: recipient,
    replyTo: { address: data.email, name: `${data.firstName} ${data.lastName}` },
    subject: 'Nueva consulta de trastero · Casablanca',
    text: `Consulta enviada desde el formulario de Buscamos tu Trastero.\n\nNombre: ${data.firstName}\nApellidos: ${data.lastName}\nTeléfono: ${data.phone}\nCorreo electrónico: ${data.email}\nDirección: ${data.address || 'No indicada'}\nCódigo postal: ${data.postalCode || 'No indicado'}\nTamaño: ${data.size === 'unknown' ? 'Necesita ayuda para elegir' : `${data.size} m²`}\n\nQué necesita guardar y para cuándo:\n${data.need || 'No indicado'}\n\nPolítica de privacidad aceptada al enviar la consulta.\nEsta consulta no implica reserva, contratación ni pago.`,
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}

export async function submitInquiry(input, { sizes, recipient, sendMail }) {
  const { data, errors } = validateInquiry(input, sizes);
  if (Object.keys(errors).length) return { status: 422, body: { ok: false, message: 'Revisa los campos indicados antes de enviar.', errors } };
  if (!sendMail) return { status: 503, body: { ok: false, message: `El envío está temporalmente fuera de servicio. Tus datos siguen aquí. Puedes escribir a ${recipient}.` } };
  try {
    const result = await sendMail(buildInquiryEmail(data, recipient));
    if (!result.accepted?.some((address) => (typeof address === 'string' ? address : address.address)?.toLowerCase() === recipient.toLowerCase())) throw new Error('Recipient not accepted');
    return { status: 200, body: { ok: true, message: 'Tu consulta se ha enviado.' } };
  } catch (error) {
    const knownCodes = ['EAUTH', 'ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'EDNS', 'EMESSAGE', 'EENVELOPE', 'ETLS', 'EREQUIRETLS', 'EPROTOCOL', 'ESTREAM', 'ENOAUTH', 'ECONFIG'];
    const deliveryCode = knownCodes.includes(error?.code) ? error.code : 'SMTP_FAILURE';
    console.error('Contact delivery failed', deliveryCode);
    return { status: 502, deliveryCode, body: { ok: false, message: `No se ha podido confirmar el envío. Tus datos siguen aquí. Puedes reintentar o escribir a ${recipient}.` } };
  }
}
