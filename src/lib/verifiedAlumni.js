const toTimestamp = (value) => {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export const dedupeAlumniById = (rows = []) => {
  const seen = new Set();

  return rows.filter((item) => {
    const key = String(item?.id || '');
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const selectVerifiedAlumni = (rows = []) => {
  return dedupeAlumniById(rows)
    .filter((item) => Boolean(item?.ppdikti_verified))
    .sort((a, b) => {
      const bTime = toTimestamp(b?.ppdikti_checked_at || b?.updated_at || b?.created_at);
      const aTime = toTimestamp(a?.ppdikti_checked_at || a?.updated_at || a?.created_at);
      return bTime - aTime;
    });
};

export const getPpdiktiSummary = (item) => {
  const detail = item?.ppdikti_detail || {};

  return {
    nim: detail.nim || '-',
    prodi: detail.prodi || detail.nama_prodi || '-',
    perguruanTinggi: detail.nama_pt || detail.sinkatan_pt || '-',
    status: detail.status_saat_ini || '-',
  };
};

export const pickRandomItems = (rows = [], count = 3) => {
  if (!Array.isArray(rows) || rows.length === 0 || count <= 0) {
    return [];
  }

  const pool = [...rows];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, Math.min(count, pool.length));
};
