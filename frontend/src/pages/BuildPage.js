import React from 'react';
import PCBuilder from '../components/PCBuilder';
import { Link } from 'react-router-dom';

const BuildPage = () => {
    return (
        <div style={{ minHeight: '100vh', paddingBottom: '50px' }}>
            {/* Навігаційна смужка (Breadcrumbs) */}
            <div style={{ 
                padding: '20px 0', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)', // Ледь помітна лінія
                marginBottom: '20px',
                background: 'rgba(0,0,0,0.3)', // Напівпрозорий чорний
                backdropFilter: 'blur(5px)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', fontSize: '0.9rem' }}>
                    <Link to="/" style={{ color: '#888', textDecoration: 'none' }}>Головна</Link>
                    <span style={{ margin: '0 10px', color: '#444' }}>/</span>
                    <strong style={{ color: '#e0e0e0', letterSpacing: '1px' }}>КОНСТРУКТОР СИСТЕМИ</strong>
                </div>
            </div>

            {/* Сам конструктор (він тепер буде на темному фоні body) */}
            <PCBuilder />
        </div>
    );
};

export default BuildPage;