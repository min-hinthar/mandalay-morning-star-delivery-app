alter table public.modifier_options
add column if not exists is_active boolean not null default true;

update public.modifier_options
set is_active = true
where is_active is null;

alter table public.modifier_options
alter column is_active set default true;
