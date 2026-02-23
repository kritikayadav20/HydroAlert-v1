-- Phase 1 Schema: Drought Warning & Smart Tanker Management System

-- Drop existing tables if they exist
DROP TABLE IF EXISTS dispatch_logs;
DROP TABLE IF EXISTS tankers;
DROP TABLE IF EXISTS environmental_data;
DROP TABLE IF EXISTS villages;

-- 1. Villages Table
CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL DEFAULT 'Nagpur',
    population INTEGER NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    base_water_capacity_liters INTEGER,
    current_water_level_pct DECIMAL(5, 2) DEFAULT 100.0,
    water_stress_index DECIMAL(5, 2) DEFAULT 0.0, -- Computed value (0-100)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Environmental Data (Time-series for prediction)
CREATE TABLE environmental_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id UUID REFERENCES villages(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    rainfall_mm DECIMAL(8, 2) DEFAULT 0.0,
    groundwater_level_m DECIMAL(8, 2), -- depth to groundwater
    temperature_c DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(village_id, record_date)
);

-- 3. Tankers Table (Fleet Management)
CREATE TABLE tankers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_no VARCHAR(50) UNIQUE NOT NULL,
    capacity_liters INTEGER NOT NULL,
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Available' CHECK (status IN ('Available', 'En_Route', 'Maintenance')),
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    last_ping_at TIMESTAMP WITH TIME ZONE
);

-- 4. Dispatch Logs Table
CREATE TABLE dispatch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanker_id UUID REFERENCES tankers(id) ON DELETE RESTRICT,
    village_id UUID REFERENCES villages(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'En_Route', 'Delivered', 'Cancelled')),
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    route_geometry JSONB, -- Store mapbox route line if needed
    notes TEXT
);

-- Disable Row Level Security (RLS) safely for rapid hackathon testing 
ALTER TABLE villages DISABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE tankers DISABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_logs DISABLE ROW LEVEL SECURITY;

-- Insert Mock Data for Testing
INSERT INTO villages (name, district, population, lat, lng, base_water_capacity_liters, water_stress_index)
VALUES 
    ('Katol', 'Nagpur', 45000, 21.2670, 78.5861, 500000, 85.5),
    ('Narkhed', 'Nagpur', 35000, 21.3912, 78.5283, 400000, 92.0),
    ('Saoner', 'Nagpur', 60000, 21.3888, 78.9137, 750000, 45.0),
    ('Ramtek', 'Nagpur', 55000, 21.3986, 79.3243, 600000, 30.5),
    ('Parseoni', 'Nagpur', 25000, 21.3789, 79.1601, 300000, 78.2),
    ('Kamptee', 'Nagpur', 80000, 21.2267, 79.1966, 1000000, 20.0),
    ('Hingna', 'Nagpur', 75000, 21.0927, 78.9696, 900000, 65.4),
    ('Umred', 'Nagpur', 50000, 20.8526, 79.3288, 600000, 15.0),
    ('Bhiwapur', 'Nagpur', 30000, 20.7675, 79.5244, 350000, 40.0),
    ('Kuhi', 'Nagpur', 32000, 20.9839, 79.3512, 400000, 88.5);

INSERT INTO tankers (registration_no, capacity_liters, driver_name, driver_phone, status, current_lat, current_lng)
VALUES
    ('MH-31-CB-1001', 10000, 'Ramesh Patil', '+919876543210', 'Available', 21.1458, 79.0882),
    ('MH-31-CB-1002', 15000, 'Suresh Kumar', '+919876543211', 'Available', 21.1458, 79.0882),
    ('MH-31-CB-1003', 10000, 'Vijay Singh', '+919876543212', 'En_Route', 21.2670, 78.5861),
    ('MH-31-CB-1004', 20000, 'Amit Sharma', '+919876543213', 'Maintenance', 21.1458, 79.0882),
    ('MH-31-CB-1005', 15000, 'Rajesh Y', '+919876543214', 'Available', 21.1458, 79.0882);
