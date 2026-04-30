import { supabase } from '../config/supabase';

const ensureBucketExists = async (bucket: string) => {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  const exists = buckets?.some((b) => b.name === bucket);
  if (exists) return;

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
  });

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw createError;
  }
};

export const uploadToSupabase = async (
  bucket: string,
  path: string,
  fileBuffer: Buffer,
  contentType: string
) => {
  await ensureBucketExists(bucket);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
};
