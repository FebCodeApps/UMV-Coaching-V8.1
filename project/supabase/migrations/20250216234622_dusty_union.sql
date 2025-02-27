/*
  # Initial Schema for Anini LMS

  1. New Tables
    - `students`
      - Basic student information
      - Contact details
      - Emergency contact
    - `batches`
      - Batch information
      - Board and class details
    - `subjects`
      - Subject details
    - `batch_subjects`
      - Junction table for batch-subject relationships
    - `fee_cycles`
      - Fee cycle configurations
    - `fee_records`
      - Student fee payment records
    - `attendance_records`
      - Student attendance tracking

  2. Security
    - Enable RLS on all tables
    - Policies for admin access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE board_type AS ENUM ('CBSE', 'ASSEB');
CREATE TYPE class_level AS ENUM ('9', '10', '11', '12');
CREATE TYPE fee_cycle_type AS ENUM ('biweekly', 'triweekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'net_banking');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue');

-- Students table
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Batches table
CREATE TABLE batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  board board_type NOT NULL,
  class_level class_level NOT NULL,
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subjects table
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Junction table for batches and subjects
CREATE TABLE batch_subjects (
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (batch_id, subject_id)
);

-- Fee cycles table
CREATE TABLE fee_cycles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_type fee_cycle_type NOT NULL,
  amount decimal(10,2) NOT NULL,
  early_payment_discount decimal(10,2) DEFAULT 0,
  late_payment_penalty decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fee records table
CREATE TABLE fee_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  fee_cycle_id uuid REFERENCES fee_cycles(id),
  amount_paid decimal(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  due_date date NOT NULL,
  payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Attendance records table
CREATE TABLE attendance_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
  date date NOT NULL,
  status boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin full access on students"
  ON students
  TO authenticated
  USING (auth.email() = 'febcodeapps@gmail.com')
  WITH CHECK (auth.email() = 'febcodeapps@gmail.com');

CREATE POLICY "Admin full access on batches"
  ON batches
  TO authenticated
  USING (auth.email() = 'febcodeapps@gmail.com')
  WITH CHECK (auth.email() = 'febcodeapps@gmail.com');

CREATE POLICY "Admin full access on subjects"
  ON subjects
  TO authenticated
  USING (auth.email() = 'febcodeapps@gmail.com')
  WITH CHECK (auth.email() = 'febcodeapps@gmail.com');

CREATE POLICY "Admin full access on batch_subjects"
  ON batch_subjects
  TO authenticated
  USING (auth.email() = 'febcodeapps@gmail.com')
  WITH CHECK (auth.email() = 'febcodeapps@gmail.com');

CREATE POLICY "Admin full access on fee_cycles"
  ON fee_cycles
  TO authenticated
  USING (auth.email() = 'febcodeapps@gmail.com')
  WITH CHECK (auth.email() = 'febcodeapps@gmail.com');

CREATE POLICY "Admin full access on fee_records"
  ON fee_records
  TO authenticated
  USING (auth.email() = 'febcodeapps@gmail.com')
  WITH CHECK (auth.email() = 'febcodeapps@gmail.com');

CREATE POLICY "Admin full access on attendance_records"
  ON attendance_records
  TO authenticated
  USING (auth.email() = 'febcodeapps@gmail.com')
  WITH CHECK (auth.email() = 'febcodeapps@gmail.com');

-- Create functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON batches
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_fee_cycles_updated_at
  BEFORE UPDATE ON fee_cycles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_fee_records_updated_at
  BEFORE UPDATE ON fee_records
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
