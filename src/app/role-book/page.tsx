'use client';

import Link from 'next/link';
import ChibiCharacter from '@/components/chibi/ChibiCharacter';
import { ROLE_LIST } from '@/lib/roles';

const TEAM_ORDER = ['insider', 'data', 'freelancer'] as const;
const TEAM_LABELS = {
  insider: { name: 'Insider Threat', color: 'var(--accent-red)', desc: 'Tim jahat yang diam-diam menyabotase data perusahaan.' },
  data: { name: 'Data Division', color: 'var(--accent-green)', desc: 'Tim baik yang harus menemukan dan eliminasi semua Insider Threat.' },
  freelancer: { name: 'Freelancer', color: 'var(--accent-gold)', desc: 'Punya win condition sendiri. Tidak loyal ke tim manapun.' },
};

const TIMING_LABELS = {
  night: 'Malam (After Hours)',
  day: 'Siang (Daily Standup)',
  passive: 'Pasif (Otomatis)',
};

export default function RoleBookPage() {
  return (
    <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-black">
          <span className="text-[var(--accent-red)]">Role</span> Book
        </h1>
        <Link href="/" className="btn-secondary text-sm">Kembali</Link>
      </div>

      {TEAM_ORDER.map(team => {
        const info = TEAM_LABELS[team];
        const roles = ROLE_LIST.filter(r => r.team === team && r.id !== 'head_of_data');

        return (
          <section key={team} className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1" style={{ color: info.color }}>
                {info.name}
              </h2>
              <p className="text-[var(--text-secondary)]">{info.desc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map(role => (
                <div key={role.id} className="card flex gap-4">
                  <div className="flex-shrink-0">
                    <ChibiCharacter roleId={role.id} size={100} showName={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg" style={{ color: info.color }}>{role.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mb-2">{role.position}</p>
                    <div className="mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                        background: `${info.color}22`,
                        color: info.color,
                      }}>
                        {role.skillName}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] ml-2">
                        {TIMING_LABELS[role.skillTiming]}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{role.skillDescription}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-2 italic">&quot;{role.lore}&quot;</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Head of Data */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--accent-gold)' }}>
          Game Master
        </h2>
        <div className="card flex gap-4 max-w-lg">
          <ChibiCharacter roleId="head_of_data" size={120} showName={false} />
          <div>
            <h3 className="font-bold text-xl" style={{ color: 'var(--accent-gold)' }}>Head of Data</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-2">God / Game Master</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Bisa lihat semua role, semua aksi malam, dan mengarahkan jalannya game.
              Tidak bisa mati, tidak bisa vote. Tahu segalanya, tapi tidak boleh bilang ke siapapun.
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2 italic">
              &quot;Duduk di kursi paling atas. Tahu segalanya, tapi gak boleh bilang ke siapapun.&quot;
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
