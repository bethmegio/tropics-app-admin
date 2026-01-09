-- Supabase SQL functions for stock management
-- Run this in Supabase SQL Editor

-- Function to safely reduce stock quantity
CREATE OR REPLACE FUNCTION reduce_stock(product_id_param INTEGER, quantity_param INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Lock the row to prevent race conditions
    SELECT stock INTO current_stock
    FROM products
    WHERE id = product_id_param
    FOR UPDATE;

    -- Check if product exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', product_id_param;
    END IF;

    -- Check if enough stock
    IF current_stock < quantity_param THEN
        RAISE EXCEPTION 'Insufficient stock for product ID %. Current: %, Requested: %', product_id_param, current_stock, quantity_param;
    END IF;

    -- Reduce stock
    UPDATE products
    SET stock = stock - quantity_param
    WHERE id = product_id_param;

    RETURN TRUE;
END;
$$;

-- Function to safely add stock quantity
CREATE OR REPLACE FUNCTION add_stock(product_id_param INTEGER, quantity_param INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Lock the row to prevent race conditions
    SELECT stock INTO current_stock
    FROM products
    WHERE id = product_id_param
    FOR UPDATE;

    -- Check if product exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', product_id_param;
    END IF;

    -- Check if quantity is positive
    IF quantity_param <= 0 THEN
        RAISE EXCEPTION 'Quantity to add must be positive. Provided: %', quantity_param;
    END IF;

    -- Add stock
    UPDATE products
    SET stock = stock + quantity_param
    WHERE id = product_id_param;

    RETURN TRUE;
END;
$$;