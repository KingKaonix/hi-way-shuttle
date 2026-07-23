-- HiWay Rides Table
CREATE TABLE IF NOT EXISTS rides (
  id           BIGINT PRIMARY KEY GENERATED ALWAYS AS identity,
  rider_id     UUID,
  driver_id    UUID,
  route_id     TEXT,
  start_addr   TEXT NOT NULL,
  start_lat    DOUBLE PRECISION NOT NULL,
  start_lng    DOUBLE PRECISION NOT NULL,
  end_addr     TEXT NOT NULL,
  end_lat      DOUBLE PRECISION NOT NULL,
  end_lng      DOUBLE PRECISION NOT NULL,
  fare_cents   INTEGER NOT NULL,
  status       TEXT DEFAULT 'requested',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at DESC);
