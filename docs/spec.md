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
  - “Cuenta para mi mundial”

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

## 👥 Grupos (MVP simple)

- Crear grupo
- Unirse
- Ver actividad básica

---

## 🎮 Motivación

- Completar el mundial
- Ver progreso
- Historial de partidos
- Ver actividad de amigos (fase futura)