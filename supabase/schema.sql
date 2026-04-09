-- Masters Pool 2026 — run once in Supabase SQL editor
-- Enable Realtime: Dashboard → Database → Replication → enable pool_players + teams

-- Teams
create table if not exists teams (
  id serial primary key,
  name text unique not null,
  rank integer,
  total_to_par integer default 0,
  score_display text default 'E'
);

-- Pool Players (48 drafted players)
create table if not exists pool_players (
  id serial primary key,
  team_name text references teams(name),
  full_name text unique not null,
  pga_id text,
  today text default 'E',
  thru text default '0',
  total_to_par integer default 0,
  position text,
  status text,
  last_updated timestamptz default now()
);

alter table teams enable row level security;
alter table pool_players enable row level security;

drop policy if exists "Public read teams" on teams;
create policy "Public read teams" on teams for select using (true);

drop policy if exists "Public read pool_players" on pool_players;
create policy "Public read pool_players" on pool_players for select using (true);

-- Seed: teams
insert into teams (name, rank, total_to_par, score_display) values
  ('Skip', null, 0, 'E'),
  ('Morc', null, 0, 'E'),
  ('GG', null, 0, 'E'),
  ('Emil', null, 0, 'E'),
  ('Chuck', null, 0, 'E'),
  ('Bho', null, 0, 'E')
on conflict (name) do nothing;

-- Seed: pool players (exact draft names)
insert into pool_players (team_name, full_name) values
  ('Skip', 'Scottie Scheffler'),
  ('Skip', 'Robert MacIntyre'),
  ('Skip', 'Min Woo Lee'),
  ('Skip', 'Justin Thomas'),
  ('Skip', 'Shane Lowry'),
  ('Skip', 'Patrick Cantlay'),
  ('Skip', 'Daniel Berger'),
  ('Skip', 'Sergio Garcia'),
  ('Morc', 'Ludvig Åberg'),
  ('Morc', 'Hideki Matsuyama'),
  ('Morc', 'Justin Rose'),
  ('Morc', 'Si Woo Kim'),
  ('Morc', 'J.J. Spaun'),
  ('Morc', 'Jacob Bridgeman'),
  ('Morc', 'Gary Woodland'),
  ('Morc', 'Ben Griffin'),
  ('GG', 'Bryson DeChambeau'),
  ('GG', 'Collin Morikawa'),
  ('GG', 'Brooks Koepka'),
  ('GG', 'Russell Henley'),
  ('GG', 'Sam Burns'),
  ('GG', 'Jake Knapp'),
  ('GG', 'Max Homa'),
  ('GG', 'Wyndham Clark'),
  ('Emil', 'Jon Rahm'),
  ('Emil', 'Tommy Fleetwood'),
  ('Emil', 'Jordan Spieth'),
  ('Emil', 'Viktor Hovland'),
  ('Emil', 'Adam Scott'),
  ('Emil', 'Tyrrell Hatton'),
  ('Emil', 'Marco Penge'),
  ('Emil', 'Kurt Kitayama'),
  ('Chuck', 'Rory McIlroy'),
  ('Chuck', 'Xander Schauffele'),
  ('Chuck', 'Patrick Reed'),
  ('Chuck', 'Jason Day'),
  ('Chuck', 'Corey Conners'),
  ('Chuck', 'Maverick McNealy'),
  ('Chuck', 'Cameron Smith'),
  ('Chuck', 'Brian Harman'),
  ('Bho', 'Cameron Young'),
  ('Bho', 'Matt Fitzpatrick'),
  ('Bho', 'Akshay Bhatia'),
  ('Bho', 'Chris Gotterup'),
  ('Bho', 'Sepp Straka'),
  ('Bho', 'Nicolai Højgaard'),
  ('Bho', 'Harris English'),
  ('Bho', 'Nico Echavarria')
on conflict (full_name) do nothing;

-- Cooldown timestamp for public "Sync scores" button (service role only)
create table if not exists app_settings (
  key text primary key,
  value text not null
);

insert into app_settings (key, value) values
  ('last_public_sync', '1970-01-01T00:00:00.000Z')
on conflict (key) do nothing;

alter table app_settings enable row level security;
