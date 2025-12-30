import React from 'react';

const GAMES = [
  { id: 'cs2', name: "CS 2", icon: "🔫", coeff: 2.5 },
  { id: 'valorant', name: "VALORANT", icon: "⚔️", coeff: 2.8 },
  { id: 'dota2', name: "Dota 2", icon: "🐉", coeff: 2.2 },
  { id: 'gta5', name: "GTA V", icon: "🚗", coeff: 1.8 },
  { id: 'elden_ring', name: "Elden Ring", icon: "💍", coeff: 1.1 },
  { id: 'cyberpunk', name: "Cyberpunk 2077", icon: "🤖", coeff: 0.6 }
];

const QUALITY_LEVELS = {
  'Low': { multiplier: 1.6, color: '#4caf50', label: 'Низькі' },
  'Medium': { multiplier: 1.2, color: '#2196f3', label: 'Середні' },
  'High': { multiplier: 1.0, color: '#ff9800', label: 'Високі' },
  'Ultra': { multiplier: 0.7, color: '#d50000', label: 'Ультра' }
};

const FPSMeter = ({ cpu, gpu, selectedGameId, targetFPS, quality = 'High', resolution = '1080p' }) => {
  
  if (!cpu || !gpu) return null;

  const cpuScore = cpu.specs?.score || 0;
  const gpuScore = gpu.specs?.score || 0;
  
  // Базова формула
  const basePerformance = (gpuScore * 0.75) + (cpuScore * 0.25);

  const getFPS = (gameCoeff) => {
    // Якість беремо з пропсів (вона прийшла з фільтрів)
    const qMult = QUALITY_LEVELS[quality]?.multiplier || 1.0;
    
    // Розділення - множник
    const resMultipliers = { '1080p': 1.0, '1440p': 0.70, '4K': 0.45 };
    const rMult = resMultipliers[resolution] || 1.0;
    
    let fps = Math.round(basePerformance * gameCoeff * qMult * rMult);
    return Math.max(fps, 10);
  };

  const getColor = (fps) => {
    if (fps >= 144) return '#00ff00';
    if (fps >= 100) return '#4caf50';
    if (fps >= 60) return '#90EE90';
    if (fps >= 45) return '#ffa500';
    if (fps >= 30) return '#ff9800';
    return '#f44336';
  };

  const currentQ = QUALITY_LEVELS[quality] || QUALITY_LEVELS['High'];

  return (
    <div style={{ background: '#111', padding: '25px', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
         <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>🎮 Прогноз FPS</h3>
         <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '5px' }}>
            Результати для: <strong style={{color: currentQ.color}}>{currentQ.label}</strong> в <strong>{resolution}</strong>
         </div>
      </div>

      {/* ТУТ БІЛЬШЕ НЕМАЄ КНОПОК ПЕРЕМИКАННЯ */}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
        {GAMES.map(g => {
          const fps = getFPS(g.coeff);
          const color = getColor(fps);
          
          const isSelectedTarget = g.id === selectedGameId;
          const targetMissed = isSelectedTarget && fps < targetFPS;

          return (
            <div
              key={g.id}
              style={{
                textAlign: 'center',
                padding: '15px',
                background: isSelectedTarget 
                  ? (targetMissed ? 'rgba(255, 82, 82, 0.1)' : 'rgba(76, 175, 80, 0.1)') 
                  : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: isSelectedTarget 
                  ? (targetMissed ? '2px solid #ff5252' : '2px solid #4caf50') 
                  : `1px solid #222`,
                transform: isSelectedTarget ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              {isSelectedTarget && (
                <div style={{
                  position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                  background: targetMissed ? '#ff5252' : '#4caf50',
                  color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}>
                  {targetMissed ? '⚠️ БЮДЖЕТ ОБМЕЖУЄ' : '✅ ЦІЛЬ ДОСЯГНУТО'}
                </div>
              )}

              <div style={{ fontSize: '28px', marginBottom: '5px' }}>{g.icon}</div>
              <div style={{ color: isSelectedTarget ? '#fff' : '#ccc', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>{g.name}</div>
              
              <div style={{ color: color, fontWeight: '900', fontSize: '26px', textShadow: `0 0 15px ${color}40` }}>
                {fps}
              </div>
              
              <div style={{ color: '#666', fontSize: '10px' }}>FPS</div>
              
              {targetMissed && (
                <div style={{ fontSize: '0.7rem', color: '#ff5252', marginTop: '5px' }}>
                  Хотіли: {targetFPS}+
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FPSMeter;