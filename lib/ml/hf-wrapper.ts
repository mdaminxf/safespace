// lib/ml/hf-wrapper.ts
export async function runHFModel(bio: string) {
  const HF_URL =
    'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
  const HF_TOKEN = process.env.HF_TOKEN;

  if (!HF_TOKEN) {
    return {
      error: 'HF_TOKEN missing',
      labels: [],
      scores: [],
      topLabel: null,
    };
  }

  const res = await fetch(HF_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: bio,
      parameters: {
        candidate_labels: ['legitimate', 'fraudulent', 'misleading'],
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    return { error: 'HF request failed', details: txt };
  }

  const data = await res.json();

  return {
    labels: data.labels || [],
    scores: data.scores || [],
    topLabel: data.labels?.[0] || null,
    topScore: data.scores?.[0] || null,
    scoreByLabel: data.labels?.reduce((acc: any, lbl: string, idx: number) => {
      acc[lbl] = data.scores[idx];
      return acc;
    }, {}),
  };
}
