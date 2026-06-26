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


## v4.0.0

- Implementado React Context con un reducer central que maneja tickets, usuarios, pagos, solicitudes de autorización, notificaciones y gastos como estado global reactivo. Todos los componentes leen y escriben al mismo estado — no hay estado local duplicado.

- Cuando el personal de mantención presiona "Solicitar autorización a propietario", se despacha ADD_AUTH_REQUEST: crea la solicitud en el estado global Y genera una notificación automática para la unidad del propietario.

- El dashboard del propietario lee authRequests filtrados por su unidad — las solicitudes aparecen al instante sin recargar. Al aprobar/rechazar, se dispara RESPOND_AUTH_REQUEST: actualiza la solicitud, sincroniza el authStatus del ticket, y envía notificación al personal de mantención.

- Nueva sección "Mis Tickets" en los dashboards de Propietario y Arrendatario que lista todos los tickets de su unidad con su progreso actual (barra de 3 puntos: Pendiente → En proceso → Resuelto). Se actualiza en tiempo real cuando el personal cambia el estado.

- La campana del header muestra un badge rojo con contador de notificaciones no leídas.

- Al hacer clic se despliega un panel con todas las notificaciones relevantes para el rol/unidad del usuario actual.

- Las notificaciones se marcan como leídas automáticamente al abrir el panel.

- Botón "Marcar leídas" manual disponible.

- Cada acción genera notificaciones automáticas: nuevo ticket → staff correspondiente; cambio de estado → propietario de la unidad; solicitud de autorización → propietario; respuesta de autorización → mantención; pago procesado → residente.

- Notificaciones iniciales pre-cargadas para demostrar el sistema desde el inicio.

- CreateTicketSection ahora despacha ADD_TICKET al estado global. El ticket aparece inmediatamente en el kanban de Mantención, Conserjería o Quejas según la categoría seleccionada — sin necesidad de recargar. CreateTicketSection recibe unit y owner como props.

- RegisterUserModal despacha ADD_USER. Si el usuario tiene unidad asignada, se crea automáticamente una entrada en unitPayments con estado "Pendiente" y se refleja en la tabla del módulo de Finanzas al instante.

- Nueva sección "Ingresar Gastos del Período" con selector de servicio (Agua, Gas, Electricidad, Limpieza, Seguro, etc.) e input de monto.

- Tabla de gastos ingresados con botón de eliminar.

- Cálculo en tiempo real de cuota por unidad (total ÷ número de unidades).

- Al presionar "Calcular Cuotas y Prorrateo" se despacha CALCULATE_CUOTAS: actualiza los montos de todas las unidades, envía notificaciones a todos los residentes, y muestra confirmación con el valor calculado.

- El botón "Pagar en Línea · Webpay / Flow" abre un modal de 3 pasos: confirmación → procesando (animación 1.8s) → éxito.

- Al completarse, despacha PAY_UNIT: cambia el estado de la unidad de "Pago vencido" o "Pendiente" a "Al día" en tiempo real. La tarjeta de la cuenta del residente se actualiza inmediatamente. Si ya está "Al día", el botón se reemplaza por una confirmación de pago completado.