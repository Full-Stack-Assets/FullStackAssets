BEGIN;
ALTER FUNCTION public.prevent_published_product_version_mutation()
  SET search_path = pg_catalog, public;
COMMIT;
