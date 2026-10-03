import { business } from './business';
import { description, faqs, illustrationNotice, storageSizes, updatedLabel } from './storage-content';

const home = `${business.url}/`;

export function getLlmsIndex(): string {
  return `# ${business.name}

> ${description}

Información comercial actualizada el ${updatedLabel}. La ubicación anunciada es
${business.streetAddress}, ${business.neighborhood}, ${business.locality}, España.
El correo de contacto es ${business.email}.

El centro está anunciado como próxima apertura. Todos los tamaños indicados se
ofrecerán al abrir. La fecha exacta y las tarifas todavía no están publicadas. Para la apertura se
anuncian acceso 24 horas durante 356 días, carga y descarga y vigilancia 24 h. Dejar los datos o enviar una consulta no equivale a reservar ni pagar.
Las imágenes de los tamaños son ilustraciones generadas con IA.

## Información comercial

- [Información de apertura y preguntas frecuentes](${home}index.md): versión Markdown con ubicación, seis tamaños, contacto y todas las respuestas publicadas.
- [Información completa en un archivo](${home}llms-full.txt): el mismo contenido comercial en texto Markdown.

## Página original

- [Web oficial](${home}): información visible, imágenes y formulario de consulta.
- [Tamaños de trastero](${home}#trasteros): ejemplos de 1, 1,5, 2, 2,5, 3 y 3,5 m².
- [Formulario de consulta](${home}contacto/): elección de tamaño y datos de contacto con envío directo a nuestro correo.
- [Preguntas frecuentes](${home}#preguntas): información práctica sobre la próxima apertura.
`;
}

export function getBusinessMarkdown(): string {
  const sizes = storageSizes.map(({ size, title, description: use }) =>
    `### Trastero de ${size} m²\n\n${title} ${use}`,
  ).join('\n\n');
  const questions = faqs.map(([question, answer]) =>
    `### ${question}\n\n${answer}`,
  ).join('\n\n');

  return `# ${business.name}: trasteros en ${business.neighborhood}, ${business.locality}

> ${description}

Fuente: [web oficial](${home}).
Última actualización de la información comercial: ${updatedLabel} (${business.updatedAt}).
Esta versión en texto resume la información comercial de la página original.

## Ubicación y próxima apertura

- Nombre comercial: ${business.name}.
- Dirección anunciada: ${business.streetAddress}.
- Barrio: ${business.neighborhood}.
- Ciudad: ${business.locality}.
- Comunidad autónoma: ${business.region}.
- País: España.
- Estado: próxima apertura; el centro todavía no se anuncia como abierto.
- Tamaños previstos para la apertura: ${storageSizes.map(({ size }) => `${size} m²`).join('; ')}.
- Todos estos tamaños se ofrecerán cuando abramos.
- Correo de información: [${business.email}](mailto:${business.email}).

## Tamaños y ejemplos de organización

${sizes}

${illustrationNotice}

Puedes [ver las ilustraciones de los seis tamaños](${home}#trasteros).

## Cómo pedir información

Cuéntanos qué necesitas guardar y para cuándo. Una lista aproximada de cajas,
muebles u otros objetos nos ayuda a orientarte sobre el tamaño.

El [formulario de consulta](${home}contacto/) permite elegir uno de los seis
tamaños o indicar que necesitas ayuda. Solicita nombre, apellidos, teléfono y
correo electrónico. Dirección, código postal y descripción de lo que necesitas
guardar son opcionales. La consulta se envía a ${business.email}.

Enviar una consulta no supone contratar, reservar ni pagar.

## Preguntas frecuentes

${questions}

## Información comercial todavía pendiente

La fecha exacta de apertura y las tarifas todavía no se han publicado.
Para la apertura se anuncian acceso 24 horas durante 356 días, carga y descarga
y vigilancia 24 h. El precio, la fianza y las condiciones se comunicarán antes de
contratar. La página no anuncia unidades disponibles en este momento.

## Enlaces de la web oficial

- [Inicio](${home}).
- [Tamaños de trastero](${home}#trasteros).
- [Cómo empezar](${home}#como-funciona).
- [Ubicación](${home}#ubicacion).
- [Contacto](${home}contacto/).
- [Preguntas frecuentes](${home}#preguntas).
`;
}
