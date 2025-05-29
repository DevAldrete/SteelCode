-- name: CreateAnalysisResult :one
INSERT INTO analysis_results (
    request_id, language, issues, summary, submitted_at
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetAnalysisResultByRequestID :one
SELECT * FROM analysis_results
WHERE request_id = $1 LIMIT 1;

-- name: ListAnalysisResults :many
SELECT * FROM analysis_results
ORDER BY submitted_at DESC
LIMIT $1 OFFSET $2;
