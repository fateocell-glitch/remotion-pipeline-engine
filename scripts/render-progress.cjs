"use strict";

function renderProgress(completedBeats, totalBeats) {
  if (!Number.isFinite(totalBeats) || totalBeats <= 0) return 0;
  const completed = Math.max(0, Math.min(totalBeats, Number(completedBeats) || 0));
  return Math.min(100, Math.max(5, Math.round(5 + (completed / totalBeats) * 95)));
}

module.exports = {renderProgress};
