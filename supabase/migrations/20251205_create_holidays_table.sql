-- Create holidays table for centralized holiday management
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'public', -- 'public', 'company', 'custom'
  country VARCHAR(10) DEFAULT 'KR',
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM date)::INTEGER) STORED,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Ensure no duplicate holidays for the same date
  UNIQUE(date, type, country)
);

-- Create index for faster queries by year and country
CREATE INDEX idx_holidays_year ON holidays(year);
CREATE INDEX idx_holidays_country ON holidays(country);
CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_holidays_active ON holidays(is_active) WHERE is_active = true;

-- Enable RLS (Row Level Security)
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active holidays
CREATE POLICY "Anyone can view active holidays"
  ON holidays FOR SELECT
  USING (is_active = true);

-- Policy: Only authenticated users with admin/manager role can insert holidays
CREATE POLICY "Admins can insert holidays"
  ON holidays FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Policy: Only authenticated users with admin/manager role can update holidays
CREATE POLICY "Admins can update holidays"
  ON holidays FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Policy: Only admins can delete holidays
CREATE POLICY "Admins can delete holidays"
  ON holidays FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_holidays_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER holidays_updated_at_trigger
  BEFORE UPDATE ON holidays
  FOR EACH ROW
  EXECUTE FUNCTION update_holidays_updated_at();

-- Insert 2025 Korean holidays (from current hardcoded data)
INSERT INTO holidays (date, name, type, country, description) VALUES
  ('2025-01-01', '신정', 'public', 'KR', '새해 첫날'),
  ('2025-01-28', '설날 전날', 'public', 'KR', '설날 연휴'),
  ('2025-01-29', '설날', 'public', 'KR', '음력 1월 1일'),
  ('2025-01-30', '설날 다음날', 'public', 'KR', '설날 연휴'),
  ('2025-03-01', '삼일절', 'public', 'KR', '3·1 독립운동 기념일'),
  ('2025-03-03', '대체공휴일', 'public', 'KR', '삼일절 대체공휴일'),
  ('2025-05-05', '어린이날', 'public', 'KR', '어린이날'),
  ('2025-05-06', '대체공휴일', 'public', 'KR', '어린이날 대체공휴일'),
  ('2025-05-15', '석가탄신일', 'public', 'KR', '부처님 오신 날'),
  ('2025-06-06', '현충일', 'public', 'KR', '순국선열 추모일'),
  ('2025-08-15', '광복절', 'public', 'KR', '광복 기념일'),
  ('2025-10-03', '개천절', 'public', 'KR', '국가 건국 기념일'),
  ('2025-10-05', '추석 전날', 'public', 'KR', '추석 연휴'),
  ('2025-10-06', '추석', 'public', 'KR', '음력 8월 15일'),
  ('2025-10-07', '추석 다음날', 'public', 'KR', '추석 연휴'),
  ('2025-10-08', '대체공휴일', 'public', 'KR', '추석 대체공휴일'),
  ('2025-10-09', '한글날', 'public', 'KR', '한글 창제 기념일'),
  ('2025-12-25', '크리스마스', 'public', 'KR', '기독탄신일')
ON CONFLICT (date, type, country) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE holidays IS 'Centralized holiday management for scheduling and calendar features';
