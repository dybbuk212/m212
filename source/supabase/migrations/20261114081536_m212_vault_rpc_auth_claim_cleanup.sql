
create or replace function public.provider_store_secret(p_secret text,p_name text,p_description text default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
  if coalesce(auth.jwt()->>'role','')<>'service_role' then
    raise exception 'service role required' using errcode='42501';
  end if;
  if p_secret is null or length(p_secret)<8 or length(p_secret)>20000 then
    raise exception 'invalid secret length' using errcode='22023';
  end if;
  select vault.create_secret(p_secret,p_name,p_description) into v_id;
  return v_id;
end;
$$;
revoke all on function public.provider_store_secret(text,text,text) from public,anon,authenticated;
grant execute on function public.provider_store_secret(text,text,text) to service_role;

create or replace function public.provider_get_secret(p_secret_id uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare v_secret text;
begin
  if coalesce(auth.jwt()->>'role','')<>'service_role' then
    raise exception 'service role required' using errcode='42501';
  end if;
  select ds.decrypted_secret into v_secret from vault.decrypted_secrets ds where ds.id=p_secret_id;
  return v_secret;
end;
$$;
revoke all on function public.provider_get_secret(uuid) from public,anon,authenticated;
grant execute on function public.provider_get_secret(uuid) to service_role;
