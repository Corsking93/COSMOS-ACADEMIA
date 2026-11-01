// Storage may contain records created before all rubric fields existed.
// Missing ratings remain null: they are not a zero score or a mastery signal.
export const RUBRIC_DIMENSION_COUNT = 8;

function text(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function validRating(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 4;
}

export function normalizeRecord(record, index = 0) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const sourceScores = Array.isArray(record.scores) ? record.scores : [];
  const scores = Array.from({ length: RUBRIC_DIMENSION_COUNT }, (_, dimension) =>
    validRating(sourceScores[dimension]) ? sourceScores[dimension] : null);
  const recordedStatus = text(record.recordedStatus, text(record.status, 'Draft'));
  const status = text(record.status, 'Draft');
  const canConfirmMastery = record.reviewed === true && hasCompleteRubric(scores) && scores.every(score => score >= 3);
  return {
    ...record,
    id: text(record.id, `legacy-record-${index + 1}`),
    learner: text(record.learner, 'Learner'),
    objectiveId: text(record.objectiveId, 'Unspecified objective'),
    title: text(record.title, text(record.objectiveId, 'Saved evidence')),
    type: text(record.type, 'Evidence'),
    evidence: text(record.evidence),
    scores,
    assessor: text(record.assessor, 'Pending human review'),
    feedback: text(record.feedback, 'No feedback recorded yet.'),
    date: text(record.date, 'Not recorded'),
    status: status === 'Mastered' && !canConfirmMastery ? 'Review needed' : status,
    recordedStatus,
    reviewed: record.reviewed === true,
    demo: record.demo === true,
    audit: Array.isArray(record.audit)
      ? record.audit.filter(event => typeof event === 'string' && event.trim())
      : []
  };
}

export function normalizeRecords(records) {
  return Array.isArray(records) ? records.map(normalizeRecord).filter(Boolean) : [];
}

export function assessedRatings(scores) {
  return Array.isArray(scores) ? scores.filter(validRating) : [];
}

export function hasCompleteRubric(scores) {
  return Array.isArray(scores) && scores.length === RUBRIC_DIMENSION_COUNT && Array.from(scores).every(validRating);
}
