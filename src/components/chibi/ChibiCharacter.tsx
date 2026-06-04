'use client';

import { ROLES, RoleDefinition } from '@/lib/roles';

interface ChibiProps {
  roleId: string;
  size?: number;
  isAlive?: boolean;
  showName?: boolean;
}

function Accessory({ type, color, size }: { type: string; color: string; size: number }) {
  const s = size * 0.15;
  const cx = size / 2;

  switch (type) {
    case 'laptop':
      return (
        <g transform={`translate(${cx - s * 1.5}, ${size * 0.72})`}>
          <rect x={0} y={0} width={s * 3} height={s * 2} rx={2} fill={color} opacity={0.9} />
          <rect x={s * 0.3} y={s * 0.2} width={s * 2.4} height={s * 1.2} rx={1} fill="#1a1a2e" />
          <rect x={s * 0.5} y={s * 0.4} width={s * 0.4} height={s * 0.2} fill="#e94560" />
          <rect x={s * 1.1} y={s * 0.4} width={s * 0.8} height={s * 0.2} fill="#444" />
        </g>
      );
    case 'helmet':
      return (
        <g transform={`translate(${cx - s * 1.2}, ${size * 0.08})`}>
          <ellipse cx={s * 1.2} cy={s * 0.8} rx={s * 1.4} ry={s * 0.9} fill={color} />
          <rect x={0} y={s * 0.7} width={s * 2.4} height={s * 0.3} fill={color} opacity={0.7} />
        </g>
      );
    case 'key':
      return (
        <g transform={`translate(${cx + s * 1.5}, ${size * 0.5})`}>
          <circle cx={0} cy={0} r={s * 0.5} fill="none" stroke={color} strokeWidth={2} />
          <line x1={0} y1={s * 0.5} x2={0} y2={s * 2} stroke={color} strokeWidth={2} />
          <line x1={0} y1={s * 1.5} x2={s * 0.5} y2={s * 1.5} stroke={color} strokeWidth={2} />
          <line x1={0} y1={s * 2} x2={s * 0.5} y2={s * 2} stroke={color} strokeWidth={2} />
        </g>
      );
    case 'coffee':
      return (
        <g transform={`translate(${cx + s * 1.2}, ${size * 0.55})`}>
          <rect x={0} y={0} width={s * 1.2} height={s * 1.5} rx={2} fill="#8B4513" />
          <path d={`M${s * 1.2},${s * 0.3} Q${s * 2},${s * 0.5} ${s * 1.2},${s * 1}`} fill="none" stroke="#8B4513" strokeWidth={2} />
          <path d={`M${s * 0.3},${-s * 0.3} Q${s * 0.5},${-s * 0.8} ${s * 0.7},${-s * 0.3}`} fill="none" stroke="#ccc" strokeWidth={1.5} opacity={0.6} />
        </g>
      );
    case 'magnifier':
      return (
        <g transform={`translate(${cx + s * 1.3}, ${size * 0.45})`}>
          <circle cx={0} cy={0} r={s * 0.7} fill="none" stroke={color} strokeWidth={2.5} />
          <circle cx={0} cy={0} r={s * 0.4} fill={`${color}33`} />
          <line x1={s * 0.5} y1={s * 0.5} x2={s * 1.2} y2={s * 1.2} stroke={color} strokeWidth={2.5} />
        </g>
      );
    case 'wrench':
      return (
        <g transform={`translate(${cx + s * 1.5}, ${size * 0.45})`}>
          <rect x={-1} y={0} width={3} height={s * 2.5} rx={1} fill={color} transform="rotate(-30)" />
          <circle cx={0} cy={0} r={s * 0.4} fill="none" stroke={color} strokeWidth={2} />
        </g>
      );
    case 'blueprint':
      return (
        <g transform={`translate(${cx - s * 2}, ${size * 0.73})`}>
          <rect x={0} y={0} width={s * 4} height={s * 1.5} rx={2} fill="#1a5276" opacity={0.8} />
          <line x1={s * 0.5} y1={s * 0.5} x2={s * 3.5} y2={s * 0.5} stroke="#fff" strokeWidth={1} opacity={0.5} />
          <line x1={s * 0.5} y1={s * 1} x2={s * 2.5} y2={s * 1} stroke="#fff" strokeWidth={1} opacity={0.5} />
          <rect x={s * 2.8} y={s * 0.3} width={s * 0.8} height={s * 0.8} rx={1} fill="none" stroke="#fff" strokeWidth={1} opacity={0.5} />
        </g>
      );
    case 'flask':
      return (
        <g transform={`translate(${cx + s * 1.3}, ${size * 0.48})`}>
          <rect x={s * 0.1} y={-s * 0.3} width={s * 0.4} height={s * 0.5} fill="#dfe6e9" />
          <path d={`M0,${s * 0.2} L${-s * 0.4},${s * 1.2} Q${s * 0.3},${s * 1.5} ${s * 1},${s * 1.2} L${s * 0.6},${s * 0.2} Z`} fill={`${color}88`} stroke={color} strokeWidth={1.5} />
          <ellipse cx={s * 0.3} cy={s * 1} rx={s * 0.3} ry={s * 0.15} fill={color} opacity={0.6} />
        </g>
      );
    case 'shield':
      return (
        <g transform={`translate(${cx - s * 0.8}, ${size * 0.7})`}>
          <path d={`M${s * 0.8},0 L${s * 1.6},${s * 0.3} L${s * 1.6},${s * 1} Q${s * 0.8},${s * 1.6} 0,${s * 1} L0,${s * 0.3} Z`} fill={color} opacity={0.85} />
          <path d={`M${s * 0.8},${s * 0.3} L${s * 0.8},${s * 1.2}`} stroke="#fff" strokeWidth={1.5} opacity={0.5} />
          <path d={`M${s * 0.3},${s * 0.7} L${s * 1.3},${s * 0.7}`} stroke="#fff" strokeWidth={1.5} opacity={0.5} />
        </g>
      );
    case 'checklist':
      return (
        <g transform={`translate(${cx + s * 1.2}, ${size * 0.48})`}>
          <rect x={0} y={0} width={s * 1.5} height={s * 2} rx={2} fill="#fff" stroke={color} strokeWidth={1.5} />
          <line x1={s * 0.3} y1={s * 0.5} x2={s * 1.2} y2={s * 0.5} stroke="#aaa" strokeWidth={1} />
          <line x1={s * 0.3} y1={s * 1} x2={s * 1.2} y2={s * 1} stroke="#aaa" strokeWidth={1} />
          <line x1={s * 0.3} y1={s * 1.5} x2={s * 1.2} y2={s * 1.5} stroke="#aaa" strokeWidth={1} />
          <path d={`M${s * 0.1},${s * 0.4} L${s * 0.2},${s * 0.55} L${s * 0.35},${s * 0.35}`} fill="none" stroke="#27ae60" strokeWidth={1.5} />
          <path d={`M${s * 0.1},${s * 0.9} L${s * 0.2},${s * 1.05} L${s * 0.35},${s * 0.85}`} fill="none" stroke="#27ae60" strokeWidth={1.5} />
        </g>
      );
    case 'chart':
      return (
        <g transform={`translate(${cx + s * 1.2}, ${size * 0.5})`}>
          <rect x={0} y={s * 0.8} width={s * 0.4} height={s * 1} fill={color} opacity={0.7} />
          <rect x={s * 0.5} y={s * 0.3} width={s * 0.4} height={s * 1.5} fill={color} opacity={0.85} />
          <rect x={s * 1} y={s * 0.6} width={s * 0.4} height={s * 1.2} fill={color} />
          <line x1={0} y1={s * 1.8} x2={s * 1.5} y2={s * 1.8} stroke={color} strokeWidth={1.5} />
        </g>
      );
    case 'highlighter':
      return (
        <g transform={`translate(${cx + s * 1.3}, ${size * 0.42})`}>
          <rect x={0} y={0} width={s * 0.5} height={s * 2.2} rx={2} fill={color} transform="rotate(-20)" />
          <rect x={-2} y={s * 1.8} width={s * 0.5} height={s * 0.4} rx={1} fill="#333" transform="rotate(-20)" />
        </g>
      );
    case 'robot':
      return (
        <g transform={`translate(${cx + s * 1.3}, ${size * 0.25})`}>
          <rect x={0} y={0} width={s * 1.2} height={s * 1} rx={3} fill={color} />
          <circle cx={s * 0.3} cy={s * 0.4} r={s * 0.15} fill="#fff" />
          <circle cx={s * 0.9} cy={s * 0.4} r={s * 0.15} fill="#fff" />
          <line x1={s * 0.3} y1={s * 0.7} x2={s * 0.9} y2={s * 0.7} stroke="#fff" strokeWidth={1} />
          <line x1={s * 0.6} y1={-s * 0.3} x2={s * 0.6} y2={0} stroke={color} strokeWidth={1.5} />
          <circle cx={s * 0.6} cy={-s * 0.4} r={s * 0.12} fill={color} />
        </g>
      );
    case 'projector':
      return (
        <g transform={`translate(${cx + s * 1.2}, ${size * 0.55})`}>
          <rect x={0} y={0} width={s * 1.8} height={s * 1} rx={3} fill="#555" />
          <circle cx={s * 0.5} cy={s * 0.5} r={s * 0.35} fill={color} />
          <circle cx={s * 0.5} cy={s * 0.5} r={s * 0.2} fill="#fff" opacity={0.5} />
          <rect x={s * 1.2} y={s * 0.2} width={s * 0.3} height={s * 0.15} rx={1} fill="#888" />
        </g>
      );
    case 'megaphone':
      return (
        <g transform={`translate(${cx + s * 1.2}, ${size * 0.45})`}>
          <path d={`M0,${s * 0.4} L${s * 1.5},0 L${s * 1.5},${s * 1.2} L0,${s * 0.8} Z`} fill={color} />
          <rect x={-s * 0.3} y={s * 0.3} width={s * 0.4} height={s * 0.6} rx={2} fill={color} opacity={0.8} />
        </g>
      );
    case 'briefcase':
      return (
        <g transform={`translate(${cx + s * 1.2}, ${size * 0.55})`}>
          <rect x={0} y={s * 0.3} width={s * 1.8} height={s * 1.3} rx={3} fill={color} />
          <rect x={s * 0.5} y={0} width={s * 0.8} height={s * 0.5} rx={2} fill="none" stroke={color} strokeWidth={2} />
          <line x1={0} y1={s * 0.8} x2={s * 1.8} y2={s * 0.8} stroke="#333" strokeWidth={1} opacity={0.3} />
          <rect x={s * 0.7} y={s * 0.6} width={s * 0.4} height={s * 0.4} rx={1} fill="#333" opacity={0.3} />
        </g>
      );
    case 'backpack':
      return (
        <g transform={`translate(${cx - s * 2.2}, ${size * 0.4})`}>
          <rect x={0} y={s * 0.3} width={s * 1.4} height={s * 1.8} rx={4} fill={color} />
          <rect x={s * 0.2} y={s * 0.5} width={s * 1} height={s * 0.6} rx={2} fill="#fff" opacity={0.3} />
          <path d={`M${s * 0.3},${s * 0.3} Q${s * 0.7},-${s * 0.2} ${s * 1.1},${s * 0.3}`} fill="none" stroke={color} strokeWidth={2} />
        </g>
      );
    case 'crown':
      return (
        <g transform={`translate(${cx - s * 1}, ${size * 0.05})`}>
          <path d={`M0,${s * 1} L${s * 0.3},${s * 0.2} L${s * 1},${s * 0.7} L${s * 1.7},0 L${s * 2},${s * 1} Z`} fill={color} />
          <circle cx={s * 0.3} cy={s * 0.15} r={s * 0.12} fill="#e74c3c" />
          <circle cx={s * 1} cy={s * 0.6} r={s * 0.12} fill="#2ecc71" />
          <circle cx={s * 1.7} cy={-s * 0.05} r={s * 0.12} fill="#3498db" />
        </g>
      );
    default:
      return null;
  }
}

export default function ChibiCharacter({ roleId, size = 120, isAlive = true, showName = true }: ChibiProps) {
  const role = ROLES[roleId];
  if (!role) return null;

  const c = role.chibiColors;
  const cx = size / 2;
  const headR = size * 0.22;
  const bodyW = size * 0.35;
  const bodyH = size * 0.28;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ opacity: isAlive ? 1 : 0.35, filter: isAlive ? 'none' : 'grayscale(100%)' }}
      >
        {/* Shadow */}
        <ellipse cx={cx} cy={size * 0.92} rx={size * 0.2} ry={size * 0.04} fill="#000" opacity={0.15} />

        {/* Body */}
        <rect
          x={cx - bodyW / 2}
          y={size * 0.48}
          width={bodyW}
          height={bodyH}
          rx={bodyW * 0.3}
          fill={c.primary}
        />
        {/* Shirt collar */}
        <path
          d={`M${cx - bodyW * 0.2},${size * 0.48} L${cx},${size * 0.53} L${cx + bodyW * 0.2},${size * 0.48}`}
          fill={c.secondary}
        />

        {/* Legs */}
        <rect x={cx - bodyW * 0.25} y={size * 0.74} width={bodyW * 0.2} height={size * 0.12} rx={3} fill={c.secondary} />
        <rect x={cx + bodyW * 0.05} y={size * 0.74} width={bodyW * 0.2} height={size * 0.12} rx={3} fill={c.secondary} />

        {/* Shoes */}
        <ellipse cx={cx - bodyW * 0.15} cy={size * 0.87} rx={size * 0.05} ry={size * 0.03} fill="#2d3436" />
        <ellipse cx={cx + bodyW * 0.15} cy={size * 0.87} rx={size * 0.05} ry={size * 0.03} fill="#2d3436" />

        {/* Arms */}
        <rect x={cx - bodyW / 2 - size * 0.04} y={size * 0.5} width={size * 0.07} height={size * 0.18} rx={4} fill={c.primary} />
        <rect x={cx + bodyW / 2 - size * 0.03} y={size * 0.5} width={size * 0.07} height={size * 0.18} rx={4} fill={c.primary} />

        {/* Hands */}
        <circle cx={cx - bodyW / 2 - size * 0.005} cy={size * 0.69} r={size * 0.03} fill="#ffeaa7" />
        <circle cx={cx + bodyW / 2 + size * 0.005} cy={size * 0.69} r={size * 0.03} fill="#ffeaa7" />

        {/* Head */}
        <circle cx={cx} cy={size * 0.3} r={headR} fill="#ffeaa7" />

        {/* Hair */}
        <path
          d={`M${cx - headR * 0.95},${size * 0.25} Q${cx},${size * 0.08} ${cx + headR * 0.95},${size * 0.25}`}
          fill={c.hair}
        />
        <path
          d={`M${cx - headR * 1.05},${size * 0.28} Q${cx - headR * 1.1},${size * 0.15} ${cx - headR * 0.7},${size * 0.12}`}
          fill={c.hair}
        />
        <path
          d={`M${cx + headR * 1.05},${size * 0.28} Q${cx + headR * 1.1},${size * 0.15} ${cx + headR * 0.7},${size * 0.12}`}
          fill={c.hair}
        />

        {/* Eyes */}
        <ellipse cx={cx - headR * 0.35} cy={size * 0.3} rx={size * 0.025} ry={size * 0.032} fill="#2d3436" />
        <ellipse cx={cx + headR * 0.35} cy={size * 0.3} rx={size * 0.025} ry={size * 0.032} fill="#2d3436" />
        {/* Eye shine */}
        <circle cx={cx - headR * 0.32} cy={size * 0.29} r={size * 0.008} fill="#fff" />
        <circle cx={cx + headR * 0.38} cy={size * 0.29} r={size * 0.008} fill="#fff" />

        {/* Blush */}
        <ellipse cx={cx - headR * 0.55} cy={size * 0.34} rx={size * 0.025} ry={size * 0.015} fill="#fab1a0" opacity={0.5} />
        <ellipse cx={cx + headR * 0.55} cy={size * 0.34} rx={size * 0.025} ry={size * 0.015} fill="#fab1a0" opacity={0.5} />

        {/* Mouth */}
        <path
          d={`M${cx - size * 0.02},${size * 0.36} Q${cx},${size * 0.39} ${cx + size * 0.02},${size * 0.36}`}
          fill="none"
          stroke="#e17055"
          strokeWidth={1.5}
          strokeLinecap="round"
        />

        {/* Team indicator */}
        <circle cx={size * 0.1} cy={size * 0.1} r={size * 0.045} fill={
          role.team === 'insider' ? '#e74c3c' : role.team === 'data' ? '#2ecc71' : '#f39c12'
        } />

        {/* Accessory */}
        <Accessory type={role.chibiAccessory} color={c.accessory} size={size} />

        {/* Dead X eyes */}
        {!isAlive && (
          <>
            <line x1={cx - headR * 0.45} y1={size * 0.27} x2={cx - headR * 0.25} y2={size * 0.33} stroke="#e74c3c" strokeWidth={2} />
            <line x1={cx - headR * 0.25} y1={size * 0.27} x2={cx - headR * 0.45} y2={size * 0.33} stroke="#e74c3c" strokeWidth={2} />
            <line x1={cx + headR * 0.25} y1={size * 0.27} x2={cx + headR * 0.45} y2={size * 0.33} stroke="#e74c3c" strokeWidth={2} />
            <line x1={cx + headR * 0.45} y1={size * 0.27} x2={cx + headR * 0.25} y2={size * 0.33} stroke="#e74c3c" strokeWidth={2} />
          </>
        )}
      </svg>
      {showName && (
        <span className="text-xs font-bold text-center leading-tight" style={{ color: c.primary }}>
          {role.name}
        </span>
      )}
    </div>
  );
}
