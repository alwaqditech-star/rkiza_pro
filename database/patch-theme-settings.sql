USE rikaz_accounting_db;

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key   VARCHAR(64) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO system_settings (setting_key, setting_value)
VALUES ('theme_id', 'navy-gold')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
