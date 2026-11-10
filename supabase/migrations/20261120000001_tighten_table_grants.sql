-- Defence in depth. Row Level Security already stops anonymous writes through the API, but TRUNCATE is not covered by RLS
-- and the broad default grants are unnecessary. Anonymous visitors may write only to the two public form tables.
revoke insert, update, delete, truncate on all tables in schema public from anon;
grant insert on enquiries, newsletter_subscribers to anon;
revoke truncate on all tables in schema public from authenticated;

-- Keep future tables the same: new tables get no anonymous write access and no TRUNCATE for signed-in users by default.
alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon;
alter default privileges in schema public revoke truncate on tables from authenticated;
