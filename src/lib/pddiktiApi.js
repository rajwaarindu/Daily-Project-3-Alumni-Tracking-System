import axios from 'axios';

const pddikti = axios.create({
  baseURL: '/api-pddikti', // lewat proxy Vite
  maxRedirects: 5,         // ikuti redirect 301 otomatis
});

export const searchMahasiswa = (namaLengkap, universitas, prodi = '') => {
  // Gabung keyword dengan spasi literal — sama persis seperti Python
  const parts = [namaLengkap, universitas, prodi].map(s => s.trim()).filter(Boolean);
  const keyword = parts.join(' ');
  return pddikti.get(`/search/mhs/${keyword}`);
};

export const detailMahasiswa = (idMhs) => {
  // Trailing slash wajib sesuai Django URL pattern
  return pddikti.get(`/mhs/detail/${idMhs}/`);
};