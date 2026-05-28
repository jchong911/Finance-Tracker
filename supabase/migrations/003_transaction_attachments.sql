-- Transaction attachments (pay stubs, receipts) + Supabase Storage bucket

alter table public.transactions
  add column attachment_path text,
  add column attachment_name text,
  add column attachment_mime text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "attachments_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "attachments_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "attachments_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);
