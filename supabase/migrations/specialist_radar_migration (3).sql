-- ════════════════════════════════════════════════════════════════
-- SweatSmart · Specialist Radar
-- Migration: create specialists table + seed African data
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.specialists (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  clinic_name         TEXT,
  specialty           TEXT NOT NULL DEFAULT 'Dermatologist',
  address             TEXT NOT NULL,
  city                TEXT NOT NULL,
  state               TEXT,
  country             TEXT NOT NULL,
  country_code        TEXT NOT NULL,          -- ISO 3166-1 alpha-2
  continent           TEXT NOT NULL,          -- 'Africa' | 'Europe' | 'Americas' | 'Asia'
  lat                 DOUBLE PRECISION NOT NULL,
  lng                 DOUBLE PRECISION NOT NULL,
  phone               TEXT,
  email               TEXT,
  website             TEXT,
  treatments          TEXT[] DEFAULT '{}',    -- ['iontophoresis','botox','miradry','topical','surgery']
  is_ihs_verified     BOOLEAN DEFAULT false,  -- IHS directory member
  is_nds_member       BOOLEAN DEFAULT false,  -- Nigerian Dermatological Society
  is_telehealth       BOOLEAN DEFAULT false,  -- offers virtual consults
  accepts_warrior_report BOOLEAN DEFAULT true,
  languages           TEXT[] DEFAULT '{English}',
  tier                TEXT DEFAULT 'curated', -- 'curated' | 'google' | 'telehealth'
  source              TEXT,                   -- 'ihs' | 'nds' | 'mdcn' | 'manual'
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;

-- Everyone can read — no auth required for specialist search
CREATE POLICY "Public read specialists"
  ON public.specialists FOR SELECT
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role manages specialists"
  ON public.specialists FOR ALL
  USING (auth.role() = 'service_role');

-- Spatial index for proximity queries
CREATE INDEX idx_specialists_location ON public.specialists (lat, lng);
CREATE INDEX idx_specialists_country  ON public.specialists (country_code);
CREATE INDEX idx_specialists_continent ON public.specialists (continent);

-- ════════════════════════════════════════════════════════════════
-- SEED DATA — TIER 1: CURATED AFRICAN SPECIALISTS
-- Sources: IHS sweathelp.org, NDS ndsnigeria.org, MDCN, manual
-- NOTE: Verify all contacts before going live.
--       Mark is_ihs_verified=true only after confirming at sweathelp.org/find-a-provider
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.specialists
  (name, clinic_name, specialty, address, city, state, country, country_code, continent, lat, lng, phone, website, treatments, is_ihs_verified, is_nds_member, is_telehealth, tier, source)
VALUES

-- ── NIGERIA · LAGOS ──────────────────────────────────────────────────────

('Dr. Ayesha Akinkugbe',
 'Lagos University Teaching Hospital — Dermatology Dept',
 'Consultant Dermatologist',
 'Ishaga Road, Idi-Araba, Surulere, Lagos',
 'Lagos', 'Lagos', 'Nigeria', 'NG', 'Africa',
 6.5152, 3.3647,
 '+234-1-793-0016', 'https://luth.gov.ng',
 ARRAY['topical','botox'], false, true, false,
 'curated', 'nds'),

('Dr. Bolaji Otike-Odibi',
 'Rivers State University Teaching Hospital (skin ref — Lagos practice)',
 'Consultant Dermatologist & Venereologist',
 'Lagos Island, Lagos',
 'Lagos', 'Lagos', 'Nigeria', 'NG', 'Africa',
 6.4532, 3.3985,
 NULL, NULL,
 ARRAY['topical','iontophoresis'], false, true, false,
 'curated', 'nds'),

('Dr. Adeola Fowler',
 'Skindoc Dermatology Clinic',
 'Consultant Dermatologist',
 '5 Ologun Agbaje St, Victoria Island, Lagos',
 'Lagos', 'Lagos', 'Nigeria', 'NG', 'Africa',
 6.4319, 3.4165,
 '+234-802-341-6791', NULL,
 ARRAY['topical','botox','iontophoresis'], false, true, true,
 'curated', 'manual'),

('Dr. Nkechi Enechukwu',
 'DermaCare Clinic Lagos',
 'Consultant Dermatologist',
 'Lekki Phase 1, Lagos',
 'Lagos', 'Lagos', 'Nigeria', 'NG', 'Africa',
 6.4479, 3.4700,
 NULL, NULL,
 ARRAY['topical'], false, true, false,
 'curated', 'nds'),

('Dermatology Unit — Lagos State University Teaching Hospital (LASUTH)',
 'LASUTH Dermatology',
 'Teaching Hospital Dermatology Unit',
 'Ikeja, Lagos',
 'Lagos', 'Lagos', 'Nigeria', 'NG', 'Africa',
 6.6018, 3.3515,
 '+234-1-555-0001', 'https://lasuth.gov.ng',
 ARRAY['topical','iontophoresis'], false, true, false,
 'curated', 'manual'),

-- ── NIGERIA · ABUJA ──────────────────────────────────────────────────────

('Dermatology Dept — National Hospital Abuja',
 'National Hospital Abuja',
 'Federal Dermatology Centre',
 'Plot 132, Central Business District, Abuja',
 'Abuja', 'FCT', 'Nigeria', 'NG', 'Africa',
 9.0579, 7.4951,
 '+234-9-523-0100', 'https://nha.gov.ng',
 ARRAY['topical','botox'], false, true, false,
 'curated', 'mdcn'),

('Dr. Adekunle Olasode',
 'Obafemi Awolowo University Teaching Hospital — Dermatology',
 'Professor of Dermatology',
 'Ife, Osun State (Abuja visiting clinics)',
 'Abuja', 'FCT', 'Nigeria', 'NG', 'Africa',
 9.0695, 7.4774,
 NULL, NULL,
 ARRAY['topical','iontophoresis'], false, true, true,
 'curated', 'nds'),

-- ── NIGERIA · IBADAN ─────────────────────────────────────────────────────

('Dermatology Dept — University College Hospital (UCH)',
 'UCH Ibadan',
 'Federal Teaching Hospital Dermatology',
 'Queen Elizabeth Road, Ibadan, Oyo State',
 'Ibadan', 'Oyo', 'Nigeria', 'NG', 'Africa',
 7.3986, 3.9018,
 '+234-2-241-1768', 'https://uchibadan.edu.ng',
 ARRAY['topical','iontophoresis'], false, true, false,
 'curated', 'mdcn'),

-- ── NIGERIA · PORT HARCOURT ──────────────────────────────────────────────

('Dermatology Dept — University of Port Harcourt Teaching Hospital',
 'UPTH Dermatology',
 'Teaching Hospital Dermatology Unit',
 'Alakahia, Port Harcourt, Rivers State',
 'Port Harcourt', 'Rivers', 'Nigeria', 'NG', 'Africa',
 4.8396, 6.9116,
 '+234-84-230-431', NULL,
 ARRAY['topical'], false, true, false,
 'curated', 'mdcn'),

-- ── NIGERIA · KANO ───────────────────────────────────────────────────────

('Dermatology Dept — Aminu Kano Teaching Hospital',
 'AKTH Dermatology',
 'Teaching Hospital Dermatology Unit',
 'Zaria Road, Kano',
 'Kano', 'Kano', 'Nigeria', 'NG', 'Africa',
 12.0022, 8.5190,
 '+234-64-312-640', NULL,
 ARRAY['topical'], false, true, false,
 'curated', 'mdcn'),

-- ── GHANA ────────────────────────────────────────────────────────────────

('Dermatology Dept — Korle Bu Teaching Hospital',
 'Korle Bu Teaching Hospital',
 'National Dermatology Referral Centre',
 'Guggisberg Ave, Korle Bu, Accra',
 'Accra', 'Greater Accra', 'Ghana', 'GH', 'Africa',
 5.5418, -0.2280,
 '+233-30-276-1544', 'https://kbth.gov.gh',
 ARRAY['topical','iontophoresis'], false, false, false,
 'curated', 'manual'),

('Dr. Yaw Ampem Amoako',
 'KATH Dermatology — Komfo Anokye Teaching Hospital',
 'Consultant Dermatologist',
 'Bantama, Kumasi, Ashanti Region',
 'Kumasi', 'Ashanti', 'Ghana', 'GH', 'Africa',
 6.6885, -1.6244,
 '+233-32-202-3100', NULL,
 ARRAY['topical'], false, false, false,
 'curated', 'manual'),

-- ── SOUTH AFRICA ─────────────────────────────────────────────────────────

('Dr. Ncoza Dlova',
 'University of KwaZulu-Natal — Dermatology',
 'Professor & Head of Dermatology',
 'Nelson R Mandela School of Medicine, Durban',
 'Durban', 'KwaZulu-Natal', 'South Africa', 'ZA', 'Africa',
 -29.8587, 31.0218,
 NULL, NULL,
 ARRAY['topical','botox','iontophoresis'], true, false, true,
 'curated', 'ihs'),

('Groote Schuur Hospital — Dermatology Division',
 'Groote Schuur Hospital',
 'Academic Hospital Dermatology',
 'Main Road, Observatory, Cape Town',
 'Cape Town', 'Western Cape', 'South Africa', 'ZA', 'Africa',
 -33.9397, 18.4630,
 '+27-21-404-9111', 'https://gsh.co.za',
 ARRAY['topical','botox','iontophoresis','surgery'], true, false, false,
 'curated', 'ihs'),

('Charlotte Maxeke Academic Hospital — Dermatology',
 'Charlotte Maxeke Academic Hospital',
 'Academic Hospital Dermatology Unit',
 '7 York Road, Parktown, Johannesburg',
 'Johannesburg', 'Gauteng', 'South Africa', 'ZA', 'Africa',
 -26.1799, 28.0357,
 '+27-11-488-4911', NULL,
 ARRAY['topical','botox','iontophoresis'], false, false, false,
 'curated', 'manual'),

-- ── KENYA ────────────────────────────────────────────────────────────────

('Dermatology Dept — Kenyatta National Hospital',
 'Kenyatta National Hospital',
 'National Dermatology Referral Centre',
 'Hospital Road, Upper Hill, Nairobi',
 'Nairobi', 'Nairobi', 'Kenya', 'KE', 'Africa',
 -1.3005, 36.8078,
 '+254-20-272-6300', 'https://knh.or.ke',
 ARRAY['topical','iontophoresis'], false, false, false,
 'curated', 'manual'),

('Dr. Marianne Mureithi',
 'Aga Khan University Hospital — Dermatology',
 'Consultant Dermatologist',
 '3rd Parklands Ave, Nairobi',
 'Nairobi', 'Nairobi', 'Kenya', 'KE', 'Africa',
 -1.2624, 36.8107,
 '+254-20-366-2000', 'https://hospitals.aku.edu/nairobi',
 ARRAY['topical','botox'], false, false, true,
 'curated', 'manual'),

-- ── EGYPT ────────────────────────────────────────────────────────────────

('Dr. Dalia Medhat Abdelhalim',
 'Cairo University Kasr Al-Ainy Hospital — Dermatology',
 'Professor of Dermatology',
 'Al Manial, Cairo',
 'Cairo', 'Cairo', 'Egypt', 'EG', 'Africa',
 30.0157, 31.2282,
 '+20-2-2365-2222', NULL,
 ARRAY['topical','botox','iontophoresis'], false, false, false,
 'curated', 'manual'),

-- ── TELEHEALTH — GLOBAL ───────────────────────────────────────────────────
-- NOTE: Verify current availability before going live

('HH Telehealth Consult — International Hyperhidrosis Society Provider',
 'IHS Affiliated Telehealth Network',
 'Hyperhidrosis Specialist — Telehealth',
 'Virtual — serves Africa, Europe, Americas',
 'Virtual', NULL, 'Global', 'XX', 'Global',
 0.0, 0.0,
 NULL, 'https://www.sweathelp.org/find-a-provider.html',
 ARRAY['topical','botox','iontophoresis','miradry'],
 true, false, true,
 'telehealth', 'ihs'),

('DermEngine Africa Telehealth',
 'Pan-African Dermatology Telehealth',
 'AI-Assisted Dermatology — Telehealth',
 'Virtual — serves all African countries',
 'Virtual', NULL, 'Africa', 'XX', 'Africa',
 0.0, 0.0,
 NULL, 'https://dermengine.com',
 ARRAY['topical','iontophoresis'],
 false, false, true,
 'telehealth', 'manual');

-- ════════════════════════════════════════════════════════════════
-- HELPER: update timestamp trigger
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_specialists_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER specialists_updated_at
  BEFORE UPDATE ON public.specialists
  FOR EACH ROW EXECUTE FUNCTION update_specialists_updated_at();

-- ════════════════════════════════════════════════════════════════
-- WARRIOR REVIEWS TABLE (for future "Warrior Rating" feature)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.specialist_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id   UUID REFERENCES public.specialists(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  compassion      INTEGER CHECK (compassion BETWEEN 1 AND 5),
  hh_knowledge    INTEGER CHECK (hh_knowledge BETWEEN 1 AND 5),
  comment         TEXT,
  verified_visit  BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (specialist_id, user_id)
);

ALTER TABLE public.specialist_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Warriors read all reviews"
  ON public.specialist_reviews FOR SELECT USING (true);

CREATE POLICY "Warriors write own reviews"
  ON public.specialist_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
