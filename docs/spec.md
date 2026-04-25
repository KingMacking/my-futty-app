# 🧩 Product Spec — App Mundial Amateur

## 🎯 Propuesta

Una app donde jugadores amateur pueden registrar partidos y competir en “mundiales personales”, avanzando automáticamente según sus resultados.

---

## ⚽ Partidos

- Resultado:
  - Gané
  - Perdí
  - Empaté
- Opción:
  - “Cuenta para mi mundial”- Stats opcionales:
  - Goles anotados (número, nullable)
  - Asistencias (número, nullable)
  - Estas stats se acumulan en el perfil y en el mundial activo
- Opcionales adicionales:
  - Link de repetición (URL, nullable)
  - Fecha manual para cargar partidos antiguos (por defecto = ahora)
---

## 🌍 Mundial (Core)

### Estructura

- Fase de grupos:
  - Hasta 3 partidos
- Eliminación directa:
  - Octavos → Cuartos → Semi → Final

---

### Reglas

- Ganar → avanzar
- Perder → eliminado
- Empate → moneda (random)

---

### Condiciones grupos

- 2 victorias → avanzar
- 3 partidos jugados:
  - 1W / 1D / 1L → moneda
  - otros → eliminado

---

## 👥 Grupos

- Crear grupo
- Unirse por código / deep link
- Ver miembros
- **Partidos de grupo:**
  - Cualquier miembro puede crear un partido de grupo
  - Se eligen jugadores del grupo y se asignan a equipo A o B
  - Se ingresa el score final (ej: 3-2)
  - Cada jugador puede tener goles y asistencias en el partido
  - Campo opcional para link de repetición
  - Los partidos de grupo NO afectan los mundiales personales ni el historial individual
  - El feed del grupo muestra estos partidos (reemplaza el activity feed de matches personales)
- Salir del grupo

---

## 🎮 Motivación

- Completar el mundial
- Ver progreso
- Historial de partidos
- Ver actividad de amigos (fase futura)