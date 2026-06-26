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