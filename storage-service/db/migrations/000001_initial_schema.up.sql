CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) NOT NULL UNIQUE,
    language VARCHAR(50),
    issues JSONB,
    summary TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_request_id ON analysis_results(request_id);
CREATE INDEX idx_submitted_at ON analysis_results(submitted_at);
