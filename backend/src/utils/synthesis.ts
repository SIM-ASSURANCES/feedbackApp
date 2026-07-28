import { query } from './db';

export interface CriterionSynthesis {
  key: string;
  label: string;
  shortLabel: string;
  average: number;
  count: number;
}

export interface ColleagueSynthesis {
  totalCount: number;
  averageRating: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  criteria: CriterionSynthesis[];
  topTags: { positive: string[]; negative: string[] };
  synthesisText: string;
}

const CRITERIA_LABEL_FALLBACKS: Record<string, string> = {
  workQuality: 'Qualité du travail',
  communication: 'Communication',
  teamwork: "Esprit d'équipe",
  atmosphere: 'Ambiance',
  cooperation: 'Coopération',
  deadlines: 'Respect des délais'
};

function humanizeKey(key: string): string {
  const spaced = key.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const QUALIFIER_WORDS: Record<string, { pos: string; neg: string }> = {
  workQuality: { pos: 'Travail de qualité', neg: 'Qualité de travail à améliorer' },
  communication: { pos: 'Bonne communication', neg: 'Communication à améliorer' },
  teamwork: { pos: "Bon esprit d'équipe", neg: "Esprit d'équipe à renforcer" },
  atmosphere: { pos: 'Bonne ambiance', neg: 'Ambiance à améliorer' },
  cooperation: { pos: 'Coopératif', neg: 'Manque de coopération' },
  deadlines: { pos: 'Respecte les délais', neg: 'Délais à respecter' }
};

const CRITERIA_PHRASES: Record<string, { pos: string; neu: string; neg: string }> = {
  workQuality: {
    pos: "La qualité du travail fourni en collaboration avec ce collaborateur est jugée excellente.",
    neu: "La qualité du travail en collaboration avec ce collaborateur est jugée satisfaisante.",
    neg: "La qualité du travail en collaboration avec ce collaborateur rencontre des difficultés."
  },
  communication: {
    pos: "Sa communication est perçue comme claire, transparente et réactive.",
    neu: "Sa communication est jugée correcte dans l'ensemble.",
    neg: "Sa communication manque de clarté ou de réactivité selon plusieurs retours."
  },
  teamwork: {
    pos: "Son esprit d'équipe est remarqué positivement.",
    neu: "Sa participation au travail d'équipe est jugée adéquate.",
    neg: "Son implication dans la dynamique d'équipe gagnerait à être renforcée."
  },
  atmosphere: {
    pos: "Sa contribution à une ambiance de travail positive est soulignée.",
    neu: "Son impact sur l'ambiance de l'équipe est jugé neutre.",
    neg: "Des tensions liées à son attitude sont relevées par plusieurs retours."
  },
  cooperation: {
    pos: "Sa disponibilité et son esprit de coopération sont salués.",
    neu: "Sa disponibilité est jugée correcte selon les besoins.",
    neg: "Une plus grande disponibilité et volonté d'entraide seraient appréciées."
  },
  deadlines: {
    pos: "Le respect de ses engagements et délais est jugé exemplaire.",
    neu: "Ses échéances sont généralement tenues.",
    neg: "Le respect des délais d'engagement est identifié comme un axe d'amélioration."
  }
};

function buildSynthesisText(totalCount: number, averageRating: number, criteria: CriterionSynthesis[]): string {
  if (totalCount === 0) {
    return "Aucun avis reçu pour le moment.";
  }

  const opening = `Sur la base de ${totalCount} avis reçu${totalCount > 1 ? 's' : ''}, voici la synthèse :`;

  const criteriaSentences = criteria
    .map((c) => {
      const phrases = CRITERIA_PHRASES[c.key];
      const bucket = c.average >= 4 ? 'pos' : c.average >= 3 ? 'neu' : 'neg';
      if (phrases) {
        return phrases[bucket];
      }
      return `Concernant « ${c.label.replace(/^[^\wÀ-ÿ]+/, '').trim()} », la moyenne obtenue est de ${c.average.toFixed(1)}/5.`;
    })
    .join(' ');

  let globalPhrase: string;
  if (averageRating >= 9) {
    globalPhrase = "L'appréciation globale est extrêmement positive.";
  } else if (averageRating >= 7) {
    globalPhrase = "L'appréciation globale est très satisfaisante.";
  } else if (averageRating >= 5) {
    globalPhrase = "L'appréciation globale est moyenne.";
  } else if (averageRating > 0) {
    globalPhrase = "L'appréciation globale reflète d'importantes marges de progression.";
  } else {
    globalPhrase = '';
  }

  return `${opening} ${criteriaSentences} ${globalPhrase}`.trim().replace(/\s+/g, ' ');
}

export async function computeColleagueSynthesis(recipientId: string): Promise<ColleagueSynthesis> {
  const result = await query(
    `SELECT rating, criteria FROM feedbacks
     WHERE recipient_id = $1 AND feedback_type = 'colleague' AND is_moderated = FALSE`,
    [recipientId]
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
  const criteriaTagPresence: Record<string, { positive: boolean; negative: boolean }> = {};

  for (const row of rows) {
    if (!row.criteria) continue;
    for (const [key, value] of Object.entries(row.criteria)) {
      if (!value || typeof value.score !== 'number') continue;
      if (!criteriaSums[key]) criteriaSums[key] = { sum: 0, count: 0 };
      criteriaSums[key].sum += value.score;
      criteriaSums[key].count += 1;
      if (!criteriaTagPresence[key]) criteriaTagPresence[key] = { positive: false, negative: false };

      const bucket = value.score >= 4 ? 'positive' : value.score <= 2 ? 'negative' : null;
      if (bucket && Array.isArray(value.tags) && value.tags.length > 0) {
        criteriaTagPresence[key][bucket] = true;
        for (const tag of value.tags) {
          tagCounts[bucket][tag] = (tagCounts[bucket][tag] || 0) + 1;
        }
      }
    }
  }

  let labels: Record<string, string> = {};
  if (Object.keys(criteriaSums).length > 0) {
    const labelsResult = await query(`SELECT question_key, label FROM form_questions WHERE form_type = 'colleague'`);
    labels = Object.fromEntries(labelsResult.rows.map((r: { question_key: string; label: string }) => [r.question_key, r.label]));
  }

  const criteria = Object.entries(criteriaSums)
    .map(([key, { sum, count }]) => {
      const label = labels[key] || CRITERIA_LABEL_FALLBACKS[key] || key;
      return {
        key,
        label,
        shortLabel: CRITERIA_LABEL_FALLBACKS[key] || humanizeKey(key),
        average: count > 0 ? sum / count : 0,
        count
      };
    })
    .sort((a, b) => b.count - a.count);

  const topTags = (bucket: Record<string, number>) =>
    Object.entries(bucket).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);

  // Si un critère est clairement positif/négatif (moyenne > 3 ou < 3) mais qu'aucun tag
  // n'a été choisi pour lui, on ajoute un qualificatif de secours pour ne pas le passer sous silence.
  function fallbackQualifiers(direction: 'positive' | 'negative'): string[] {
    return criteria
      .filter((c) => (direction === 'positive' ? c.average > 3 : c.average < 3))
      .filter((c) => !criteriaTagPresence[c.key]?.[direction])
      .map((c) => QUALIFIER_WORDS[c.key]?.[direction === 'positive' ? 'pos' : 'neg'] || c.shortLabel);
  }

  const positiveTags = Array.from(new Set([...topTags(tagCounts.positive), ...fallbackQualifiers('positive')])).slice(0, 6);
  const negativeTags = Array.from(new Set([...topTags(tagCounts.negative), ...fallbackQualifiers('negative')])).slice(0, 6);

  return {
    totalCount,
    averageRating,
    positiveCount,
    neutralCount,
    negativeCount,
    criteria,
    topTags: {
      positive: positiveTags,
      negative: negativeTags
    },
    synthesisText: buildSynthesisText(totalCount, averageRating, criteria)
  };
}
