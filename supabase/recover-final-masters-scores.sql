-- One-off recovery for the 2026 Masters pool after score data was lost.
-- Source: final Masters leaderboard published Apr 12, 2026 on PGA TOUR / Golf Channel.
-- Assumption: roster players missing from the final leaderboard missed the cut (or otherwise did not finish),
-- so they are marked as CUT and do not count toward the best-4 team total.

begin;

-- Reset roster rows to a safe final-state baseline first.
update pool_players
set
  today = 'CUT',
  thru = 'CUT',
  total_to_par = 0,
  position = 'CUT',
  status = 'cut',
  last_updated = now();

-- Restore exact final scores for every roster player who made the cut.
update pool_players
set
  today = case full_name
    when 'Scottie Scheffler' then '-4'
    when 'Justin Thomas' then '+1'
    when 'Shane Lowry' then '+8'
    when 'Patrick Cantlay' then '+1'
    when 'Sergio Garcia' then '+3'
    when 'Ludvig Åberg' then 'E'
    when 'Hideki Matsuyama' then '-3'
    when 'Justin Rose' then '-2'
    when 'Si Woo Kim' then 'E'
    when 'Jacob Bridgeman' then '+4'
    when 'Gary Woodland' then '-6'
    when 'Ben Griffin' then '+5'
    when 'Collin Morikawa' then '-4'
    when 'Brooks Koepka' then '-1'
    when 'Russell Henley' then '-4'
    when 'Sam Burns' then '+1'
    when 'Jake Knapp' then '-2'
    when 'Max Homa' then '-5'
    when 'Wyndham Clark' then '+1'
    when 'Jon Rahm' then '-4'
    when 'Tommy Fleetwood' then '+4'
    when 'Jordan Spieth' then '-4'
    when 'Viktor Hovland' then '-5'
    when 'Adam Scott' then '-2'
    when 'Tyrrell Hatton' then '-6'
    when 'Marco Penge' then '+6'
    when 'Kurt Kitayama' then 'E'
    when 'Rory McIlroy' then '-1'
    when 'Xander Schauffele' then '-4'
    when 'Patrick Reed' then '+1'
    when 'Jason Day' then '+3'
    when 'Corey Conners' then '+3'
    when 'Maverick McNealy' then '-5'
    when 'Brian Harman' then '+1'
    when 'Cameron Young' then '+1'
    when 'Matt Fitzpatrick' then '-1'
    when 'Chris Gotterup' then '+1'
    when 'Sepp Straka' then '+4'
    when 'Harris English' then 'E'
    else today
  end,
  thru = case full_name
    when 'Scottie Scheffler' then 'F'
    when 'Justin Thomas' then 'F'
    when 'Shane Lowry' then 'F'
    when 'Patrick Cantlay' then 'F'
    when 'Sergio Garcia' then 'F'
    when 'Ludvig Åberg' then 'F'
    when 'Hideki Matsuyama' then 'F'
    when 'Justin Rose' then 'F'
    when 'Si Woo Kim' then 'F'
    when 'Jacob Bridgeman' then 'F'
    when 'Gary Woodland' then 'F'
    when 'Ben Griffin' then 'F'
    when 'Collin Morikawa' then 'F'
    when 'Brooks Koepka' then 'F'
    when 'Russell Henley' then 'F'
    when 'Sam Burns' then 'F'
    when 'Jake Knapp' then 'F'
    when 'Max Homa' then 'F'
    when 'Wyndham Clark' then 'F'
    when 'Jon Rahm' then 'F'
    when 'Tommy Fleetwood' then 'F'
    when 'Jordan Spieth' then 'F'
    when 'Viktor Hovland' then 'F'
    when 'Adam Scott' then 'F'
    when 'Tyrrell Hatton' then 'F'
    when 'Marco Penge' then 'F'
    when 'Kurt Kitayama' then 'F'
    when 'Rory McIlroy' then 'F'
    when 'Xander Schauffele' then 'F'
    when 'Patrick Reed' then 'F'
    when 'Jason Day' then 'F'
    when 'Corey Conners' then 'F'
    when 'Maverick McNealy' then 'F'
    when 'Brian Harman' then 'F'
    when 'Cameron Young' then 'F'
    when 'Matt Fitzpatrick' then 'F'
    when 'Chris Gotterup' then 'F'
    when 'Sepp Straka' then 'F'
    when 'Harris English' then 'F'
    else thru
  end,
  total_to_par = case full_name
    when 'Scottie Scheffler' then -11
    when 'Justin Thomas' then 2
    when 'Shane Lowry' then -1
    when 'Patrick Cantlay' then -5
    when 'Sergio Garcia' then 8
    when 'Ludvig Åberg' then -3
    when 'Hideki Matsuyama' then -5
    when 'Justin Rose' then -10
    when 'Si Woo Kim' then 4
    when 'Jacob Bridgeman' then 2
    when 'Gary Woodland' then 0
    when 'Ben Griffin' then 0
    when 'Collin Morikawa' then -9
    when 'Brooks Koepka' then -5
    when 'Russell Henley' then -10
    when 'Sam Burns' then -9
    when 'Jake Knapp' then -7
    when 'Max Homa' then -8
    when 'Wyndham Clark' then -3
    when 'Jon Rahm' then 1
    when 'Tommy Fleetwood' then 0
    when 'Jordan Spieth' then -5
    when 'Viktor Hovland' then -4
    when 'Adam Scott' then -2
    when 'Tyrrell Hatton' then -10
    when 'Marco Penge' then 6
    when 'Kurt Kitayama' then 7
    when 'Rory McIlroy' then -12
    when 'Xander Schauffele' then -8
    when 'Patrick Reed' then -5
    when 'Jason Day' then -5
    when 'Corey Conners' then 6
    when 'Maverick McNealy' then -4
    when 'Brian Harman' then 0
    when 'Cameron Young' then -10
    when 'Matt Fitzpatrick' then -4
    when 'Chris Gotterup' then -2
    when 'Sepp Straka' then 2
    when 'Harris English' then -1
    else total_to_par
  end,
  position = case full_name
    when 'Scottie Scheffler' then '2'
    when 'Justin Thomas' then 'T41'
    when 'Shane Lowry' then 'T30'
    when 'Patrick Cantlay' then 'T12'
    when 'Sergio Garcia' then '52'
    when 'Ludvig Åberg' then 'T21'
    when 'Hideki Matsuyama' then 'T12'
    when 'Justin Rose' then 'T3'
    when 'Si Woo Kim' then '47'
    when 'Jacob Bridgeman' then 'T41'
    when 'Gary Woodland' then 'T33'
    when 'Ben Griffin' then 'T33'
    when 'Collin Morikawa' then 'T7'
    when 'Brooks Koepka' then 'T12'
    when 'Russell Henley' then 'T3'
    when 'Sam Burns' then 'T7'
    when 'Jake Knapp' then '11'
    when 'Max Homa' then 'T9'
    when 'Wyndham Clark' then 'T21'
    when 'Jon Rahm' then 'T38'
    when 'Tommy Fleetwood' then 'T33'
    when 'Jordan Spieth' then 'T12'
    when 'Viktor Hovland' then 'T18'
    when 'Adam Scott' then 'T24'
    when 'Tyrrell Hatton' then 'T3'
    when 'Marco Penge' then 'T49'
    when 'Kurt Kitayama' then '51'
    when 'Rory McIlroy' then '1'
    when 'Xander Schauffele' then 'T9'
    when 'Patrick Reed' then 'T12'
    when 'Jason Day' then 'T12'
    when 'Corey Conners' then 'T49'
    when 'Maverick McNealy' then 'T18'
    when 'Brian Harman' then 'T33'
    when 'Cameron Young' then 'T3'
    when 'Matt Fitzpatrick' then 'T18'
    when 'Chris Gotterup' then 'T24'
    when 'Sepp Straka' then 'T41'
    when 'Harris English' then 'T30'
    else position
  end,
  status = case full_name
    when 'Scottie Scheffler' then 'active'
    when 'Justin Thomas' then 'active'
    when 'Shane Lowry' then 'active'
    when 'Patrick Cantlay' then 'active'
    when 'Sergio Garcia' then 'active'
    when 'Ludvig Åberg' then 'active'
    when 'Hideki Matsuyama' then 'active'
    when 'Justin Rose' then 'active'
    when 'Si Woo Kim' then 'active'
    when 'Jacob Bridgeman' then 'active'
    when 'Gary Woodland' then 'active'
    when 'Ben Griffin' then 'active'
    when 'Collin Morikawa' then 'active'
    when 'Brooks Koepka' then 'active'
    when 'Russell Henley' then 'active'
    when 'Sam Burns' then 'active'
    when 'Jake Knapp' then 'active'
    when 'Max Homa' then 'active'
    when 'Wyndham Clark' then 'active'
    when 'Jon Rahm' then 'active'
    when 'Tommy Fleetwood' then 'active'
    when 'Jordan Spieth' then 'active'
    when 'Viktor Hovland' then 'active'
    when 'Adam Scott' then 'active'
    when 'Tyrrell Hatton' then 'active'
    when 'Marco Penge' then 'active'
    when 'Kurt Kitayama' then 'active'
    when 'Rory McIlroy' then 'active'
    when 'Xander Schauffele' then 'active'
    when 'Patrick Reed' then 'active'
    when 'Jason Day' then 'active'
    when 'Corey Conners' then 'active'
    when 'Maverick McNealy' then 'active'
    when 'Brian Harman' then 'active'
    when 'Cameron Young' then 'active'
    when 'Matt Fitzpatrick' then 'active'
    when 'Chris Gotterup' then 'active'
    when 'Sepp Straka' then 'active'
    when 'Harris English' then 'active'
    else status
  end,
  last_updated = now()
where full_name in (
  'Scottie Scheffler',
  'Justin Thomas',
  'Shane Lowry',
  'Patrick Cantlay',
  'Sergio Garcia',
  'Ludvig Åberg',
  'Hideki Matsuyama',
  'Justin Rose',
  'Si Woo Kim',
  'Jacob Bridgeman',
  'Gary Woodland',
  'Ben Griffin',
  'Collin Morikawa',
  'Brooks Koepka',
  'Russell Henley',
  'Sam Burns',
  'Jake Knapp',
  'Max Homa',
  'Wyndham Clark',
  'Jon Rahm',
  'Tommy Fleetwood',
  'Jordan Spieth',
  'Viktor Hovland',
  'Adam Scott',
  'Tyrrell Hatton',
  'Marco Penge',
  'Kurt Kitayama',
  'Rory McIlroy',
  'Xander Schauffele',
  'Patrick Reed',
  'Jason Day',
  'Corey Conners',
  'Maverick McNealy',
  'Brian Harman',
  'Cameron Young',
  'Matt Fitzpatrick',
  'Chris Gotterup',
  'Sepp Straka',
  'Harris English'
);

-- Restore final team totals from the official results using the app's "best 4 of 8" scoring rule.
update teams
set
  rank = case name
    when 'GG' then 1
    when 'Chuck' then 2
    when 'Emil' then 3
    when 'Morc' then 4
    when 'Bho' then 5
    when 'Skip' then 6
    else rank
  end,
  total_to_par = case name
    when 'GG' then -36
    when 'Chuck' then -30
    when 'Emil' then -21
    when 'Morc' then -18
    when 'Bho' then -17
    when 'Skip' then -15
    else total_to_par
  end,
  score_display = case name
    when 'GG' then '-36'
    when 'Chuck' then '-30'
    when 'Emil' then '-21'
    when 'Morc' then '-18'
    when 'Bho' then '-17'
    when 'Skip' then '-15'
    else score_display
  end;

commit;
