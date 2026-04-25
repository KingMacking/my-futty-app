# 🧠 Development Plan

## 🟢 Step 1 — Setup

- [ ] Crear proyecto React
- [ ] Configurar Supabase
- [ ] Auth básico

---

## 🟢 Step 2 — Worldcup base

- [ ] Crear worldcup al loguear
- [ ] Mostrar estado actual

---

## 🟢 Step 3 — Matches

- [ ] Formulario de partido
- [ ] Guardar en DB

---

## 🟢 Step 4 — Lógica mundial

- [ ] Aplicar reglas de grupos
- [ ] Aplicar reglas eliminatorias
- [ ] Manejar derrota (eliminación)

---

## 🟢 Step 5 — Moneda

- [ ] UI para empate
- [ ] Random result

---

## 🟢 Step 6 — UI Mundial

- [ ] Camino visual
- [ ] Mostrar progreso

---

## � Step 7 — Grupos (simple)

- [ ] Crear grupo
- [ ] Unirse
- [ ] Listado básico
- [ ] Detalle de grupo con miembros

---

## 🟡 Step 8 — Auth extendido + onboarding

- [ ] SQL: agregar `username` y `full_name` a `profiles` (únicos, nullable)
- [ ] Agregar login con Google en Supabase (configurar OAuth provider)
- [ ] Al loguear con cualquier método, detectar si el perfil está incompleto (sin username)
- [ ] Pantalla de onboarding `ProfileSetup` — pedir nombre real y nickname antes de entrar a la app
- [ ] Validar username único (query antes de guardar)
- [ ] Guardar y redirigir al dashboard

---

## 🔲 Step 9 — Pantalla de perfil

- [ ] Nueva tab/página `/profile`
- [ ] Mostrar avatar (inicial), nombre, username, email
- [ ] Botón para editar nombre y username
- [ ] Mostrar stats generales: partidos jugados, mundiales completados
- [ ] Botón de cerrar sesión

---

## 🔲 Step 10 — Actividad del grupo

- [ ] En detalle de grupo, mostrar últimos partidos de cada miembro
- [ ] Feed ordenado por fecha
- [ ] Mostrar username en vez de email

---

## 🔲 Step 11 — Leaderboard del grupo

- [ ] Ranking de miembros según etapa del mundial actual
- [ ] Desempate por victorias en grupos
- [ ] Mostrar username

---

## 🔲 Step 12 — Mejoras UX

- [ ] Skeleton loaders (reemplazar textos "Cargando...")
- [ ] Botón de copiar código de grupo al portapapeles
- [ ] Confirmar antes de abandonar un grupo
- [ ] Botón explícito para iniciar nuevo mundial (sin esperar registrar partido)

---

## 🔲 Step 13 — Historial de mundiales

- [ ] Listar mundiales anteriores del usuario
- [ ] Ver etapa alcanzada y stats de cada uno

---

## 🔲 Step 14b — Pantalla de detalle del mundial

- [ ] Nueva página `WorldcupDetail` en `/worldcup/:worldcupId`
- [ ] Fetch: `worldcup_matches JOIN matches` para traer todos los partidos del mundial
- [ ] Header: estado (activo/campeón/eliminado), etapa actual, fechas inicio–fin
- [ ] Stats del mundial: PJ, V, E, D + goles y asistencias acumuladas (si existen)
- [ ] Lista de partidos agrupados por etapa (grupos, octavos, etc.)
- [ ] Cada fila: resultado (V/E/D), fecha, ⚽ goles 🎯 asistencias si los tiene
- [ ] Ruta registrada en App.tsx
- [ ] Historial de mundiales en `Profile` → cada fila es clickeable y navega al detalle

---

## 🔲 Step 14 — Goles y asistencias en partidos

- [ ] Agregar campos opcionales `goals` y `assists` al formulario de carga de partido (personal)
- [ ] Guardar en DB (campos nullable en `matches`)
- [ ] Mostrar goles/asistencias en historial de partidos del perfil
- [ ] Sumar goles y asistencias totales como stats en el perfil
- [ ] Incluir goles/asistencias en las stats del mundial (acumulado por worldcup)
- [ ] Mostrar en worldcup history del perfil: goles y asistencias de cada mundial

---

## 🔲 Step 15 — Partidos de grupo

- [ ] SQL: nueva tabla `group_matches` (id, group_id, team_a_score, team_b_score, played_at, replay_url)
- [ ] SQL: nueva tabla `group_match_players` (id, group_match_id, user_id, team ('a'|'b'), goals, assists)
- [ ] UI: botón "Nuevo partido" en el detalle del grupo
- [ ] Formulario: seleccionar participantes del grupo y asignarlos a equipo A o B
- [ ] Formulario: ingresar resultado (score equipo A vs equipo B)
- [ ] Formulario: campo opcional para link de repetición
- [ ] Reemplazar el activity feed actual por el feed de partidos de grupo
- [ ] Feed: mostrar cada partido con equipos, resultado, fecha y jugadores
- [ ] Los partidos de grupo NO están vinculados a partidos personales ni a mundiales

---

## 🔲 Step 16 — Link de repetición

- [ ] Agregar campo opcional `replay_url` al formulario de partido personal
- [ ] Guardar en `matches` (campo nullable)
- [ ] Mostrar link en historial de partidos del perfil si existe
- [ ] (Ya incluido en partidos de grupo en Step 15)

---

## 🔲 Step 17 — Carga de partidos antiguos

- [ ] Definir approach: ¿fecha manual en formulario? ¿bulk import?
- [ ] Permitir seleccionar fecha/hora al registrar un partido (en vez de usar `created_at` automático)
- [ ] Validar que la fecha no sea futura
- [ ] Ordenar historial por `played_at` en vez de `created_at`
- [ ] Compatibilidad con partidos de grupo (misma lógica de fecha manual)
