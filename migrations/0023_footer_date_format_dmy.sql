-- Title: Footer date format patterns
-- Description: Widens the global footer date format check so it accepts pattern values (YYYY-MM-DD, DD-MMM-YYYY, ...) as well as the values stored earlier (short, weekday-short, iso, dmy). Requires 0022_add_global_footer.sql. Safe to run more than once.

ALTER TABLE devices
DROP CONSTRAINT IF EXISTS devices_global_footer_date_format_check;

ALTER TABLE devices
ADD CONSTRAINT devices_global_footer_date_format_check
CHECK (global_footer_date_format IN (
  'none',
  'YYYY-MM-DD',
  'YYYY-DD-MM',
  'DD-MM-YYYY',
  'MM-DD-YYYY',
  'DD-MMM-YYYY',
  'MMM D',
  'ddd, MMM D',
  'short',
  'weekday-short',
  'iso',
  'dmy'
));
