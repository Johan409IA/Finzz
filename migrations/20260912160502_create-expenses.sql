create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.expense_categories(id),
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null,
  description text not null default '' check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_user_id_date_idx on public.expenses (user_id, expense_date desc, created_at desc);
create index expenses_category_id_idx on public.expenses (category_id);

insert into public.expense_categories (slug, name)
values
  ('alimentacion', 'Alimentación'),
  ('transporte', 'Transporte'),
  ('vivienda', 'Vivienda'),
  ('servicios', 'Servicios'),
  ('salud', 'Salud'),
  ('ocio', 'Ocio'),
  ('educacion', 'Educación'),
  ('otros', 'Otros')
on conflict (slug) do update set name = excluded.name;

alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;

create policy expense_categories_select_authenticated
  on public.expense_categories
  for select
  to authenticated
  using (true);

create policy expenses_select_own
  on public.expenses
  for select
  to authenticated
  using (user_id = auth.uid());

create policy expenses_insert_own
  on public.expenses
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy expenses_update_own
  on public.expenses
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy expenses_delete_own
  on public.expenses
  for delete
  to authenticated
  using (user_id = auth.uid());
