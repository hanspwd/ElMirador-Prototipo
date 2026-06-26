# Registro de Cambios
## v1.0.0
- Primera version del prototipo

## v2.0.0
- Eliminado el enlace "Primer ingreso — cambiar contraseña temporal" del pie del formulario de login.

- Agregada una casilla de demo dentro del selector de rol: "Simular contraseña temporal (primer ingreso)". Al activarla y presionar "Iniciar Sesión", el sistema intercepta el acceso y redirige automáticamente a la pantalla de cambio de contraseña.

- Tras establecer la nueva contraseña, el botón ahora dice "Continuar al sistema" y lleva directo al dashboard del rol seleccionado — sin pasar de vuelta por el login.

- FirstLoginView ya no recibe un genérico onNavigate(view): ahora recibe onSuccess() (va al dashboard) y onBack() (vuelve al login), separando claramente las dos rutas posibles.

## v2.5.0

- Cada ticket en la bandeja del conserje es ahora un componente SwipeableTicketCard con soporte de deslizamiento táctil y de ratón.

- Deslizar derecha → avanza el estado (Pendiente → En proceso → Resuelto).

- Deslizar izquierda → retrocede el estado.

- Al deslizar, el card se desplaza levemente y aparece un panel revelado detrás: verde para avanzar, gris para retroceder.

- Un overlay semitransparente dentro del card muestra el texto de acción ("En proceso →", "¡Avanzar!", "← Pendiente") mientras se arrastra, cambiando de color al superar el umbral de activación.

- Añadida una barra de progreso de tres puntos en la parte superior de cada tarjeta (Pendiente · En proceso · Resuelto) que indica visualmente en qué estado se encuentra.

- Añadido un aviso de instrucción al inicio de la bandeja: "Desliza una tarjeta para cambiar su estado."

- La zona de "Derivar a mantención" tiene stopPropagation para no interferir con el gesto de deslizamiento.


## v3.0.0

- "En mora" renombrado a "Pago vencido" en la badge de la tarjeta de estado de cuenta y en la tabla de finanzas del administrador

- Eliminado el bloque de alerta roja "Pago vencido — 52 días en mora…" del dashboard del arrendatario — la información queda solo en la badge de la tarjeta

- El formulario "Crear Ticket" (antes "Crear Ticket de Mantención") ahora muestra exactamente 3 tipos: Queja — va al administrador de manera confidencial; muestra el ícono de candado y el texto "Confidencial — solo visible para la administración"
Mantención — va al personal de mantención
Conserjería — va a los conserjes

- Al seleccionar una categoría se muestra debajo un texto informativo sobre a quién se enviará

- Creado el componente genérico KanbanSwipeCard — tarjeta deslizable (táctil y ratón) sin botones, solo gesto

- Creado el componente genérico KanbanBoard — tablero de 3 columnas que acepta tickets y un callback de estado; reutilizado en los tres roles operativos

- Administrador — nuevo módulo Quejas accesible desde el sidebar (ícono de burbuja de advertencia); muestra las quejas confidenciales en un tablero kanban deslizable con aviso de confidencialidad

- Conserje — reemplazado el listado plano por un tablero kanban de 3 columnas (Pendiente · En Proceso · Resuelto), filtrado solo a tickets de categoría Conserjería, con deslizamiento para cambiar estado

- Personal de Mantención — eliminados los botones "Avanzar →" y "← Anterior"; el cambio de estado es ahora solo por deslizamiento. Se mantiene el botón "Solicitar autorización a propietario" en los tickets que lo requieren

- El aviso de instrucción de deslizamiento aparece en todas las vistas de tablero para guiar al usuario