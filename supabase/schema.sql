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
  ('CHUCK', null, 0, 'E'),
  ('GG', null, 0, 'E'),
  ('EMIL', null, 0, 'E'),
  ('SKIP', null, 0, 'E'),
  ('BHO', null, 0, 'E'),
  ('MORC', null, 0, 'E')
on conflict (name) do nothing;

-- Seed: pool players (exact draft names)
insert into pool_players (team_name, full_name) values
  ('CHUCK', 'Scottie Scheffler'),
  ('CHUCK', 'Robert MacIntyre'),
  ('CHUCK', 'Min Woo Lee'),
  ('CHUCK', 'Justin Thomas'),
  ('CHUCK', 'Shane Lowry'),
  ('CHUCK', 'Patrick Cantlay'),
  ('CHUCK', 'Daniel Berger'),
  ('CHUCK', 'Sergio Garcia'),
  ('GG', 'Ludvig Åberg'),
  ('GG', 'Hideki Matsuyama'),
  ('GG', 'Justin Rose'),
  ('GG', 'Si Woo Kim'),
  ('GG', 'J.J. Spaun'),
  ('GG', 'Jacob Bridgeman'),
  ('GG', 'Gary Woodland'),
  ('GG', 'Ben Griffin'),
  ('EMIL', 'Bryson DeChambeau'),
  ('EMIL', 'Collin Morikawa'),
  ('EMIL', 'Brooks Koepka'),
  ('EMIL', 'Russell Henley'),
  ('EMIL', 'Sam Burns'),
  ('EMIL', 'Jake Knapp'),
  ('EMIL', 'Max Homa'),
  ('EMIL', 'Wyndham Clark'),
  ('SKIP', 'Jon Rahm'),
  ('SKIP', 'Tommy Fleetwood'),
  ('SKIP', 'Jordan Spieth'),
  ('SKIP', 'Viktor Hovland'),
  ('SKIP', 'Adam Scott'),
  ('SKIP', 'Tyrrell Hatton'),
  ('SKIP', 'Marco Penge'),
  ('SKIP', 'Kurt Kitayama'),
  ('BHO', 'Rory McIlroy'),
  ('BHO', 'Xander Schauffele'),
  ('BHO', 'Patrick Reed'),
  ('BHO', 'Jason Day'),
  ('BHO', 'Corey Conners'),
  ('BHO', 'Maverick McNealy'),
  ('BHO', 'Cameron Smith'),
  ('BHO', 'Brian Harman'),
  ('MORC', 'Cameron Young'),
  ('MORC', 'Matt Fitzpatrick'),
  ('MORC', 'Akshay Bhatia'),
  ('MORC', 'Chris Gotterup'),
  ('MORC', 'Sepp Straka'),
  ('MORC', 'Nicolai Højgaard'),
  ('MORC', 'Harris English'),
  ('MORC', 'Nico Echavarria')
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
