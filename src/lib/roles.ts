export type Team = 'insider' | 'data' | 'freelancer';
export type Phase = 'lobby' | 'intro' | 'night' | 'day' | 'vote' | 'gameover';
export type SkillTiming = 'night' | 'day' | 'passive';

export interface RoleDefinition {
  id: string;
  name: string;
  team: Team;
  position: string;
  skillName: string;
  skillDescription: string;
  skillTiming: SkillTiming;
  lore: string;
  chibiColors: {
    primary: string;
    secondary: string;
    accent: string;
    hair: string;
    accessory: string;
  };
  chibiAccessory: string;
}

export const ROLES: Record<string, RoleDefinition> = {
  shadow_analyst: {
    id: 'shadow_analyst',
    name: 'Shadow Analyst',
    team: 'insider',
    position: 'Fake Analyst',
    skillName: 'Malicious Query',
    skillDescription: 'Tiap malam, pilih 1 player untuk di-corrupt (kill). Data mereka rusak, mereka "dipecat".',
    skillTiming: 'night',
    lore: 'Bersembunyi di balik dashboard palsu, diam-diam menyuntikkan query jahat ke pipeline perusahaan.',
    chibiColors: { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560', hair: '#2d2d2d', accessory: '#e94560' },
    chibiAccessory: 'laptop',
  },
  mole_engineer: {
    id: 'mole_engineer',
    name: 'Mole Engineer',
    team: 'insider',
    position: 'Fake Data Engineer',
    skillName: 'Identity Spoof',
    skillDescription: 'Kalau di-scan oleh Data Steward, muncul sebagai role tim baik (menyamar).',
    skillTiming: 'passive',
    lore: 'Pura-pura build pipeline, padahal diam-diam buka backdoor ke sistem.',
    chibiColors: { primary: '#2d3436', secondary: '#636e72', accent: '#fdcb6e', hair: '#4a4a4a', accessory: '#fdcb6e' },
    chibiAccessory: 'helmet',
  },
  rogue_admin: {
    id: 'rogue_admin',
    name: 'Rogue Admin',
    team: 'insider',
    position: 'Fake DBA',
    skillName: 'Access Revoke',
    skillDescription: 'Tiap malam, pilih 1 player untuk di-block. Skill mereka tidak bisa dipakai malam itu.',
    skillTiming: 'night',
    lore: 'Punya akses root ke semua server, tapi menggunakannya untuk kepentingan sendiri.',
    chibiColors: { primary: '#2c2c54', secondary: '#474787', accent: '#ff3838', hair: '#1e1e1e', accessory: '#ff3838' },
    chibiAccessory: 'key',
  },
  data_analyst: {
    id: 'data_analyst',
    name: 'Data Analyst',
    team: 'data',
    position: 'Data Analyst',
    skillName: 'Dashboard Report',
    skillDescription: 'Tiap malam, pilih 1 player. Besoknya dikasih tau player itu "interact" sama siapa aja malam itu.',
    skillTiming: 'night',
    lore: 'Selalu penasaran sama data, tiap malam bikin report yang gak pernah diminta siapapun.',
    chibiColors: { primary: '#0984e3', secondary: '#74b9ff', accent: '#ffeaa7', hair: '#2d3436', accessory: '#0984e3' },
    chibiAccessory: 'coffee',
  },
  data_steward: {
    id: 'data_steward',
    name: 'Data Steward',
    team: 'data',
    position: 'Data Steward',
    skillName: 'Data Validation',
    skillDescription: 'Tiap malam, scan 1 player untuk lihat role asli mereka (clean atau threat).',
    skillTiming: 'night',
    lore: 'Penjaga kualitas data perusahaan. Kalau ada yang janggal, dia yang pertama tau.',
    chibiColors: { primary: '#00b894', secondary: '#55efc4', accent: '#ffeaa7', hair: '#2d3436', accessory: '#00b894' },
    chibiAccessory: 'magnifier',
  },
  data_engineer: {
    id: 'data_engineer',
    name: 'Data Engineer',
    team: 'data',
    position: 'Data Engineer',
    skillName: 'Pipeline Backup',
    skillDescription: 'Tiap malam, pilih 1 player untuk di-protect (containerize). Player itu immune dari kill malam ini.',
    skillTiming: 'night',
    lore: 'Tukang bangun pipeline. Kalau ada yang rusak, dia yang pertama bangun backup.',
    chibiColors: { primary: '#6c5ce7', secondary: '#a29bfe', accent: '#fd79a8', hair: '#2d3436', accessory: '#6c5ce7' },
    chibiAccessory: 'wrench',
  },
  data_architect: {
    id: 'data_architect',
    name: 'Data Architect',
    team: 'data',
    position: 'Data Architect',
    skillName: 'System Redesign',
    skillDescription: 'Kalau mati, bisa takedown 1 player ikut mati (redesign fatal).',
    skillTiming: 'passive',
    lore: 'Otak di balik arsitektur data perusahaan. Kalau dia jatuh, dia gak jatuh sendirian.',
    chibiColors: { primary: '#e17055', secondary: '#fab1a0', accent: '#ffeaa7', hair: '#2d3436', accessory: '#e17055' },
    chibiAccessory: 'blueprint',
  },
  data_scientist: {
    id: 'data_scientist',
    name: 'Data Scientist',
    team: 'data',
    position: 'Data Scientist',
    skillName: 'Predictive Model',
    skillDescription: 'Tiap malam, pilih 2 player. Dikasih tau salah satunya evil atau bukan.',
    skillTiming: 'night',
    lore: 'Jago bikin model prediksi. Akurasinya? Katanya 95%, tapi gak pernah ada yang validasi.',
    chibiColors: { primary: '#00cec9', secondary: '#81ecec', accent: '#ffeaa7', hair: '#636e72', accessory: '#00cec9' },
    chibiAccessory: 'flask',
  },
  dba: {
    id: 'dba',
    name: 'Database Administrator',
    team: 'data',
    position: 'DBA',
    skillName: 'Auto Recovery',
    skillDescription: 'Sekali seumur game, kalau "dipecat", otomatis restore diri sendiri (hidup lagi 1x).',
    skillTiming: 'passive',
    lore: 'Selalu punya backup plan. Bahkan untuk dirinya sendiri.',
    chibiColors: { primary: '#fdcb6e', secondary: '#ffeaa7', accent: '#e17055', hair: '#2d3436', accessory: '#fdcb6e' },
    chibiAccessory: 'shield',
  },
  data_quality_engineer: {
    id: 'data_quality_engineer',
    name: 'Data Quality Engineer',
    team: 'data',
    position: 'Quality Engineer',
    skillName: 'Audit Trail',
    skillDescription: 'Tiap malam, bisa lihat siapa yang "akses data" (visit) siapa tadi malam.',
    skillTiming: 'night',
    lore: 'Obsesi sama data lineage. Setiap record harus bisa di-trace balik ke sumbernya.',
    chibiColors: { primary: '#e84393', secondary: '#fd79a8', accent: '#ffeaa7', hair: '#2d3436', accessory: '#e84393' },
    chibiAccessory: 'checklist',
  },
  analytics_engineer: {
    id: 'analytics_engineer',
    name: 'Analytics Engineer',
    team: 'data',
    position: 'Analytics Engineer',
    skillName: 'Boost Query',
    skillDescription: 'Saat Daily Standup, bisa boost vote 1 orang jadi 2x (vote mereka dihitung double).',
    skillTiming: 'day',
    lore: 'Jago transformasi data mentah jadi insight. Vote dia selalu punya impact lebih.',
    chibiColors: { primary: '#636e72', secondary: '#b2bec3', accent: '#00cec9', hair: '#2d3436', accessory: '#00cec9' },
    chibiAccessory: 'chart',
  },
  data_annotator: {
    id: 'data_annotator',
    name: 'Data Annotator',
    team: 'data',
    position: 'Data Annotator',
    skillName: 'Label Data',
    skillDescription: 'Tiap malam, label 1 player (suspect/clean). Label ini keliatan ke semua orang besok pagi, tapi belum tentu benar.',
    skillTiming: 'night',
    lore: 'Kerjanya labelin data seharian. Kadang bener, kadang... ya namanya juga manusia.',
    chibiColors: { primary: '#fd79a8', secondary: '#fab1a0', accent: '#ffeaa7', hair: '#e17055', accessory: '#fd79a8' },
    chibiAccessory: 'highlighter',
  },
  ml_engineer: {
    id: 'ml_engineer',
    name: 'ML Engineer',
    team: 'data',
    position: 'ML Engineer',
    skillName: 'Anomaly Detection',
    skillDescription: 'Tiap malam, auto-scan 2 player yang duduk bersebelahan. Dikasih tau ada threat di antara mereka atau tidak.',
    skillTiming: 'night',
    lore: 'Deploy model anomaly detection ke mana-mana. Termasuk ke rekan kerjanya sendiri.',
    chibiColors: { primary: '#a29bfe', secondary: '#dfe6e9', accent: '#fd79a8', hair: '#2d3436', accessory: '#a29bfe' },
    chibiAccessory: 'robot',
  },
  bi_analyst: {
    id: 'bi_analyst',
    name: 'BI Analyst',
    team: 'data',
    position: 'BI Analyst',
    skillName: 'Legacy Report',
    skillDescription: 'Tiap malam, bisa terima "report" dari player yang sudah mati (komunikasi dengan yang tereliminasi).',
    skillTiming: 'night',
    lore: 'Masih maintain dashboard dari 5 tahun lalu. Koneksinya ke data lama gak ada yang bisa nandingin.',
    chibiColors: { primary: '#fab1a0', secondary: '#ffeaa7', accent: '#0984e3', hair: '#2d3436', accessory: '#0984e3' },
    chibiAccessory: 'projector',
  },
  data_product_manager: {
    id: 'data_product_manager',
    name: 'Data Product Manager',
    team: 'data',
    position: 'Data PM',
    skillName: 'Emergency Sprint',
    skillDescription: 'Sekali seumur game, bisa protect dirinya sendiri + 1 orang lain sekaligus dalam 1 malam.',
    skillTiming: 'night',
    lore: 'Kalau ada krisis, dia yang teriak "EMERGENCY SPRINT!" dan semua orang nurut.',
    chibiColors: { primary: '#ff7675', secondary: '#fab1a0', accent: '#ffeaa7', hair: '#2d3436', accessory: '#ff7675' },
    chibiAccessory: 'megaphone',
  },
  data_consultant: {
    id: 'data_consultant',
    name: 'Data Consultant',
    team: 'freelancer',
    position: 'Consultant',
    skillName: 'Exit Strategy',
    skillDescription: 'Menang sendiri kalau survive sampai final 3. Gak loyal ke tim manapun.',
    skillTiming: 'passive',
    lore: 'Datang dari luar, dibayar per jam. Loyalitasnya? Ke dompet sendiri.',
    chibiColors: { primary: '#2d3436', secondary: '#636e72', accent: '#ffd700', hair: '#1e1e1e', accessory: '#ffd700' },
    chibiAccessory: 'briefcase',
  },
  data_intern: {
    id: 'data_intern',
    name: 'Data Intern',
    team: 'freelancer',
    position: 'Intern',
    skillName: 'Magang Privilege',
    skillDescription: 'Sekali seumur game, bisa cancel voting eliminasi terhadap dirinya. "Maaf pak, saya masih belajar."',
    skillTiming: 'day',
    lore: 'Baru masuk minggu lalu. Gak ngerti apa-apa, tapi somehow selalu selamat.',
    chibiColors: { primary: '#dfe6e9', secondary: '#b2bec3', accent: '#0984e3', hair: '#2d3436', accessory: '#74b9ff' },
    chibiAccessory: 'backpack',
  },
  head_of_data: {
    id: 'head_of_data',
    name: 'Head of Data',
    team: 'data',
    position: 'God / Game Master',
    skillName: 'Omniscient View',
    skillDescription: 'Bisa lihat semua role, semua aksi malam, dan mengarahkan jalannya game.',
    skillTiming: 'passive',
    lore: 'Duduk di kursi paling atas. Tahu segalanya, tapi gak boleh bilang ke siapapun.',
    chibiColors: { primary: '#ffd700', secondary: '#fff3b0', accent: '#e17055', hair: '#2d3436', accessory: '#ffd700' },
    chibiAccessory: 'crown',
  },
};

export const ROLE_LIST = Object.values(ROLES);

export interface ScalingTier {
  minPlayers: number;
  maxPlayers: number;
  insiders: string[];
  dataTeam: string[];
  freelancers: string[];
}

export const SCALING_TIERS: ScalingTier[] = [
  {
    minPlayers: 4, maxPlayers: 5,
    insiders: ['shadow_analyst'],
    dataTeam: ['data_steward', 'data_engineer', 'data_analyst'],
    freelancers: [],
  },
  {
    minPlayers: 6, maxPlayers: 7,
    insiders: ['shadow_analyst', 'mole_engineer'],
    dataTeam: ['data_steward', 'data_engineer', 'data_analyst', 'data_analyst'],
    freelancers: [],
  },
  {
    minPlayers: 8, maxPlayers: 9,
    insiders: ['shadow_analyst', 'mole_engineer'],
    dataTeam: ['data_steward', 'data_engineer', 'data_architect', 'data_scientist', 'data_analyst', 'data_analyst'],
    freelancers: [],
  },
  {
    minPlayers: 10, maxPlayers: 12,
    insiders: ['shadow_analyst', 'mole_engineer', 'rogue_admin'],
    dataTeam: ['data_steward', 'data_engineer', 'data_architect', 'data_scientist', 'dba', 'data_analyst', 'data_analyst'],
    freelancers: [],
  },
  {
    minPlayers: 13, maxPlayers: 15,
    insiders: ['shadow_analyst', 'mole_engineer', 'rogue_admin'],
    dataTeam: ['data_steward', 'data_engineer', 'data_architect', 'data_scientist', 'dba', 'data_quality_engineer', 'analytics_engineer', 'data_annotator', 'data_analyst', 'data_analyst'],
    freelancers: ['data_consultant'],
  },
  {
    minPlayers: 16, maxPlayers: 18,
    insiders: ['shadow_analyst', 'mole_engineer', 'mole_engineer', 'rogue_admin'],
    dataTeam: ['data_steward', 'data_engineer', 'data_architect', 'data_scientist', 'dba', 'data_quality_engineer', 'analytics_engineer', 'data_annotator', 'ml_engineer', 'bi_analyst', 'data_analyst', 'data_analyst'],
    freelancers: ['data_consultant'],
  },
  {
    minPlayers: 19, maxPlayers: 20,
    insiders: ['shadow_analyst', 'shadow_analyst', 'mole_engineer', 'mole_engineer', 'rogue_admin'],
    dataTeam: ['data_steward', 'data_engineer', 'data_architect', 'data_scientist', 'dba', 'data_quality_engineer', 'analytics_engineer', 'data_annotator', 'ml_engineer', 'bi_analyst', 'data_product_manager', 'data_analyst', 'data_analyst', 'data_analyst'],
    freelancers: ['data_consultant', 'data_intern'],
  },
];

export function getTierForPlayerCount(count: number): ScalingTier | null {
  return SCALING_TIERS.find(t => count >= t.minPlayers && count <= t.maxPlayers) || null;
}

export function assignRoles(playerCount: number): string[] | null {
  const tier = getTierForPlayerCount(playerCount);
  if (!tier) return null;

  const allRoles = [...tier.insiders, ...tier.dataTeam, ...tier.freelancers];

  while (allRoles.length < playerCount) {
    allRoles.push('data_analyst');
  }

  for (let i = allRoles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allRoles[i], allRoles[j]] = [allRoles[j], allRoles[i]];
  }

  return allRoles.slice(0, playerCount);
}
