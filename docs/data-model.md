# 🗂️ Data Model

## matches

- id
- user_id
- result (win | lose | draw)
- counts_for_worldcup (boolean)
- goals (integer, nullable)
- assists (integer, nullable)
- replay_url (text, nullable)
- played_at (timestamptz — fecha real del partido, por defecto = created_at)
- created_at

---

## worldcups

- id
- user_id
- current_stage
- group_wins
- group_draws
- group_losses
- status (active | eliminated | completed)
- created_at

---

## worldcup_matches

- id
- worldcup_id
- match_id
- stage

---

## groups

- id
- name
- created_by

---

## group_members

- id
- group_id
- user_id

---

## group_matches

- id
- group_id
- team_a_score (integer)
- team_b_score (integer)
- replay_url (text, nullable)
- played_at (timestamptz)
- created_by (user_id)
- created_at

---

## group_match_players

- id
- group_match_id
- user_id
- team ('a' | 'b')
- goals (integer, default 0)
- assists (integer, default 0)