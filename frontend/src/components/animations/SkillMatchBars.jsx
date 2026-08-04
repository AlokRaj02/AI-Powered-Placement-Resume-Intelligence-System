import React from 'react';

const SkillMatchBars = ({ skills }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      {skills.map((skill, i) => (
        <div key={i} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem', fontFamily: 'var(--font-secondary)' }}>
            <span>{skill.name}</span>
            <span style={{ color: 'var(--primary-color)' }}>{skill.score}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              style={{ 
                '--target-width': `${skill.score}%`,
                width: 0, 
                height: '100%', 
                background: 'var(--primary-color)', 
                animation: `fillBar 1.5s cubic-bezier(0.1, 0.7, 0.1, 1) ${i * 0.2}s forwards`
              }} 
            />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes fillBar {
          to { width: var(--target-width); }
        }
      `}</style>
    </div>
  );
};

export default SkillMatchBars;
