-- Expand employee profiles and seed 100 realistic synthetic employees.
-- Safe to re-run: new columns are guarded and demo records use stable employee codes.
BEGIN;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_type VARCHAR(30) NOT NULL DEFAULT 'permanent'
  CHECK (contract_type IN ('permanent', 'fixed_term', 'part_time', 'internship', 'freelance'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_schedule VARCHAR(30) NOT NULL DEFAULT 'full_time'
  CHECK (work_schedule IN ('full_time', 'part_time', 'shift'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS notes TEXT;

INSERT INTO departments (name, description, monthly_budget)
VALUES
 ('Direction générale', 'Pilotage et gouvernance', 900000),
 ('Finance et comptabilité', 'Comptabilité, trésorerie et contrôle', 650000),
 ('Ressources humaines', 'Recrutement et administration du personnel', 420000),
 ('Informatique', 'Systèmes, support et développement', 700000),
 ('Commercial', 'Ventes et relation client', 550000),
 ('Marketing', 'Communication et marketing', 380000),
 ('Opérations', 'Exploitation et logistique', 600000),
 ('Administration', 'Services généraux et administration', 350000)
ON CONFLICT (name) DO NOTHING;

WITH data AS (
 SELECT n,
   (ARRAY['Mohamed','Amine','Yacine','Karim','Riad','Samir','Walid','Nassim','Bilal','Ilyes','Sofiane','Adel','Anis','Hichem','Farid','Nabil','Kamel','Mehdi','Oussama','Tarek'])[((n-1)%20)+1] AS first_name,
   (ARRAY['Bensaid','Mansouri','Benali','Khelifi','Bouzid','Hamidi','Saidi','Rahmani','Ait Ahmed','Belkacem','Cherif','Zerrouki','Brahimi','Amrani','Mebarki','Yahiaoui','Djebari','Slimani','Haddad','Kaci'])[((n*7-1)%20)+1] AS last_name,
   (ARRAY['Comptable','Assistant RH','Développeur logiciel','Technicien informatique','Commercial','Chargé marketing','Gestionnaire logistique','Assistant administratif','Chef de projet','Analyste financier'])[((n-1)%10)+1] AS position,
   (ARRAY['Alger','Oran','Constantine','Blida','Sétif','Tizi Ouzou','Annaba','Batna','Béjaïa','Tlemcen'])[((n-1)%10)+1] AS city,
   (ARRAY['permanent','fixed_term','permanent','permanent','part_time'])[((n-1)%5)+1] AS contract_type
 FROM generate_series(1,100) AS g(n)
)
INSERT INTO employees
 (employee_code, first_name, last_name, email, phone, department_id, position, hire_date, base_salary,
  employment_status, address, contract_type, work_schedule, notes)
SELECT
 'DEMO-' || LPAD(n::text, 3, '0'),
 first_name, last_name,
 'employee' || LPAD(n::text, 3, '0') || '@example.test',
 '+213 555 ' || LPAD((1000+n)::text, 4, '0'),
 (SELECT id FROM departments ORDER BY id OFFSET ((n-1)%8) LIMIT 1),
 position,
 (DATE '2019-01-01' + ((n*37)%2700)::int),
 (45000 + ((n*1379)%125000))::numeric(14,2),
 CASE WHEN n IN (17,39,72) THEN 'on_leave' WHEN n IN (28,88) THEN 'inactive' ELSE 'active' END,
 'Adresse fictive ' || n || ', ' || city || ', Algérie',
 contract_type,
 CASE WHEN contract_type='part_time' THEN 'part_time' ELSE 'full_time' END,
 'Profil de démonstration généré automatiquement — données fictives.'
FROM data
ON CONFLICT (employee_code) DO NOTHING;

COMMIT;
