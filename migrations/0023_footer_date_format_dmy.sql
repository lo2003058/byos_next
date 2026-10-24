-- Title: Allow the dd-Mon-yyyy footer date format
-- Description: Adds 'dmy' (e.g. 24-Oct-2026) to the allowed global footer date formats. Requires 0022_add_global_footer.sql.

ALTER TABLE devices
DROP CONSTRAINT IF EXISTS devices_global_footer_date_format_check;

ALTER TABLE devices
ADD CONSTRAINT devices_global_footer_date_format_check
CHECK (global_footer_date_format IN ('none', 'short', 'weekday-short', 'iso', 'dmy'));
