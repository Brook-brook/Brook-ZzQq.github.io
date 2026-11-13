// Local, literal filtering only; no grades, history or persistence.
export function filterPracticeQuestions(questions, query = '', path = 'all') {
  if (!Array.isArray(questions) || questions.length > 1000 || typeof query !== 'string' || query.length > 200 || typeof path !== 'string')
    throw new Error('问题筛选输入无效。');
  const normalize = (text) => text.normalize('NFKC').toLowerCase();
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const ids = new Set();
  return questions.filter((question) => {
    if (!question || typeof question.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(question.id) || ids.has(question.id) ||
      !['path', 'title', 'question', 'note'].every((key) => typeof question[key] === 'string') || question.note.length > 2000)
      throw new Error('问题或本页记录无效。');
    ids.add(question.id);
    const text = normalize(`${question.title}\n${question.question}\n${question.note}`);
    return (path === 'all' || question.path === path) && terms.every((term) => text.includes(term));
  }).map((question) => question.id);
}

export function nextPracticeQuestion(ids, current) {
  if (!Array.isArray(ids) || !ids.length) return null;
  return ids[(ids.indexOf(current) + 1) % ids.length];
}
