import React, { useState, useEffect } from 'react';
import { api, endpoints } from '../api/endpoints';
import ComponentCard from '../components/ComponentCard';
import { useBuilder } from '../context/BuilderContext';
import OrderModal from '../components/OrderModal';
import FilterBar from '../components/FilterBar'; // Імпорт

const Catalog = () => {
    const { selectedComponents, selectComponent } = useBuilder();
    
    // Стан фільтрів
    const [activeTab, setActiveTab] = useState('cpu');
    const [filters, setFilters] = useState({
        search: '',
        min_price: '',
        max_price: '',
        sort: 'asc'
    });

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const totalPrice = Object.values(selectedComponents)
        .reduce((sum, item) => sum + (item ? item.price : 0), 0);
    
    const selectedItemsList = Object.values(selectedComponents).filter(i => i !== null);

    const categories = [
        { id: 'cpu', name: 'PROCESSORS' },
        { id: 'gpu', name: 'GRAPHICS' },
        { id: 'motherboard', name: 'MOTHERBOARDS' },
        { id: 'ram', name: 'MEMORY' },
        { id: 'psu', name: 'POWER SUPPLY' }
    ];

    // Завантаження з урахуванням фільтрів
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Додаємо фільтри у запит
                const response = await api.get(endpoints.components.getAll, {
                    params: { 
                        category: activeTab,
                        search: filters.search,
                        min_price: filters.min_price,
                        max_price: filters.max_price,
                        sort: filters.sort
                    }
                });
                setItems(response.data || []);
            } catch (error) {
                console.error("Catalog error:", error);
            } finally {
                setLoading(false);
            }
        };
        
        // Робимо затримку (debounce), щоб не спамити сервер при кожній букві
        const timeoutId = setTimeout(() => {
            loadData();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [activeTab, filters]); // Перезапуск при зміні будь-якого фільтра

    return (
        <div style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', paddingBottom: '120px' }}>
            
            {/* ЗАГОЛОВОК */}
            <h2 style={{ 
                marginBottom: '40px', 
                fontFamily: "'Orbitron', sans-serif", 
                color: '#fff', 
                fontSize: '2.5rem',
                borderLeft: '5px solid #d50000',
                paddingLeft: '20px'
            }}>
                COMPONENT <span style={{ color: '#d50000' }} className="neon-text">CATALOG</span>
            </h2>

            {/* ВКЛАДКИ */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        style={{
                            padding: '10px 20px',
                            border: activeTab === cat.id ? '1px solid #ff1744' : '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: activeTab === cat.id ? 'rgba(213, 0, 0, 0.2)' : 'transparent',
                            color: activeTab === cat.id ? '#fff' : '#888',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontFamily: "'Orbitron', sans-serif",
                            transition: 'all 0.3s',
                        }}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* ОСНОВНА СІТКА (Фільтри зліва + Товари справа) */}
            <div className="catalog-layout" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px' }}>
                
                {/* 1. БОКОВА ПАНЕЛЬ ФІЛЬТРІВ */}
                <div className="filter-sidebar">
                    <FilterBar filters={filters} setFilters={setFilters} />
                </div>

                {/* 2. СПИСОК ТОВАРІВ */}
                <div>
                    {loading ? (
                        <div style={{ color: '#666', fontSize: '1.5rem', textAlign: 'center', marginTop: '50px' }}>SEARCHING...</div>
                    ) : (
                        <div className="products-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'start' }}>
                            {items.length > 0 ? items.map((item, idx) => (
                                <ComponentCard 
                                    key={item.id} 
                                    item={item}
                                    className="product-card"
                                    index={idx}
                                    onSelect={() => selectComponent(activeTab, item)}
                                    isSelected={selectedComponents[activeTab]?.id === item.id}
                                />
                            )) : (
                                <div style={{ color: '#555', width: '100%', textAlign: 'center', marginTop: '50px' }}>
                                    NO RESULTS FOUND
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER & MODAL (без змін) */}
            <div className="glass-panel" style={styles.totalBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '1rem', color: '#aaa', letterSpacing: '1px' }}>TOTAL:</div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '2rem', color: '#fff', fontWeight: 'bold' }}>
                        {totalPrice} <span style={{ color: '#d50000', fontSize: '1.5rem' }}>₴</span>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        if (totalPrice > 0) setIsModalOpen(true);
                        else alert("Empty Cart!");
                    }}
                    style={styles.orderBtn}
                >
                    ЗАМОВИТИ 🚀
                </button>
            </div>

            <OrderModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                items={selectedItemsList}
                total={totalPrice}
                onSucces={() => { window.location.reload(); setIsModalOpen(false); }}
            />
        </div>
    );
};

const styles = {
    totalBar: {
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        padding: '15px 40px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '30px',
        zIndex: 100, border: '1px solid rgba(213, 0, 0, 0.5)', backgroundColor: 'rgba(10, 10, 10, 0.95)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
    },
    orderBtn: {
        padding: '12px 30px', borderRadius: '50px', background: '#d50000', color: 'white',
        border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 0 15px rgba(213, 0, 0, 0.4)'
    }
};

export default Catalog;