import { Request, Response } from 'express';
import { query } from '../utils/db';

const CRITERIA_LABEL_FALLBACKS: Record<string, string> = {
  workQuality: 'Qualité du travail',
  communication: 'Communication',
  teamwork: "Esprit d'équipe",
  atmosphere: 'Ambiance',
  cooperation: 'Coopération',
  deadlines: 'Respect des délais'
};

export async function getUserFeedbackSynthesis(_req: Request, res: Response) {
  const sessionUser = res.locals.user;
  if (!sessionUser) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const result = await query(
    `SELECT rating, criteria FROM feedbacks
     WHERE recipient_id = $1 AND feedback_type = 'colleague' AND is_moderated = FALSE`,
    [sessionUser.userId]
  );

  const rows = result.rows as Array<{ rating: number | null; criteria: Record<string, { score: number; tags?: string[] }> | null }>;

  const totalCount = rows.length;
  const ratings = rows.map((r) => r.rating).filter((r): r is number => typeof r === 'number' && r > 0);
  const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const positiveCount = ratings.filter((r) => r >= 7).length;
  const neutralCount = ratings.filter((r) => r >= 5 && r <= 6).length;
  const negativeCount = ratings.filter((r) => r > 0 && r <= 4).length;

  const criteriaSums: Record<string, { sum: number; count: number }> = {};
  const tagCounts: { positive: Record<string, number>; negative: Record<string, number> } = { positive: {}, negative: {} };

  for (const row of rows) {
    if (!row.criteria) continue;
    for (const [key, value] of Object.entries(row.criteria)) {
      if (!value || typeof value.score !== 'number') continue;
      if (!criteriaSums[key]) criteriaSums[key] = { sum: 0, count: 0 };
      criteriaSums[key].sum += value.score;
      criteriaSums[key].count += 1;

      const bucket = value.score >= 4 ? 'positive' : value.score <= 2 ? 'negative' : null;
      if (bucket && Array.isArray(value.tags)) {
        for (const tag of value.tags) {
          tagCounts[bucket][tag] = (tagCounts[bucket][tag] || 0) + 1;
        }
      }
    }
  }

  let labels: Record<string, string> = {};
  if (Object.keys(criteriaSums).length > 0) {
    const labelsResult = await query(
      `SELECT question_key, label FROM form_questions WHERE form_type = 'colleague'`
    );
    labels = Object.fromEntries(labelsResult.rows.map((r: { question_key: string; label: string }) => [r.question_key, r.label]));
  }

  const criteria = Object.entries(criteriaSums)
    .map(([key, { sum, count }]) => ({
      key,
      label: labels[key] || CRITERIA_LABEL_FALLBACKS[key] || key,
      average: count > 0 ? sum / count : 0,
      count
    }))
    .sort((a, b) => b.count - a.count);

  const topTags = (bucket: Record<string, number>) =>
    Object.entries(bucket)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

  return res.json({
    totalCount,
    averageRating,
    positiveCount,
    neutralCount,
    negativeCount,
    criteria,
    topTags: {
      positive: topTags(tagCounts.positive),
      negative: topTags(tagCounts.negative)
    }
  });
}

export async function getMe(_req: Request, res: Response) {
  const sessionUser = res.locals.user;
  if (!sessionUser) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const result = await query('SELECT id, name, email, position FROM employees WHERE id = $1', [sessionUser.userId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  return res.json(result.rows[0]);
}
