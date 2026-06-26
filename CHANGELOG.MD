# Registro de Cambios
## v1.0.0
- Primera version del prototipo

## v2.0.0
- Eliminado el enlace "Primer ingreso — cambiar contraseña temporal" del pie del formulario de login.

- Agregada una casilla de demo dentro del selector de rol: "Simular contraseña temporal (primer ingreso)". Al activarla y presionar "Iniciar Sesión", el sistema intercepta el acceso y redirige automáticamente a la pantalla de cambio de contraseña.

- Tras establecer la nueva contraseña, el botón ahora dice "Continuar al sistema" y lleva directo al dashboard del rol seleccionado — sin pasar de vuelta por el login.

- FirstLoginView ya no recibe un genérico onNavigate(view): ahora recibe onSuccess() (va al dashboard) y onBack() (vuelve al login), separando claramente las dos rutas posibles.

