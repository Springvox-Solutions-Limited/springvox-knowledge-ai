export type AnswerConfidence = 'high' | 'medium' | 'low';

export type ConfidenceInput = {
  retrievalScores: number[];
  rerankScores: number[];
  documentCount: number;
  contextChunkCount: number;
  noAnswer: boolean;
};

export function calculateAnswerConfidence({
  retrievalScores,
  rerankScores,
  documentCount,
  contextChunkCount,
  noAnswer,
}: ConfidenceInput): AnswerConfidence {
  if (noAnswer || contextChunkCount === 0) {
    return 'low';
  }

  const topRetrievalScore = Math.max(...retrievalScores, 0);
  const averageRerankScore =
    rerankScores.length > 0
      ? rerankScores.reduce((total, score) => total + score, 0) / rerankScores.length
      : 0;
  let score = 0;

  if (topRetrievalScore >= 0.72) score += 2;
  else if (topRetrievalScore >= 0.55) score += 1;

  if (averageRerankScore >= 0.7) score += 2;
  else if (averageRerankScore >= 0.45) score += 1;

  if (contextChunkCount >= 3) score += 1;
  if (documentCount >= 1) score += 1;

  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

export function sourceConfidenceFromScore(score: number): AnswerConfidence {
  if (score >= 0.72) return 'high';
  if (score >= 0.48) return 'medium';
  return 'low';
}
