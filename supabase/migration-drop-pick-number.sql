-- Run once if your database still has pool_players.pick_number (from an older schema)

alter table pool_players drop column if exists pick_number;
