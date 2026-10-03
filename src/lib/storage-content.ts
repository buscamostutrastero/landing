import { business } from './business';

export const storageSizes = [
  { size: '1', image: 'storage-1', title: 'Lo pequeño también estorba.', description: 'Cajas, una maleta y herramientas que ocupan el armario.', alt: 'Ilustración de un trastero de 1 m² con cajas, una maleta y herramientas' },
  { size: '1,5', image: 'storage-1-5', title: 'Lo de otra temporada.', description: 'Ropa, bolsas de viaje y material de camping que ahora no usas.', alt: 'Ilustración de un trastero de 1,5 m² con cajas, equipaje y material de camping' },
  { size: '2', image: 'storage-2', title: 'El equipo tiene su sitio.', description: 'Maletas, material deportivo y cajas que quieres tener a mano.', alt: 'Ilustración de un trastero de 2 m² con maletas, cajas y material deportivo' },
  { size: '2,5', image: 'storage-2-5', title: 'También lo plegable.', description: 'Sillas, una mesa plegada y esas cajas que siguen en el pasillo.', alt: 'Ilustración de un trastero de 2,5 m² con equipaje, cajas y muebles plegados' },
  { size: '3', image: 'storage-3', title: 'Las cajas, fuera del cuarto.', description: 'Herramientas, bolsas y más cosas que quieres conservar.', alt: 'Ilustración de un trastero de 3 m² con cajas, bolsas y herramientas organizadas' },
  { size: '3,5', image: 'storage-3-5', title: 'Lo que se acumula en casa.', description: 'Cajas, alfombras y pequeños enseres que ya no tienen sitio.', alt: 'Ilustración de un trastero de 3,5 m² con cajas, alfombras y enseres domésticos' },
];

export const faqs = [
  ['¿Dónde vais a abrir?', 'Buscamos tu Trastero abrirá en Calle de las Rosas 16, en el barrio de Casablanca, Zaragoza. Tendremos trasteros de 1 a 3,5 m².'],
  ['¿Cuándo abrís?', 'La apertura está en marcha. La fecha todavía no está cerrada. Si necesitas espacio, cuéntanos para cuándo.'],
  ['¿Cuánto va a costar?', 'Todavía no hemos publicado las tarifas. El precio, la fianza y las condiciones estarán claros antes de que contrates.'],
  ['¿Qué tamaños vais a ofrecer?', 'Cuando abramos tendremos trasteros de 1, 1,5, 2, 2,5, 3 y 3,5 m². Todos estos tamaños formarán parte de la oferta de apertura.'],
  ['¿Qué tamaño necesito?', 'Empieza por las cosas: cuántas cajas, qué muebles, si hay una bici… No hace falta que calcules los metros a ojo. Cuéntanos qué quieres guardar y te ayudamos a elegir entre 1 y 3,5 m². Las imágenes son ilustrativas; la capacidad depende de las medidas de tus objetos y de cómo los coloques.'],
  ['¿Dejar mis datos es reservar?', 'No. Nos sirve para hablar de lo que necesitas. No estás contratando ni pagando nada.'],
  ['¿Cómo puedo pedir información?', `Escribe a ${business.email} o accede al formulario de consulta desde «Me interesa un trastero». Elige un tamaño, o indica que necesitas ayuda, y déjanos tus datos. La consulta se envía directamente a nuestro correo.`],
  ['¿Qué horario de acceso tendrán los trasteros?', 'Cuando abramos, ofreceremos acceso las 24 horas durante 356 días, carga y descarga y vigilancia 24 h. El centro sigue anunciado como próxima apertura; te informaremos de las condiciones antes de que contrates.'],
  ['¿Las imágenes de los tamaños son fotografías del local?', 'No. Las imágenes de los seis tamaños son ilustraciones generadas con IA para mostrar ejemplos de organización. No muestran el aspecto final del local ni garantizan que quepan objetos con unas medidas concretas.'],
  ['¿Qué información necesitáis para orientarme?', 'Nombre, apellidos, teléfono y correo electrónico. La dirección, el código postal y lo que necesitas guardar son opcionales. Puedes elegir un tamaño o pedir ayuda para decidirlo.'],
];

export const title = 'Trasteros en Casablanca, Zaragoza | Próxima apertura';
export const description = 'Trasteros de 1, 1,5, 2, 2,5, 3 y 3,5 m² en Calle de las Rosas 16, Casablanca, Zaragoza. Próxima apertura. Consulta tamaños y cuéntanos qué necesitas guardar.';

export const illustrationNotice = 'Imágenes generadas con IA para ilustrar cómo organizar tus cosas. La distribución es orientativa y no muestra el aspecto final del local. La capacidad depende de las medidas de tus objetos y de cómo los coloques.';

export const updatedLabel = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${business.updatedAt}T12:00:00Z`));
