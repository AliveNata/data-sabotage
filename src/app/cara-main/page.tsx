'use client';

import Link from 'next/link';
import ChibiCharacter from '@/components/chibi/ChibiCharacter';

const STEPS = [
  {
    icon: '1',
    title: 'Buat atau Gabung Room',
    desc: 'Satu orang jadi Head of Data (Game Master) dan buat room. Pemain lain masukkan kode room untuk bergabung. Minimal 4 pemain, maksimal 20 pemain.',
  },
  {
    icon: '2',
    title: 'Pembagian Role',
    desc: 'Head of Data memulai game. Setiap pemain mendapat role secara acak. Makin banyak pemain, makin banyak role yang aktif. Hanya kamu dan Head of Data yang tahu role kamu.',
  },
  {
    icon: '3',
    title: 'Cerita Pembukaan',
    desc: 'Head of Data membacakan storyline pembukaan tentang DataNova Corp yang sedang dalam bahaya. Insider Threat telah menyusup ke tim!',
  },
  {
    icon: '4',
    title: 'After Hours (Malam)',
    desc: 'Head of Data mengarahkan setiap role untuk melakukan aksi malam secara private. Insider Threat memilih korban, Data Steward menginvestigasi, Data Engineer memproteksi, dan lainnya.',
  },
  {
    icon: '5',
    title: 'Daily Standup (Siang)',
    desc: 'Semua pemain berdiskusi! Mic dan kamera aktif. Bahas siapa yang mencurigakan, siapa yang mau di-vote. Ini saatnya berdebat, berargumen, atau... berbohong.',
  },
  {
    icon: '6',
    title: 'Voting Eliminasi',
    desc: 'Setelah diskusi, semua pemain vote siapa yang mau dieliminasi. Yang paling banyak vote akan "dipecat" dari perusahaan. Role mereka akan terungkap.',
  },
  {
    icon: '7',
    title: 'Ulangi sampai Menang',
    desc: 'Game berlanjut malam-siang-malam sampai salah satu kondisi menang tercapai.',
  },
];

const WIN_CONDITIONS = [
  {
    team: 'Data Division',
    color: 'var(--accent-green)',
    condition: 'Semua Insider Threat berhasil dieliminasi.',
  },
  {
    team: 'Insider Threat',
    color: 'var(--accent-red)',
    condition: 'Jumlah Insider Threat sama atau lebih dari jumlah Data Division yang hidup.',
  },
  {
    team: 'Freelancer (Data Consultant)',
    color: 'var(--accent-gold)',
    condition: 'Survive sampai tersisa 3 pemain.',
  },
];

export default function CaraMainPage() {
  return (
    <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-black">
          <span className="text-[var(--accent-red)]">Cara</span> Main
        </h1>
        <Link href="/" className="btn-secondary text-sm">Kembali</Link>
      </div>

      {/* Intro */}
      <div className="card mb-8">
        <div className="flex items-center gap-4 mb-4">
          <ChibiCharacter roleId="head_of_data" size={80} showName={false} />
          <div>
            <h2 className="text-xl font-bold">Apa itu Data Sabotage?</h2>
            <p className="text-[var(--text-secondary)]">
              Game social deduction bertema dunia data, dengan role-role
              yang terinspirasi dari posisi di tim data. Ada yang jadi Data Engineer, Data Analyst,
              bahkan ada yang jadi... saboteur.
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <h2 className="text-2xl font-bold mb-6">Langkah-langkah Bermain</h2>
      <div className="space-y-4 mb-12">
        {STEPS.map((step) => (
          <div key={step.icon} className="card flex gap-4 items-start">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
              style={{ background: 'var(--accent-red)', color: 'white' }}
            >
              {step.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">{step.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Win Conditions */}
      <h2 className="text-2xl font-bold mb-6">Kondisi Menang</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {WIN_CONDITIONS.map((wc) => (
          <div key={wc.team} className="card text-center">
            <h3 className="font-bold text-lg mb-2" style={{ color: wc.color }}>{wc.team}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{wc.condition}</p>
          </div>
        ))}
      </div>

      {/* Tips */}
      <h2 className="text-2xl font-bold mb-6">Tips Bermain</h2>
      <div className="card mb-8">
        <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
          <li><strong className="text-[var(--accent-green)]">Sebagai Data Division:</strong> Perhatikan siapa yang bertingkah aneh. Gunakan info dari role khusus untuk menyusun teori. Jangan percaya siapapun 100%!</li>
          <li><strong className="text-[var(--accent-red)]">Sebagai Insider Threat:</strong> Berpura-puralah menjadi anggota tim biasa. Alihkan kecurigaan ke orang lain. Jangan terlalu diam, tapi juga jangan terlalu vokal.</li>
          <li><strong className="text-[var(--accent-gold)]">Sebagai Freelancer:</strong> Kamu bisa bermain di kedua sisi. Bantu tim yang sedang menang, lalu belok di saat yang tepat.</li>
          <li><strong className="text-white">Sebagai Head of Data:</strong> Bersikap netral! Jangan memberikan hint ke siapapun. Arahkan game dengan adil.</li>
        </ul>
      </div>

      <div className="text-center">
        <Link href="/role-book" className="btn-primary">
          Lihat Semua Role
        </Link>
      </div>
    </main>
  );
}
