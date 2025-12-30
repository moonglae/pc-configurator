import React, { useState, useEffect } from 'react';
import { useBuilder } from '../context/BuilderContext';
import { api, endpoints } from '../api/endpoints';
import ComponentCard from './ComponentCard';
import FPSMeter from './FPSMeter';

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
    
    // Local state to hold compatibility error messages
    const [localError, setLocalError] = useState(null);

    // Clear error when switching categories
    useEffect(() => {
        setLocalError(null);
    }, [activeCategory]);

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

    // === COMPATIBILITY CHECK LOGIC ===
    const checkCompatibility = (category, item, currentBuild) => {
        if (!item) return null;

        // Helper: отримати TDP для GPU (з fallback по назві)
        const getGPUTDP = (gpu) => {
            let tdp = gpu.specs?.tdp || 0;
            
            // Fallback: розпізнавання за назвою
            if (tdp <= 0) {
                const name = (gpu.name || '').toUpperCase();
                if (name.includes('4090')) tdp = 450; // RTX 4090
                else if (name.includes('4080')) tdp = 320; // RTX 4080
                else if (name.includes('4070')) tdp = 200; // RTX 4070
                else if (name.includes('4060')) tdp = 130; // RTX 4060
                else if (name.includes('7900')) tdp = 420; // RX 7900
                else if (name.includes('7800')) tdp = 310; // RX 7800
                console.log(`[GPU TDP] Fallback для ${gpu.name}: TDP = ${tdp}W`);
            }
            return tdp;
        };

        // Helper: отримати Wattage для PSU (з fallback по назові)
        const getPSUWattage = (psu) => {
            let wattage = psu.specs?.wattage || 0;
            
            if (wattage <= 0) {
                // Fallback: розпізнавання за назвою (пошук числа)
                const name = psu.name || '';
                const match = name.match(/(\d+)\s*[WwBь]/);
                if (match && match[1]) {
                    wattage = parseInt(match[1]);
                    console.log(`[PSU Wattage] Fallback для ${psu.name}: Wattage = ${wattage}W`);
                }
            }
            return wattage;
        };

        // 1. EXPLICITLY IGNORE RAM <-> PSU CHECKS (only skip when selecting RAM while PSU already set)
        // Previously we also returned early when selecting PSU and RAM existed — that blocked PSU<->GPU checks.
        if (category === 'ram' && currentBuild.psu) {
            return null;
        }

        // 2. CPU <=> Motherboard (Socket Check)
        if (category === 'cpu' && currentBuild.motherboard) {
            const cpuSocket = (item.specs?.socket || '').toUpperCase().trim();
            const moboSocket = (currentBuild.motherboard.specs?.socket || '').toUpperCase().trim();
            
            if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
                return `Несумісність: Процесор ${item.name} (${cpuSocket}) не підходить до плати (${moboSocket}).`;
            }
        }
        if (category === 'motherboard' && currentBuild.cpu) {
            const cpuSocket = (currentBuild.cpu.specs?.socket || '').toUpperCase().trim();
            const moboSocket = (item.specs?.socket || '').toUpperCase().trim();
            
            if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
                return `Несумісність: Плата (${moboSocket}) не підходить до процесора (${cpuSocket}).`;
            }
        }

        // 3. Motherboard <=> RAM (DDR Type Check)
        if (category === 'ram' && currentBuild.motherboard) {
            const ramType = (item.specs?.type || item.name || '').toUpperCase().trim();
            const moboType = (currentBuild.motherboard.specs?.memory_type || currentBuild.motherboard.name || '').toUpperCase().trim();
            
            if (!ramType || !moboType) return null;
            
            const ramIsDDR5 = ramType.includes('DDR5') || ramType.includes('DDR-5');
            const ramIsDDR4 = ramType.includes('DDR4') || ramType.includes('DDR-4');
            const moboIsDDR5 = moboType.includes('DDR5') || moboType.includes('DDR-5');
            const moboIsDDR4 = moboType.includes('DDR4') || moboType.includes('DDR-4');
            
            const moboSocket = (currentBuild.motherboard.specs?.socket || '').toUpperCase().trim();
            if (moboSocket === 'AM5' && ramIsDDR4) {
                return "Платформа AM5 вимагає DDR5 пам'ять.";
            }
            
            if ((ramIsDDR4 || ramIsDDR5) && (moboIsDDR4 || moboIsDDR5)) {
                if ((moboIsDDR5 && ramIsDDR4) || (moboIsDDR4 && ramIsDDR5)) {
                    return `Несумісність: Плата вимагає ${moboIsDDR5 ? 'DDR5' : 'DDR4'}, а ви вибрали ${ramIsDDR5 ? 'DDR5' : 'DDR4'}.`;
                }
            }
        }

        // 4. PSU <=> GPU (Wattage Check) - КРИТИЧНЕ для потужних відеокарт
        if (category === 'psu' && currentBuild.gpu) {
            const psuWattage = getPSUWattage(item);
            const gpuTDP = getGPUTDP(currentBuild.gpu);
            const gpuName = currentBuild.gpu.name || 'GPU';
            
            console.log(`[DEBUG] PSU Check виконується!`);
            console.log(`[PSU Check] PSU: ${item.name}, Wattage:`, psuWattage, `specs:`, item.specs);
            console.log(`[PSU Check] GPU: ${gpuName}, TDP: ${gpuTDP}W`);
            
            // Якщо GPU має TDP >= 300W (RTX 4090, 4080 і т.д.), то PSU ПОВИННА бути >= 750W
            if (gpuTDP >= 300) {
                if (psuWattage < 750) {
                    console.log(`[PSU Check] БЛОКУВАННЯ: GPU TDP ${gpuTDP}W >= 300W, PSU ${psuWattage}W < 750W`);
                    return `❌ КРИТИЧНО: ${gpuName} (TDP ${gpuTDP}W) вимагає PSU мінімум 750W. Ви вибрали ${psuWattage}W - ПК не запуститься або вийде з ладу!`;
                }
            }
            // Якщо GPU має TDP >= 250W, то PSU повинна бути >= 700W
            else if (gpuTDP >= 250) {
                if (psuWattage < 700) {
                    console.log(`[PSU Check] БЛОКУВАННЯ: GPU TDP ${gpuTDP}W >= 250W, PSU ${psuWattage}W < 700W`);
                    return `❌ КРИТИЧНО: ${gpuName} (TDP ${gpuTDP}W) вимагає PSU мінімум 700W. Ви вибрали ${psuWattage}W!`;
                }
            }
        } else if (category === 'psu') {
            console.log(`[DEBUG] PSU вибір, але GPU не в selectedComponents!`);
        }
        
        if (category === 'gpu' && currentBuild.psu) {
            const psuWattage = getPSUWattage(currentBuild.psu);
            const gpuTDP = getGPUTDP(item);
            const gpuName = item.name || 'GPU';
            
            console.log(`[DEBUG] GPU Check виконується!`);
            console.log(`[GPU Check] GPU: ${gpuName}, TDP: ${gpuTDP}W`);
            console.log(`[GPU Check] PSU: ${currentBuild.psu.name}, Wattage:`, psuWattage, `specs:`, currentBuild.psu.specs);
            
            // Якщо GPU має TDP >= 300W (RTX 4090, 4080 і т.д.), то PSU ПОВИННА бути >= 750W
            if (gpuTDP >= 300) {
                if (psuWattage < 750) {
                    console.log(`[GPU Check] БЛОКУВАННЯ: GPU TDP ${gpuTDP}W >= 300W, PSU ${psuWattage}W < 750W`);
                    return `❌ КРИТИЧНО: ${gpuName} (TDP ${gpuTDP}W) вимагає PSU мінімум 750W. У вас є ${psuWattage}W - ПК не запуститься!`;
                }
            }
            // Якщо GPU має TDP >= 250W, то PSU повинна бути >= 700W
            else if (gpuTDP >= 250) {
                if (psuWattage < 700) {
                    console.log(`[GPU Check] БЛОКУВАННЯ: GPU TDP ${gpuTDP}W >= 250W, PSU ${psuWattage}W < 700W`);
                    return `❌ КРИТИЧНО: ${gpuName} (TDP ${gpuTDP}W) вимагає PSU мінімум 700W. У вас є ${psuWattage}W!`;
                }
            }
        } else if (category === 'gpu') {
            console.log(`[DEBUG] GPU вибір, але PSU не в selectedComponents!`);
        }

        return null;
    };

    const handleSelectComponent = (item) => {
        // Validate before selecting
        console.log(`[PCBuilder] ============ ПОЧАТОК ВИБОРУ КОМПОНЕНТА ============`);
        console.log(`[PCBuilder] Категорія: ${activeCategory}`);
        console.log(`[PCBuilder] Компонент:`, item.name, item);
        console.log(`[PCBuilder] Поточна збірка ДО перевірки:`, JSON.stringify(selectedComponents, null, 2));
        
        const error = checkCompatibility(activeCategory, item, selectedComponents);
        
        console.log(`[PCBuilder] Результат перевірки: Помилка = ${error || 'немає'}`);
        
        if (error) {
            // Блокуємо вибір якщо є помилка
            console.error(`[PCBuilder] 🛑 ВИБІР ЗАБЛОКОВАНИЙ! Причина:`, error);
            setLocalError(error);
            return;
        }

        // Clear error and proceed with selection
        setLocalError(null);
        console.log(`[PCBuilder] ✅ Компонент ${item.name} прийнято! Викликаємо selectComponent`);
        selectComponent(activeCategory, item);
        console.log(`[PCBuilder] ============ КОНЕЦ ВИБОРУ КОМПОНЕНТА ============\n`);
    };

    // Determine what status to show
    const currentStatus = localError 
        ? { isValid: false, message: localError }
        : { 
            isValid: validationResult?.is_valid ?? true, 
            message: validationResult?.messages?.[0] || "All systems nominal." 
          };

    return (
        <div style={styles.container} className="animate-fade-in">
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h1 style={styles.headerTitle}>
                    SYSTEM <span style={styles.redText} className="neon-text">CONFIGURATOR</span>
                </h1>
                <p style={{ color: '#888', letterSpacing: '2px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    Build your ultimate machine
                </p>
            </div>

            {/* Slots Inventory */}
            <div style={styles.slotsContainer}>
                {CATEGORIES.map((cat) => {
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
                            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: isActive ? '#fff' : '#888', letterSpacing: '1px' }}>
                                {cat.label}
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: isFilled ? '#00e676' : '#444', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {isFilled ? selectedComponents[cat.id].name.substring(0, 18) + '..' : "EMPTY SLOT"}
                            </div>
                            {isActive && <div style={styles.activeDot}></div>}
                        </div>
                    );
                })}
            </div>

            {/* Status / Diagnostics Box */}
            <div className="glass-panel animate-fade-in" style={{ 
                ...styles.statusBox, 
                borderLeft: `4px solid ${currentStatus.isValid ? '#00e676' : '#d50000'}`,
                background: currentStatus.isValid ? 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.4) 100%)' : 'rgba(213, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '1.5rem', color: currentStatus.isValid ? '#00e676' : '#d50000' }}>
                        {currentStatus.isValid ? "● ONLINE" : "● ERROR"}
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', color: '#fff' }}>SYSTEM DIAGNOSTICS:</div>
                        <div style={{ color: currentStatus.isValid ? '#aaa' : '#ff5252', fontSize: '0.9rem' }}>
                            {currentStatus.message}
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Header */}
            <div style={styles.selectionHeader}>
                <span style={{ color: '#666' }}>SELECT COMPONENT // </span>
                <span style={{ color: '#ff1744', fontWeight: 'bold' }}>{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>
            </div>

            {/* Items Grid */}
            {loading ? (
                <div style={styles.loadingBox}>
                    <div className="neon-text" style={{ fontSize: '1.5rem' }}>SCANNING DATABASE...</div>
                </div>
            ) : (
                <div className="products-grid" style={styles.itemsGrid}>
                    {availableItems.length > 0 ? availableItems.map((item, idx) => (
                        <ComponentCard 
                            className="product-card"
                            key={item.id} 
                            item={item} 
                            onSelect={() => handleSelectComponent(item)}
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

            <FPSMeter cpu={selectedComponents.cpu} gpu={selectedComponents.gpu} />
        </div>
    );
};

const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
    headerTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: '3rem', color: '#fff', margin: '0 0 10px 0', letterSpacing: '4px', fontWeight: '900' },
    redText: { color: '#d50000', textShadow: '0 0 20px rgba(213,0,0,0.6)' },
    
    slotsContainer: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '50px', flexWrap: 'wrap' },
    slotCard: { width: '140px', height: '140px', padding: '15px', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: 'rgba(10, 10, 10, 0.6)' },
    activeDot: { position: 'absolute', bottom: '-10px', width: '40px', height: '3px', background: '#ff1744', boxShadow: '0 0 10px #ff1744' },

    statusBox: { padding: '20px', marginBottom: '40px', borderRadius: '4px', transition: 'all 0.3s ease' },

    selectionHeader: { fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '30px', letterSpacing: '1px' },
    loadingBox: { height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    
    itemsGrid: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', width: '100%' }
};

export default PCBuilder;