USE rikaz_accounting_db;

CREATE TABLE IF NOT EXISTS payroll_disbursements (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  association_id  INT UNSIGNED NOT NULL,
  employee_id     INT UNSIGNED NOT NULL,
  payroll_month   TINYINT UNSIGNED NOT NULL,
  payroll_year    YEAR NOT NULL,
  net_amount      DECIMAL(15, 2) NOT NULL,
  voucher_id      INT UNSIGNED NOT NULL,
  disbursed_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payroll_employee_period (association_id, employee_id, payroll_year, payroll_month),
  INDEX idx_payroll_disbursements_period (association_id, payroll_year, payroll_month),
  CONSTRAINT fk_payroll_disbursements_association
    FOREIGN KEY (association_id) REFERENCES associations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payroll_disbursements_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
