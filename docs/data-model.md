# 🗂️ Data Model

## matches

- id
- user_id
- result (win | lose | draw)
- counts_for_worldcup (boolean)
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