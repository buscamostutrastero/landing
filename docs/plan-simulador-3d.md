# Plan de implementación — Visor 3D de trasteros

**Revisión:** 18 de octubre de 2026

**Estado:** implementado; refinamiento visual revisado en navegador, pendiente de prueba en móvil físico

**Ubicación:** tarjetas de tamaños de la landing actual.

## 1. Qué vamos a construir

El visitante pulsa un tamaño y ve una **recreación 3D orientativa de un trastero
de esa superficie**. Puede girarla para hacerse una idea del espacio.

La aclaración del titular sustituye el alcance anterior: se necesita un visor
visual sencillo. El cálculo de capacidad, el catálogo interactivo y la validación
de acceso no forman parte del producto solicitado.

La puerta se representará **enrollable hacia arriba**, como solución prevista
por el titular. No se presenta como una instalación ya ejecutada.

No necesitamos medidas de pasillos, obstáculos ni un levantamiento completo del
local para desarrollar o publicar esta recreación. Las proporciones representadas
serán aproximadas y se explicará con un aviso breve.

## 2. Qué está decidido y qué es una propuesta

| Aspecto | Criterio |
|---|---|
| Interacción solicitada | Pulsar un trastero según su tamaño y ver una recreación 3D. |
| Tamaños comerciales | Reutilizar los seis publicados: 1, 1,5, 2, 2,5, 3 y 3,5 m². |
| Puerta | Enrollable hacia arriba; intención comunicada por el titular. |
| Precisión | Representación aproximada, sin certificar dimensiones interiores ni capacidad. |
| Presentación propuesta | Un único visor modal reutilizable, abierto desde las tarjetas existentes. |
| Tecnología propuesta | three.js con carga al abrir el visor, dentro del sitio Astro actual. |
| Documentación visual aportada | La fotografía del plano sirve de contexto; no se toman cotas ni escala de la fotografía. |

El plano compartido no obliga a reproducir el edificio ni a ampliar la oferta
comercial publicada. Los tamaños proceden de `src/lib/storage-content.ts` y de
la confirmación recogida en el [contexto de negocio](contexto-negocio.md).
La comunicación de próxima apertura sigue la [guía de copywriting](copywriting-style.md).

## 3. Experiencia del visitante

1. En el bloque de tamaños, cada tarjeta ofrece la acción «Ver en 3D».
   La imagen y el tamaño también pueden activar ese mismo visor, con semántica
   de botón y acceso por teclado; no convertir el artículo completo en un
   elemento interactivo que contenga otros controles.
2. Al pulsar, se abre el visor con el tamaño elegido y el título «Trastero de
   2 m²», por ejemplo. La carga inicial muestra una indicación breve.
3. Se ve el suelo, las paredes y la puerta enrollada arriba, dejando visible
   el interior. El acabado es esquemático, con los colores de la marca.
4. Se puede girar con ratón o dedo, acercar y alejar. Controles sencillos permiten
   restablecer la vista y mirar desde arriba.
5. Un selector dentro del visor permite cambiar entre los seis tamaños sin
   cerrarlo. Se actualizan el título, el volumen y el enlace de contacto.
6. «Me interesa este tamaño» abre `/contacto/?size=…`, aprovechando la
   preselección existente. «Cerrar» devuelve a la tarjeta de origen.

Propuesta de presentación: modal centrado en escritorio y amplio en móvil.
Un visor compartido evita seis escenas y seis contextos WebGL. No hace falta
una página nueva `/que-cabe/` ni una URL compartible de objetos.

El visor incluye un ejemplo de organización con una estantería, cajas y una
maleta. «Mostrar objetos» permite alternar con el recinto vacío. Los objetos
mantienen las mismas dimensiones y cantidades en los seis tamaños para facilitar
la comparación; solo cambia su posición respecto a las paredes. Es una composición
ilustrativa fija, sin cálculo ni veredictos de capacidad. La preferencia se conserva
al cambiar de tamaño o cerrar y volver a abrir el visor.

## 4. Modelo visual aproximado

Los m² no determinan una forma única. Para la recreación se propone una forma
rectangular por tamaño, manteniendo que ancho × fondo coincida con su superficie.
Estas cifras son **parámetros gráficos propuestos**, no medidas del local:

| Tamaño | Ancho representado | Fondo representado |
|---|---|---|
| 1 m² | 1,00 m | 1,00 m |
| 1,5 m² | 1,00 m | 1,50 m |
| 2 m² | 1,25 m | 1,60 m |
| 2,5 m² | 1,25 m | 2,00 m |
| 3 m² | 1,50 m | 2,00 m |
| 3,5 m² | 1,75 m | 2,00 m |

Altura gráfica inicial propuesta: 2,20 m para todos. Puerta frontal esquemática,
con guías laterales y persiana recogida en la parte superior. Sus medidas tampoco
se presentan como dimensiones reales ni se usan para comprobar el paso de muebles.

- Suelo y paredes con geometría procedural sencilla; sin modelos externos.
- Interior visible mediante paredes recortadas u ocultas desde la cámara.
- Misma escala y encuadre de referencia al cambiar de tamaño, ajustados al mayor
  recinto y al aspecto de pantalla. No ampliar cada trastero automáticamente
  hasta que todos parezcan igual de grandes.
- Vista inicial axonométrica con cámara ortográfica y vista cenital con puerta
  abajo. La cámara ortográfica mantiene una referencia de escala común.
- Figura ilustrativa de 1,70 m, fija al comparar tamaños y oculta en vista cenital.
- Sin cotas de ancho, fondo, altura o puerta en la interfaz mientras sean
  parámetros gráficos. El tamaño comercial en m² sí aparece.
- El acabado es una ilustración; no pretende mostrar cómo quedará exactamente
  el local ni reproducir la distribución del plano.

No se modelan obstáculos, pasillos, ascensores, recorridos ni otras partes del
edificio. Tampoco hay colocación automática, colisiones, apilado o comprobación
de que un objeto cabe.

## 5. Implementación propuesta

Se mantiene Astro estático y la API de contacto actual. No hacen falta SSR,
base de datos ni hidratación de React.

| Archivo | Responsabilidad |
|---|---|
| `src/pages/index.astro` | Añadir activadores a las tarjetas e incluir una única instancia del visor. |
| `src/components/StorageViewer.astro` | Estructura del diálogo, título, selector, controles, aviso y enlace de contacto. |
| `src/lib/storage-viewer-data.ts` | Proporciones ilustrativas por identificador comercial, altura gráfica y ajustes visuales. |
| `src/scripts/storage-viewer.ts` | Abrir/cerrar, selección, foco, estado de carga, fallback e import diferido de la escena. |
| `src/scripts/storage-scene.ts` | Construir el recinto, cambiar tamaño y cámara, renderizar y liberar recursos. |
| `src/scripts/storage-objects.ts` | Modelos procedurales del ejemplo: estantería, cajas y maleta, a escala constante. |
| `src/styles/storage-viewer.css` | Estilos aislados con los tokens existentes. |
| `package.json`, `pnpm-lock.yaml` | Añadir versiones exactas y compatibles de three.js y sus tipos. |
| `README.md` | Documentar parámetros aproximados, carga diferida y comprobaciones realizadas. |

`storageSizes` continúa siendo la fuente de tamaños y etiquetas. La configuración
visual solo añade proporciones; comprobar que corresponde con esos seis tamaños.
No importar three.js desde el código del formulario ni desde los datos compartidos.

El controlador ligero se carga en la home. `import('./storage-scene')` se ejecuta
al abrir el visor por primera vez; three.js no debe descargarse durante la visita
inicial sin interacción. Los cambios posteriores reutilizan esa escena. Si se
cambia de tamaño mientras carga, dibujar la selección más reciente.

Usar `WebGLRenderer` y `OrbitControls`; fijar las versiones al implementar después
de comprobar compatibilidad. La documentación actual de `WebGLRenderer` requiere
WebGL 2, por lo que debe existir una alternativa si falla su inicialización.

Renderizar al cambiar cámara, tamaño o dimensiones del visor; sin giro automático
ni bucle continuo en reposo. Desactivar inercia inicialmente, limitar
`pixelRatio` a 2 y evitar sombras costosas hasta medir el resultado. Al cerrar,
pausar el render; al destruir la escena, retirar eventos y liberar recursos.

Referencias: [scripts de Astro](https://docs.astro.build/en/guides/client-side-scripts/),
[WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) y
[OrbitControls](https://threejs.org/docs/pages/OrbitControls.html).

## 6. Copy, accesibilidad y fallos

Copy propuesto, siguiendo la guía vigente:

- **Acción de tarjeta:** «Ver en 3D»; nombre accesible con el tamaño.
- **Título:** «Trastero de 2 m²».
- **Aviso:** «Recreación orientativa. Las proporciones y el aspecto pueden variar.
  No representa la distribución exacta del local».
- **Carga:** «Preparando la vista 3D…».
- **Fallo:** «No se ha podido mostrar la vista 3D. Puedes consultar la ilustración
  de este tamaño o pedirnos información».
- **Contacto:** «Me interesa este tamaño».

Usar un diálogo con título accesible, cierre visible, Escape y retorno de foco
al activador. Los controles de giro, zoom, vista superior y restablecimiento
ofrecen alternativa al gesto de arrastre. El selector y el enlace funcionan con
teclado; las animaciones respetan `prefers-reduced-motion`.

Canvas oculto al lector de pantalla; el tamaño, la explicación y las acciones
están en el DOM. Evitar que los gestos del visor impidan llegar a «Cerrar» o al
resto de controles en móvil.

Sin JavaScript, conservar las tarjetas, ilustraciones y contacto existentes,
sin mostrar activadores inertes. Si falla el import, WebGL 2 o el contexto,
mostrar dentro del visor la ilustración existente del tamaño y el contacto.

El carácter aproximado se comunica con el aviso, igual que las ilustraciones
actuales. **Las dimensiones reales no bloquean esta versión ilustrativa**.
No necesita un interruptor de medidas confirmadas, restricciones de publicación
ni cambios de sitemap: el visor forma parte de la home existente.

## 7. Verificación y entrega

Criterios de aceptación:

- [ ] Cada tarjeta abre el tamaño correcto; cambiar tamaño actualiza recinto,
  título y enlace de contacto.
- [ ] La diferencia de superficie se aprecia con una referencia visual común.
- [ ] La puerta se representa enrollada hacia arriba y el interior queda visible.
- [ ] El aviso identifica claramente la recreación como orientativa.
- [ ] three.js se descarga solo después de activar el visor y no desde `/contacto/`.
- [ ] Abrir/cerrar repetidamente no acumula escenas, eventos ni trabajo de GPU.
- [ ] Cierre, foco, teclado, zoom de página y movimiento reducido funcionan.
- [ ] Fallback comprobado ante fallo de carga y ausencia/pérdida de WebGL 2.
- [ ] Verificación visual a 390, 768 y 1440 px y prueba de gestos en móvil real.
- [ ] `pnpm build`, `pnpm test`, `pnpm check:seo` y `pnpm exec tsc --noEmit`.

No hace falta escribir pruebas de un motor de capacidad que no forma parte del
alcance. Registrar el peso real del bundle y comprobar que el visor cerrado no
mantiene un render continuo. La validación principal es visual y de interacción.

Orden de trabajo: recinto procedural → visor conectado a tarjetas → carga
diferida, accesibilidad y fallback → comprobación visual y móvil. Estimación
inicial: **2–3 días de implementación y verificación**, pendiente de contrastar
con el primer prototipo y el acabado visual elegido.

No quedan preguntas sobre el local que bloqueen este alcance. Las proporciones
y el estilo se pueden ajustar sobre el prototipo sin convertir el visor en una
herramienta de medición o de validación de capacidad.
