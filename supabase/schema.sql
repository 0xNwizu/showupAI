-- ============================================
-- ShowUp AI - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions (uuid-ossp is available on all plans)
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid references auth.users(id) on delete cascade unique,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text default '',
  mock_wallet_address text unique,
  mock_sol_balance decimal(10,4) default 10.0000,
  total_hangouts int default 0,
  hangouts_attended int default 0,
  reliability_score decimal(5,2) default 100.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- GROUPS TABLE
-- ============================================
create table if not exists public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text default '',
  emoji text default '🎉',
  created_by uuid references public.users(id) on delete cascade not null,
  status text default 'planning' check (
    status in ('planning', 'collecting_availability', 'ai_planning', 'plan_ready', 'committing', 'committed', 'active', 'completed', 'cancelled')
  ),
  event_date timestamptz,
  event_location text,
  event_type text check (
    event_type in ('dinner', 'drinks', 'outdoor', 'movie', 'gaming', 'sports', 'travel', 'party', 'cafe', 'concert', 'other')
  ),
  deposit_amount_sol decimal(10,4) default 0.1000,
  ai_plan jsonb,
  ai_plan_summary text,
  total_committed int default 0,
  total_members int default 0,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  max_members int default 20,
  checkin_window_hours int default 2,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- GROUP MEMBERS TABLE
-- ============================================
create table if not exists public.group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  status text default 'active' check (status in ('invited', 'active', 'left', 'kicked')),
  committed boolean default false,
  checked_in boolean default false,
  commitment_tx_mock text,
  committed_at timestamptz,
  checked_in_at timestamptz,
  availability_submitted boolean default false,
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- ============================================
-- AVAILABILITY RESPONSES TABLE
-- ============================================
create table if not exists public.availability_responses (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  available_dates jsonb default '[]',
  budget_range text check (budget_range in ('budget', 'moderate', 'splurge', 'no_limit')),
  budget_amount_usd int,
  vibe_preferences jsonb default '[]',
  dietary_restrictions text default '',
  transport text default '',
  max_travel_time int default 30,
  notes text default '',
  location text default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(group_id, user_id)
);

-- ============================================
-- COMMITMENTS TABLE (Mock SOL)
-- ============================================
create table if not exists public.commitments (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  amount_sol decimal(10,4) not null,
  status text default 'locked' check (status in ('locked', 'returned', 'rewarded', 'forfeited')),
  tx_hash_mock text unique not null,
  commitment_slot_mock bigint,
  resolved_at timestamptz,
  resolution_note text,
  committed_at timestamptz default now(),
  unique(group_id, user_id)
);

-- ============================================
-- MOCK TRANSACTIONS TABLE
-- ============================================
create table if not exists public.mock_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade,
  type text not null check (type in ('deposit', 'return', 'reward', 'forfeit', 'initial_airdrop')),
  amount_sol decimal(10,4) not null,
  balance_after decimal(10,4) not null,
  tx_hash text unique not null,
  status text default 'confirmed' check (status in ('pending', 'confirmed', 'failed')),
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- ============================================
-- AI CONVERSATIONS TABLE
-- ============================================
create table if not exists public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id),
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  message_type text default 'chat' check (
    message_type in ('chat', 'plan_generation', 'nudge', 'availability_collection', 'event_summary')
  ),
  metadata jsonb,
  created_at timestamptz default now()
);

-- ============================================
-- NUDGES TABLE
-- ============================================
create table if not exists public.nudges (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  type text default 'reminder' check (
    type in ('reminder', 'commitment_push', 'event_reminder', 'post_event', 'flake_warning', 'last_call')
  ),
  sent_by text default 'ai',
  read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- CHECKINS TABLE
-- ============================================
create table if not exists public.checkins (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  checked_in_at timestamptz default now(),
  lat decimal(10, 6),
  lng decimal(10, 6),
  verification_method text default 'manual' check (
    verification_method in ('manual', 'location', 'photo', 'qr')
  ),
  verified boolean default false,
  unique(group_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_groups_created_by on public.groups(created_by);
create index if not exists idx_groups_status on public.groups(status);
create index if not exists idx_group_members_group_id on public.group_members(group_id);
create index if not exists idx_group_members_user_id on public.group_members(user_id);
create index if not exists idx_availability_group_id on public.availability_responses(group_id);
create index if not exists idx_commitments_group_id on public.commitments(group_id);
create index if not exists idx_ai_conversations_group_id on public.ai_conversations(group_id);
create index if not exists idx_nudges_user_id on public.nudges(user_id);
create index if not exists idx_mock_transactions_user_id on public.mock_transactions(user_id);

-- ============================================
-- HELPER FUNCTIONS (security definer — bypass RLS safely)
-- ============================================

-- Returns all group_ids the current user belongs to.
-- Used in RLS policies to avoid self-referential recursion on group_members.
create or replace function public.get_my_group_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select group_id
  from public.group_members
  where user_id = (select id from public.users where auth_id = auth.uid())
    and status = 'active'
$$;

-- Returns the public.users.id for the current auth user
create or replace function public.my_user_id()
returns uuid
language sql
security definer
stable
as $$
  select id from public.users where auth_id = auth.uid()
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.availability_responses enable row level security;
alter table public.commitments enable row level security;
alter table public.mock_transactions enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.nudges enable row level security;
alter table public.checkins enable row level security;

-- Users policies
create policy "Users can read any profile"
  on public.users for select using (true);
create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = auth_id);
create policy "Users can update own profile"
  on public.users for update using (auth.uid() = auth_id);

-- Groups policies
create policy "Members can read their groups"
  on public.groups for select
  using (id in (select public.get_my_group_ids()));
create policy "Users can create groups"
  on public.groups for insert
  with check (created_by = public.my_user_id());
create policy "Group admins can update groups"
  on public.groups for update
  using (
    id in (
      select group_id from public.group_members
      where user_id = public.my_user_id() and role = 'admin'
    )
  );

-- Group members policies (uses helper fn — no recursion)
create policy "Members can read group_members for their groups"
  on public.group_members for select
  using (group_id in (select public.get_my_group_ids()));
create policy "Users can join groups"
  on public.group_members for insert
  with check (user_id = public.my_user_id());
create policy "Users can update own membership"
  on public.group_members for update
  using (user_id = public.my_user_id());

-- Availability policies
create policy "Group members can read availability"
  on public.availability_responses for select
  using (group_id in (select public.get_my_group_ids()));
create policy "Users can submit own availability"
  on public.availability_responses for insert
  with check (user_id = public.my_user_id());
create policy "Users can update own availability"
  on public.availability_responses for update
  using (user_id = public.my_user_id());

-- Commitments policies
create policy "Group members can read commitments"
  on public.commitments for select
  using (group_id in (select public.get_my_group_ids()));
create policy "Users can create own commitments"
  on public.commitments for insert
  with check (user_id = public.my_user_id());

-- Mock transactions policies
create policy "Users can read own transactions"
  on public.mock_transactions for select
  using (user_id = public.my_user_id());
create policy "Users can insert own transactions"
  on public.mock_transactions for insert
  with check (user_id = public.my_user_id());

-- AI conversations policies
create policy "Group members can read ai conversations"
  on public.ai_conversations for select
  using (group_id in (select public.get_my_group_ids()));
create policy "Users can create ai conversations"
  on public.ai_conversations for insert
  with check (user_id = public.my_user_id() or user_id is null);

-- Nudges policies
create policy "Users can read own nudges"
  on public.nudges for select
  using (user_id = public.my_user_id());
create policy "Users can mark nudges as read"
  on public.nudges for update
  using (user_id = public.my_user_id());
-- Group admins/members can send nudges (AI system uses service role which bypasses RLS)
create policy "Group members can insert nudges"
  on public.nudges for insert
  with check (
    group_id in (select public.get_my_group_ids())
  );

-- Checkins policies
create policy "Group members can read checkins"
  on public.checkins for select
  using (group_id in (select public.get_my_group_ids()));
create policy "Users can submit own checkin"
  on public.checkins for insert
  with check (user_id = public.my_user_id());

-- ============================================
-- TRIGGERS
-- ============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger handle_groups_updated_at
  before update on public.groups
  for each row execute procedure public.handle_updated_at();

create trigger handle_availability_updated_at
  before update on public.availability_responses
  for each row execute procedure public.handle_updated_at();

-- Update group member count
create or replace function public.update_group_member_count()
returns trigger as $$
begin
  update public.groups
  set total_members = (
    select count(*) from public.group_members
    where group_id = coalesce(new.group_id, old.group_id)
    and status = 'active'
  )
  where id = coalesce(new.group_id, old.group_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger update_member_count
  after insert or update or delete on public.group_members
  for each row execute procedure public.update_group_member_count();
