create table if not exists public.provider_jobs (
 id uuid primary key default gen_random_uuid(), provider_connection_id uuid not null references public.provider_connections(id) on delete restrict,
 operation text not null check (operation in ('connection.test','domain.availability_check','account.read')),
 environment text not null default 'sandbox' check(environment='sandbox'), idempotency_key text not null unique,
 payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),
 status text not null default 'queued' check(status in ('queued','processing','succeeded','failed','dead_letter')),
 attempts integer not null default 0 check(attempts between 0 and 10), available_at timestamptz not null default now(),
 locked_at timestamptz,locked_by text,result jsonb,error_code text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists provider_jobs_claim_idx on public.provider_jobs(status,available_at,created_at);
alter table public.provider_jobs enable row level security;
revoke all on public.provider_jobs from anon,authenticated; grant all on public.provider_jobs to service_role;
create or replace function public.claim_provider_jobs(p_worker text,p_limit integer default 10)
returns setof public.provider_jobs language sql security definer set search_path=''
as $$ update public.provider_jobs j set status='processing',locked_at=now(),locked_by=p_worker,attempts=j.attempts+1,updated_at=now()
where j.id in (select id from public.provider_jobs where (status='queued' and available_at<=now()) or (status='processing' and locked_at<now()-interval '5 minutes') order by created_at for update skip locked limit greatest(1,least(p_limit,50))) returning j.*; $$;
revoke all on function public.claim_provider_jobs(text,integer) from public,anon,authenticated;
grant execute on function public.claim_provider_jobs(text,integer) to service_role;
