# Impostor - Reglamento y Guia de Uso

## Resumen del juego
Juego social por rondas. Cada jugador recibe una palabra secreta o el rol de impostor. Todos ven la categoria de la palabra. En su turno, cada jugador dice en voz alta una palabra relacionada. Luego se vota al impostor. Si es descubierto, puede intentar adivinar la palabra secreta. Se juega varias rondas hasta que el admin decide cerrar la sala y se muestran los puntajes.

## Reglamento del juego
- Ronda y roles: se elige aleatoriamente quien empieza. La app asigna una palabra secreta a los jugadores no impostores y uno o mas impostores segun configuracion (maximo ceil(jugadores/3)). El autor de la palabra no puede ser impostor en su propia palabra ni si repitio palabra existente.
- Turnos: sentido horario. Cada turno es una pista verbal; no se escriben pistas en la app.
- Votacion: al terminar la ronda, todos votan al sospechoso. Si hay empate, se hace un revoto solo entre empatados.
- Resolucion:
  - Si el impostor es descubierto: antes de la siguiente ronda puede decir en voz alta la palabra secreta. El autor confirma en la app si acerto. Si acierta, el impostor gana la ronda; si no, sigue el juego.
  - Si no se descubre al impostor: el acusado erroneo queda fuera de la ronda siguiente; se sigue jugando.
- Diccionario compartido:
  - Formato `palabra:categoria`.
  - No se admite duplicado (case-insensitive). Si alguien agrega una palabra ya existente, no se suma y tampoco puede ser impostor en esa ronda.
  - Cada ronda puede sumar nuevas palabras.
- Fin de partida: el admin cierra la sala manualmente; se muestra tabla final de puntajes y ganador.

## Sistema de puntos
- Impostor acierta la palabra secreta: +2 puntos para el impostor que acerto, +1 para los otros impostores (si los hay).
- Jugadores descubren al impostor: cada no-impostor gana +1 punto.
- Jugadores eliminados que no son impostores: no suman puntos.
- Tabla final: se muestra al cerrar la sala, con el jugador de mayor puntaje como ganador.

## Reglas de configuracion
- Numero de impostores: maximo ceil(total de jugadores / 3).
- Admin: es quien crea la sala; puede expulsar jugadores y cerrar la sala. Dirige el inicio de rondas.
- Reconexiones: un jugador que se desconecta puede volver con el mismo nickname y mantiene su slot y puntos mientras la sala viva.

## Seguridad y equidad
- La palabra secreta solo se envia a jugadores no impostores.
- Validaciones server-side: dedupe de palabras, limites de impostores, proteccion de acciones de admin.
- Evitar trampas: los impostores no reciben la palabra secreta; solo ven la categoria.

## Guia de uso de la app (SPA Next.js, mobile-first)
1) Elegir nickname: ingresar nombre para la sesion (no hay autenticacion persistente).
2) Crear sala (admin): genera una sala con UUID y link compartible. Configura cantidad de impostores.
3) Unirse a sala: abrir el link y entrar con un nickname. Si es reconexion, usar el mismo nickname para recuperar slot y puntos.
4) Gestionar diccionario:
   - Agregar entradas `palabra:categoria`. La app deduplica y muestra quien es el autor.
   - Palabras duplicadas no se agregan; el jugador que intento duplicar no puede ser impostor en esa ronda.
5) Iniciar ronda (admin):
   - La app elige palabra secreta del diccionario y categoria visible.
   - Asigna impostores cumpliendo el limite y exclusiones por autor/duplicado.
   - Selecciona orden aleatorio de turnos y quien empieza.
   - Muestra la palabra secreta solo a no-impostores.
6) Fase de pistas: cada jugador dice en voz alta una palabra relacionada en su turno (no se escribe en la app).
7) Votacion:
   - Todos votan al sospechoso. Si hay empate, se activa revoto entre empatados.
8) Resolucion:
   - Si impostor descubierto: el impostor dice en voz alta la palabra; el autor confirma con un boton si acerto.
   - Si impostor no descubierto: el acusado queda fuera de la siguiente ronda.
   - La app asigna puntajes segun el resultado.
9) Nueva ronda: se puede agregar nuevas palabras y repetir el flujo. Estado y puntajes se mantienen.
10) Cierre de sala: el admin puede cerrar la sala; se muestra la tabla final con posiciones y puntos.

## Estado y almacenamiento
- Estado centralizado en el servidor (sala en memoria). Limpieza cuando se cierra la sala.
- Comunicacion en tiempo real via WebSockets puros.
- Sin base de datos inicial; almacenamiento liviano en memoria mientras la sala viva.

## Notas
- Todo el contenido esta en español.
- Sin telemetria. Priorizamos experiencia mobile.
