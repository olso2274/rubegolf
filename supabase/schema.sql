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
  pick_number integer,
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
insert into pool_players (team_name, pick_number, full_name) values
  ('CHUCK', 1, 'Scottie Scheffler'),
  ('CHUCK', 2, 'Robert MacIntyre'),
  ('CHUCK', 3, 'Min Woo Lee'),
  ('CHUCK', 4, 'Justin Thomas'),
  ('CHUCK', 5, 'Shane Lowry'),
  ('CHUCK', 6, 'Patrick Cantlay'),
  ('CHUCK', 7, 'Daniel Berger'),
  ('CHUCK', 8, 'Sergio Garcia'),
  ('GG', 1, 'Ludvig Åberg'),
  ('GG', 2, 'Hideki Matsuyama'),
  ('GG', 3, 'Justin Rose'),
  ('GG', 4, 'Si Woo Kim'),
  ('GG', 5, 'J.J. Spaun'),
  ('GG', 6, 'Jacob Bridgeman'),
  ('GG', 7, 'Gary Woodland'),
  ('GG', 8, 'Ben Griffin'),
  ('EMIL', 1, 'Bryson DeChambeau'),
  ('EMIL', 2, 'Collin Morikawa'),
  ('EMIL', 3, 'Brooks Koepka'),
  ('EMIL', 4, 'Russell Henley'),
  ('EMIL', 5, 'Sam Burns'),
  ('EMIL', 6, 'Jake Knapp'),
  ('EMIL', 7, 'Max Homa'),
  ('EMIL', 8, 'Wyndham Clark'),
  ('SKIP', 1, 'Jon Rahm'),
  ('SKIP', 2, 'Tommy Fleetwood'),
  ('SKIP', 3, 'Jordan Spieth'),
  ('SKIP', 4, 'Viktor Hovland'),
  ('SKIP', 5, 'Adam Scott'),
  ('SKIP', 6, 'Tyrrell Hatton'),
  ('SKIP', 7, 'Marco Penge'),
  ('SKIP', 8, 'Kurt Kitayama'),
  ('BHO', 1, 'Rory McIlroy'),
  ('BHO', 2, 'Xander Schauffele'),
  ('BHO', 3, 'Patrick Reed'),
  ('BHO', 4, 'Jason Day'),
  ('BHO', 5, 'Corey Conners'),
  ('BHO', 6, 'Maverick McNealy'),
  ('BHO', 7, 'Cameron Smith'),
  ('BHO', 8, 'Brian Harman'),
  ('MORC', 1, 'Cameron Young'),
  ('MORC', 2, 'Matt Fitzpatrick'),
  ('MORC', 3, 'Akshay Bhatia'),
  ('MORC', 4, 'Chris Gotterup'),
  ('MORC', 5, 'Sepp Straka'),
  ('MORC', 6, 'Nicolai Højgaard'),
  ('MORC', 7, 'Harris English'),
  ('MORC', 8, 'Nico Echavarria')
on conflict (full_name) do nothing;
