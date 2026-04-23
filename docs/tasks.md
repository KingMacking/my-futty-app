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
