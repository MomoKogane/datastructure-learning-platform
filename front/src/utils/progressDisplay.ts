const nonPracticeSectionIds = new Set([
  '1.1',
  '1.2',
  '3.1',
  '3.2',
  '7.11'
]);

export const isTrackableSectionId = (sectionId: string): boolean => /^\d+(?:\.\d+)+$/.test(sectionId.trim());

export const isPracticeNotApplicableSection = (sectionId: string): boolean => nonPracticeSectionIds.has(sectionId.trim());

export const renderQuizProgressDisplay = (quizCompleted: boolean, quizScore?: number | null): string => {
  const hasScore = typeof quizScore === 'number' && Number.isFinite(quizScore);
  if (!quizCompleted && !hasScore) {
    return '';
  }

  if (hasScore) {
    return `${quizCompleted ? 'y' : ''}${quizCompleted ? ' ' : ''}(${quizScore}分)`;
  }

  return quizCompleted ? 'y' : '';
};

export const renderCodingProgressDisplay = (
  sectionId: string,
  codingCompleted: boolean,
  codingJudgeStatus?: string | null,
  ojVisited?: boolean
): string => {
  if (isPracticeNotApplicableSection(sectionId)) {
    return '/';
  }

  const rawStatus = String(codingJudgeStatus || '').trim();
  const normalizedStatus = rawStatus.toUpperCase();

  if (normalizedStatus) {
    if (normalizedStatus === 'AC') {
      return 'y AC';
    }

    if (normalizedStatus === 'N') {
      return 'n';
    }

    return `n ${normalizedStatus}`;
  }

  if (ojVisited) {
    return 'n';
  }

  return codingCompleted ? 'y' : '';
};
