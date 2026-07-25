/**
 * Calculates semantic similarity between user answer and expected answer
 * Uses Jaccard similarity with code keyword bonuses
 */
export const calculateSemanticSimilarity = (userAnswer: string, expectedAnswer: string): number => {
  if (!userAnswer || userAnswer.trim().length < 20) return 0;
  
  const userWords = userAnswer.toLowerCase().split(/\W+/).filter(word => word.length > 2);
  const expectedWords = expectedAnswer.toLowerCase().split(/\W+/).filter(word => word.length > 2);
  
  if (userWords.length === 0 || expectedWords.length === 0) return 0;
  
  // Calculate word overlap (Jaccard similarity)
  const userSet = new Set(userWords);
  const expectedSet = new Set(expectedWords);
  const intersection = new Set([...userSet].filter(word => expectedSet.has(word)));
  const union = new Set([...userSet, ...expectedSet]);
  
  const jaccardSimilarity = intersection.size / union.size;
  
  // Bonus for code structure keywords
  const codeKeywords = ['function', 'def', 'class', 'return', 'if', 'else', 'for', 'while', 'array', 'list', 'node', 'head', 'tail', 'recursive', 'iterative', 'loop', 'pointer'];
  const keywordMatches = userWords.filter(word => codeKeywords.includes(word)).length;
  const keywordBonus = Math.min(0.3, keywordMatches * 0.05);
  
  return Math.min(1, jaccardSimilarity + keywordBonus);
};

/**
 * Calculates cosine similarity between two text vectors
 * More sophisticated than Jaccard for longer texts
 */
export const calculateCosineSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.toLowerCase().split(/\W+/).filter(word => word.length > 2);
  const words2 = text2.toLowerCase().split(/\W+/).filter(word => word.length > 2);
  
  // Create vocabulary
  const vocabulary = new Set([...words1, ...words2]);
  
  // Create frequency vectors
  const vector1: number[] = [];
  const vector2: number[] = [];
  
  vocabulary.forEach(word => {
    vector1.push(words1.filter(w => w === word).length);
    vector2.push(words2.filter(w => w === word).length);
  });
  
  // Calculate dot product
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
};