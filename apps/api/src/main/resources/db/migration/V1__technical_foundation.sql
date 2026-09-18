CREATE TABLE tripi_schema_history_marker (
  id smallint PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
