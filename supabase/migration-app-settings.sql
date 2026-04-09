-- Run once if you already applied schema.sql before app_settings existed

create table if not exists app_settings (
  key text primary key,
  value text not null
);

insert into app_settings (key, value) values
  ('last_public_sync', '1970-01-01T00:00:00.000Z')
on conflict (key) do nothing;

alter table app_settings enable row level security;
