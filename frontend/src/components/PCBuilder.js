import React, { useState, useEffect } from 'react';
import { useBuilder } from '../context/BuilderContext';
import { api, endpoints } from '../api/endpoints';
import ComponentCard from './ComponentCard';

const CATEGORIES = [
    { id: 'cpu', label: 'PROCESSOR', icon: '🧠' },
    { id: 'motherboard', label: 'MOTHERBOARD', icon: '🔌' },
    { id: 'ram', label: 'MEMORY', icon: '💾' },
    { id: 'gpu', label: 'GRAPHICS', icon: '🎮' },
    { id: 'psu', label: 'POWER', icon: '⚡' }
];

const PCBuilder = () => {
    const { selectedComponents, selectComponent, validationResult } = useBuilder();
    const [activeCategory, setActiveCategory] = useState('cpu');
    const [availableItems, setAvailableItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const response = await api.get(endpoints.components.getAll, {
                    params: { category: activeCategory }
                });
                setAvailableItems(response.data || []);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [activeCategory]);

    return (
        <div style={styles.container} className="animate-fade-in">
            {/* ЗАГОЛОВОК У СТИЛІ ГОЛОВНОЇ */}
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h1 style={styles.headerTitle}>
                    SYSTEM <span style={styles.redText} className="neon-text">CONFIGURATOR</span>
                </h1>
                <p style={{ color: '#888', letterSpacing: '2px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    Build your ultimate machine
                </p>
            </div>

            {/* ПАНЕЛЬ СЛОТІВ (ІНВЕНТАР) */}
            <div style={styles.slotsContainer}>
                {CATEGORIES.map((cat, index) => {
                    const isFilled = selectedComponents[cat.id] !== null;
                    const isActive = activeCategory === cat.id;

                    return (
                        <div 
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`glass-panel hover-card`}
                            style={{
                                ...styles.slotCard,
                                borderColor: isActive ? '#ff1744' : (isFilled ? '#00e676' : 'rgba(255,255,255,0.1)'),
                                boxShadow: isActive ? '0 0 25px rgba(213, 0, 0, 0.4)' : 'none',
                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                            }}
                        >
                            <div style={{ fontSize: '2.2rem', marginBottom: '10px', filter: isActive ? 'drop-shadow(0 0 5px #ff1744)' : 'none' }}>
                                {cat.icon}
                            </div>
                            <div style={{ 
                                fontFamily: "'Orbitron', sans-serif", 
                                fontSize: '0.8rem', 
                                color: isActive ? '#fff' : '#888',
                                letterSpacing: '1px'
                            }}>
                                {cat.label}
                            </div>
                            <div style={{ 
                                marginTop: '8px', 
                                fontSize: '0.75rem', 
                                color: isFilled ? '#00e676' : '#444', 
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}>
                                {isFilled ? selectedComponents[cat.id].name.substring(0, 18) + '..' : "EMPTY SLOT"}
                            </div>
                            {isActive && <div style={styles.activeDot}></div>}
                        </div>
                    );
                })}
            </div>

            {/* БЛОК СТАТУСУ */}
            {validationResult && (
                <div className="glass-panel animate-fade-in" style={{
                    ...styles.statusBox,
                    borderLeft: `4px solid ${validationResult.is_valid ? '#00e676' : '#d50000'}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ 
                            fontSize: '1.5rem', 
                            color: validationResult.is_valid ? '#00e676' : '#d50000' 
                        }}>
                            {validationResult.is_valid ? "● ONLINE" : "● ERROR"}
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', color: '#fff' }}>SYSTEM DIAGNOSTICS:</div>
                            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
                                {validationResult.messages.length > 0 ? validationResult.messages[0] : "All systems nominal."}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ЗАГОЛОВОК ВИБОРУ */}
            <div style={styles.selectionHeader}>
                <span style={{ color: '#666' }}>SELECT COMPONENT // </span>
                <span style={{ color: '#ff1744', fontWeight: 'bold' }}>{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>
            </div>

            {/* СПИСОК ТОВАРІВ */}
            {loading ? (
                <div style={styles.loadingBox}>
                    <div className="neon-text" style={{ fontSize: '1.5rem' }}>SCANNING DATABASE...</div>
                </div>
            ) : (
                <div className="products-grid" style={styles.itemsGrid}> {/* <-- АДАПТИВНА СІТКА */}
                    {availableItems.length > 0 ? availableItems.map((item, idx) => (
                        <ComponentCard 
                            className="product-card"
                            key={item.id} 
                            item={item} 
                            onSelect={(i) => selectComponent(activeCategory, i)}
                            isSelected={selectedComponents[activeCategory]?.id === item.id}
                            index={idx}
                        />
                    )) : (
                        <div style={{ width: '100%', textAlign: 'center', padding: '50px', color: '#444' }}>
                            NO COMPATIBLE PARTS FOUND
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
    headerTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: '3rem', color: '#fff', margin: '0 0 10px 0', letterSpacing: '4px', fontWeight: '900' },
    redText: { color: '#d50000', textShadow: '0 0 20px rgba(213,0,0,0.6)' },
    
    slotsContainer: { 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '15px', 
        marginBottom: '50px', 
        flexWrap: 'wrap' 
    },
    slotCard: {
        width: '140px',
        height: '140px',
        padding: '15px',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'rgba(10, 10, 10, 0.6)'
    },
    activeDot: {
        position: 'absolute',
        bottom: '-10px',
        width: '40px',
        height: '3px',
        background: '#ff1744',
        boxShadow: '0 0 10px #ff1744'
    },

    statusBox: {
        padding: '20px',
        marginBottom: '40px',
        background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.4) 100%)',
        borderRadius: '4px'
    },

    selectionHeader: {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '1.2rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '15px',
        marginBottom: '30px',
        letterSpacing: '1px'
    },
    loadingBox: { height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    
    // --- ОСЬ ТУТ ЗМІНИ (Flexbox для центрування) ---
    itemsGrid: { 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center', // Центрування по горизонталі
        gap: '30px',
        width: '100%'
    }
};

export default PCBuilder;