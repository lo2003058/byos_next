-- Title: Add global footer settings
-- Description: Per-device settings for the footer strip drawn under every screen (date on the left, fixed text in the middle, battery on the right). Off by default.

ALTER TABLE devices
ADD COLUMN IF NOT EXISTS global_footer_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE devices
ADD COLUMN IF NOT EXISTS global_footer_text TEXT NOT NULL DEFAULT '';

ALTER TABLE devices
ADD COLUMN IF NOT EXISTS global_footer_date_format TEXT NOT NULL DEFAULT 'none';

ALTER TABLE devices
ADD COLUMN IF NOT EXISTS global_footer_battery_format TEXT NOT NULL DEFAULT 'none';

ALTER TABLE devices
DROP CONSTRAINT IF EXISTS devices_global_footer_text_length_check;

ALTER TABLE devices
ADD CONSTRAINT devices_global_footer_text_length_check
CHECK (char_length(global_footer_text) <= 40);

ALTER TABLE devices
DROP CONSTRAINT IF EXISTS devices_global_footer_date_format_check;

ALTER TABLE devices
ADD CONSTRAINT devices_global_footer_date_format_check
CHECK (global_footer_date_format IN ('none', 'short', 'weekday-short', 'iso'));

ALTER TABLE devices
DROP CONSTRAINT IF EXISTS devices_global_footer_battery_format_check;

ALTER TABLE devices
ADD CONSTRAINT devices_global_footer_battery_format_check
CHECK (global_footer_battery_format IN ('none', 'percent', 'icon-percent', 'voltage'));

COMMENT ON COLUMN devices.global_footer_enabled IS 'Draw the global footer strip under every screen for this device.';
COMMENT ON COLUMN devices.global_footer_text IS 'Fixed text shown in the middle of the global footer (max 40 characters).';
COMMENT ON COLUMN devices.global_footer_date_format IS 'Date format on the left of the global footer (none|short|weekday-short|iso).';
COMMENT ON COLUMN devices.global_footer_battery_format IS 'Battery format on the right of the global footer (none|percent|icon-percent|voltage).';
