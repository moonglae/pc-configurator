import React, { useState } from 'react';
import { api, endpoints } from '../api/endpoints';

const OrderModal = ({ isOpen, onClose, items, total, onSucces }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        city: '',
        department: '',
        payment: 'cod'
    });
    const [loading, setLoading] = useState(false);
    const [successMode, setSuccessMode] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        const orderData = {
            customer_name: formData.name,
            phone: formData.phone,
            delivery_address: `${formData.city}, ${formData.department}`,
            payment_method: formData.payment,
            total_price: total,
            component_ids: items.map(i => i.id)
        };

        try {
            await api.post(endpoints.orders.create, orderData);
            // ТУТ ЗМІНА: Ми просто вмикаємо екран успіху, але НЕ закриваємо вікно
            setSuccessMode(true); 
        } catch (error) {
            setErrorMsg("Помилка: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Блок успіху
    if (successMode) {
        return (
            <div style={styles.overlay}>
                <div className="glass-panel animate-fade-in" style={{ ...styles.modal, textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
                    <h2 style={{ color: '#00e676', fontFamily: "'Orbitron', sans-serif", marginBottom: '10px' }}>
                        УСПІШНО!
                    </h2>
                    <p style={{ color: '#ccc', marginBottom: '30px', lineHeight: '1.5' }}>
                        Ваше замовлення прийнято.<br/>
                        Менеджер зв'яжеться з вами.
                    </p>
                    <button 
                        onClick={() => { 
                            // ТУТ ЗМІНА: Коли натискають кнопку, ми все очищаємо
                            setSuccessMode(false); 
                            onClose(); 
                            onSucces(); // Перезавантаження сторінки відбудеться ТУТ
                        }} 
                        style={styles.successBtn}
                    >
                        ЗРОЗУМІЛО
                    </button>
                </div>
            </div>
        );
    }

    // ... (решта коду з формою залишається без змін)
    return (
        <div style={styles.overlay}>
            <div className="glass-panel animate-fade-in" style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", color: '#fff', letterSpacing: '1px' }}>
                        ОФОРМЛЕННЯ
                    </h2>
                    <button onClick={onClose} style={styles.closeBtn}>✖</button>
                </div>

                <div style={styles.summary}>
                    <span>Товарів: <strong style={{ color: '#fff' }}>{items.length}</strong></span>
                    <span>Сума: <strong style={{ color: '#00e676', fontSize: '1.2rem' }}>{total} ₴</strong></span>
                </div>

                {errorMsg && (
                    <div style={{ padding: '10px', background: 'rgba(255, 23, 68, 0.2)', border: '1px solid #ff1744', color: '#ff1744', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem' }}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>ОСОБИСТІ ДАНІ</label>
                        <input placeholder="ПІБ" required style={styles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <input placeholder="Телефон" required style={styles.input} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>ДОСТАВКА</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder="Місто" required style={{ ...styles.input, flex: 1 }} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                            <input placeholder="Відділення" required style={{ ...styles.input, width: '120px' }} value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                        </div>
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>ОПЛАТА</label>
                        <select style={styles.select} value={formData.payment} onChange={e => setFormData({...formData, payment: e.target.value})}>
                            <option value="cod">💵 Оплата при отриманні</option>
                            <option value="card">💳 Карткою онлайн</option>
                            <option value="crypto">₿ Crypto (USDT)</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} style={styles.submitBtn}>
                        {loading ? "ОБРОБКА..." : "ПІДТВЕРДИТИ ЗАМОВЛЕННЯ 🚀"}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
    modal: { width: '450px', padding: '30px', borderRadius: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' },
    closeBtn: { background: 'none', border: 'none', color: '#666', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s' },
    summary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '6px', marginBottom: '20px', color: '#ccc' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { color: '#888', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' },
    input: { padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: '#fff', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' },
    select: { padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: '#fff', fontSize: '1rem', outline: 'none', cursor: 'pointer' },
    submitBtn: { padding: '15px', marginTop: '20px', borderRadius: '6px', border: 'none', background: 'linear-gradient(45deg, #d50000, #b71c1c)', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', letterSpacing: '1px', boxShadow: '0 4px 15px rgba(213, 0, 0, 0.3)', transition: 'transform 0.2s' },
    successBtn: { padding: '12px 30px', borderRadius: '50px', border: '2px solid #00e676', background: 'transparent', color: '#00e676', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s' }
};

export default OrderModal;