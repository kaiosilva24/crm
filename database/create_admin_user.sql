-- Create default admin user
-- Password is '123456'
-- Hashed using bcrypt: $2a$10$QdF93S92yzcL2xolIOEIDegydicbuwX7KW7CkjbHZl63Jg3kBZ20C

INSERT INTO users (name, email, password, role, is_active)
VALUES (
    'Admin', 
    'admin@admin.com', 
    '$2a$10$QdF93S92yzcL2xolIOEIDegydicbuwX7KW7CkjbHZl63Jg3kBZ20C', 
    'admin', 
    true
) ON CONFLICT (email) DO NOTHING;

-- Also create default status 'Onboarding' just in case triggers need it
INSERT INTO lead_statuses (name, color, display_order, is_conversion) 
VALUES ('Onboarding', '#3B82F6', 1, false) 
ON CONFLICT (name) DO NOTHING;
