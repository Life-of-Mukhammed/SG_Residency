export function splitContentBlocks(content: string) {
  return content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function extractKeyValueRows(content: string) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes(':'))
    .map((line) => {
      const [key, ...rest] = line.split(':');
      return { key: key.trim(), value: rest.join(':').trim() };
    })
    .filter((row) => row.key && row.value);
}

export function extractPipeTable(content: string) {
  const rows = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('|'))
    .map((line) => line.split('|').map((cell) => cell.trim()).filter(Boolean))
    .filter((row) => row.length > 1);

  if (rows.length < 2) return null;

  return {
    headers: rows[0],
    rows: rows.slice(1),
  };
}
