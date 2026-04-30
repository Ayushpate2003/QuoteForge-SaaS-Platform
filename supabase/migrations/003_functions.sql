-- Function to increment and get the next quote number
CREATE OR REPLACE FUNCTION increment_quote_number(f_id UUID)
RETURNS TEXT AS $$
DECLARE
  seq_record RECORD;
  next_num INTEGER;
  formatted_num TEXT;
BEGIN
  -- Get and lock the sequence record
  SELECT * FROM quote_sequences WHERE firm_id = f_id FOR UPDATE INTO seq_record;
  
  IF seq_record IS NULL THEN
    -- Initialize if not exists
    INSERT INTO quote_sequences (firm_id, last_number) VALUES (f_id, 1) RETURNING * INTO seq_record;
    next_num := 1;
  ELSE
    next_num := seq_record.last_number + 1;
    UPDATE quote_sequences SET last_number = next_num WHERE firm_id = f_id;
  END IF;

  -- Format: PREFIX-NUMBER (e.g., QT-1001)
  formatted_num := seq_record.prefix || '-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN formatted_num;
END;
$$ LANGUAGE plpgsql;
