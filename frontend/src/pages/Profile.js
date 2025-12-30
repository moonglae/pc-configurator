import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/endpoints';

const Profile = () => {
    const { user } = useAuth();
    
    const [activeTab, setActiveTab] = useState('info');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    // Стан для редагування
    const [isEditing, setIsEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: ''
    });

    // === ГОЛОВНА ЛОГІКА ЗАВАНТАЖЕННЯ ДАНИХ ===
    useEffect(() => {
        const loadUserData = async () => {
            // 1. Спочатку беремо те, що є в контексті (миттєве відображення)
            let currentName = '';
            let currentEmail = '';

            if (user) {
                currentName = user.name || user.username || user.login || '';
                // Перевіряємо всі можливі поля, де може бути пошта
                currentEmail = user.email || user.mail || user.user_email || (user.data && user.data.email) || '';
            }

            // Оновлюємо форму базовими даними
            setProfileForm(prev => ({
                name: currentName || prev.name,
                email: currentEmail || prev.email
            }));

            // 2. Якщо пошти немає в контексті, пробуємо завантажити свіжий профіль з сервера
            if (user && !currentEmail) {
                try {
                    // Спробуємо отримати дані з ендпоінту профілю (зазвичай це /auth/me або /users/profile)
                    // Якщо у вас інший шлях, змініть його тут
                    const response = await api.get('/auth/me'); 
                    const serverData = response.data;

                    if (serverData) {
                        setProfileForm({
                            name: serverData.name || currentName,
                            email: serverData.email || '' 
                        });
                        console.log("✅ Профіль завантажено з сервера:", serverData);
                    }
                } catch (err) {
                    // Ігноруємо помилку, якщо ендпоінт не існує, щоб не лякати юзера
                    console.log("⚠️ Не вдалося дозавантажити деталі профілю (можливо, ендпоінт відрізняється)", err);
                }
            }
        };

        loadUserData();
    }, [user]);

    // === Замовлення ===
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'orders') fetchOrders();
    }, [activeTab]);

    const fetchOrders = async () => {
        setOrdersLoading(true);
        setError('');
        try {
            const response = await api.get('/orders/my');
            setOrders(response.data || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Помилка при завантаженні замовлень');
        } finally {
            setOrdersLoading(false);
        }
    };

    // === Зміна пароля ===
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setError('Всі поля обов\'язкові');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('Новий пароль не співпадає з підтвердженням');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setError('Новий пароль має бути мінімум 6 символів');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/change-password', {
                current_password: passwordForm.currentPassword,
                new_password: passwordForm.newPassword
            });
            setMessage('✅ Пароль успішно змінено!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Помилка при зміні пароля');
        } finally {
            setIsLoading(false);
        }
    };

    // === Оновлення профілю ===
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        try {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(profileForm.email)) {
                throw new Error("Введіть коректний Email");
            }

            await api.put('/auth/update-profile', { 
                name: profileForm.name,
                email: profileForm.email 
            });

            setMessage('✅ Профіль успішно оновлено!');
            setIsEditing(false);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Помилка при оновленні профілю');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>👤 ПРОФІЛЬ КОРИСТУВАЧА</h1>
            </div>

            <div style={styles.tabsContainer}>
                <button
                    style={{...styles.tabBtn, ...( activeTab === 'info' && styles.activeTab)}}
                    onClick={() => { setActiveTab('info'); setMessage(''); setError(''); setIsEditing(false); }}
                >
                    ℹ️ ІНФОРМАЦІЯ
                </button>
                <button
                    style={{...styles.tabBtn, ...( activeTab === 'password' && styles.activeTab)}}
                    onClick={() => { setActiveTab('password'); setMessage(''); setError(''); }}
                >
                    🔐 ЗМІНИТИ ПАРОЛЬ
                </button>
                <button
                    style={{...styles.tabBtn, ...( activeTab === 'orders' && styles.activeTab)}}
                    onClick={() => { setActiveTab('orders'); setMessage(''); setError(''); }}
                >
                    📦 МОЇ ЗАМОВЛЕННЯ
                </button>
            </div>

            <div style={styles.content}>
                
                {/* ВКЛАДКА ІНФОРМАЦІЯ */}
                {activeTab === 'info' && (
                    <div className="glass-panel" style={styles.panel}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
                            <h2 style={{...styles.panelTitle, marginBottom: 0}}>ІНФОРМАЦІЯ ПРО КОРИСТУВАЧА</h2>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
                                    ✏️ РЕДАГУВАТИ
                                </button>
                            )}
                        </div>

                        {message && <div style={styles.successMessage}>{message}</div>}
                        {error && <div style={styles.errorMessage}>{error}</div>}

                        {!isEditing ? (
                            <div style={styles.infoGrid}>
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>Ім'я:</span>
                                    <span style={styles.value}>{profileForm.name || 'Не вказано'}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>Email:</span>
                                    <span style={styles.value}>
                                        {profileForm.email ? profileForm.email : <span style={{color: '#888', fontStyle: 'italic'}}>Не вказано (Додайте Email)</span>}
                                    </span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.label}>Статус:</span>
                                    <span style={{...styles.value, color: '#00e676'}}>✓ Активний користувач</span>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdateProfile} style={styles.form}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Ваше Ім'я:</label>
                                    <input
                                        type="text"
                                        value={profileForm.name}
                                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                                        style={styles.input}
                                        placeholder="Введіть ім'я"
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Ваш Email:</label>
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                                        style={styles.input}
                                        placeholder="example@mail.com"
                                    />
                                </div>
                                <div style={{display: 'flex', gap: '15px', marginTop: '10px'}}>
                                    <button type="submit" style={{...styles.submitBtn, flex: 1}} disabled={isLoading}>
                                        {isLoading ? 'ЗБЕРЕЖЕННЯ...' : '💾 ЗБЕРЕГТИ ЗМІНИ'}
                                    </button>
                                    <button type="button" onClick={() => { setIsEditing(false); setError(''); }} style={styles.cancelBtn} disabled={isLoading}>
                                        СКАСУВАТИ
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* ВКЛАДКА ПАРОЛЬ */}
                {activeTab === 'password' && (
                    <div className="glass-panel" style={styles.panel}>
                        <h2 style={styles.panelTitle}>ЗМІНИТИ ПАРОЛЬ</h2>
                        <form onSubmit={handlePasswordChange} style={styles.form}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Поточний пароль:</label>
                                <input type="password" placeholder="••••••••" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} style={styles.input} required />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Новий пароль:</label>
                                <input type="password" placeholder="••••••••" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} style={styles.input} required />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Підтвердіть новий пароль:</label>
                                <input type="password" placeholder="••••••••" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} style={styles.input} required />
                            </div>
                            {message && <div style={styles.successMessage}>{message}</div>}
                            {error && <div style={styles.errorMessage}>{error}</div>}
                            <button type="submit" disabled={isLoading} style={{...styles.submitBtn, opacity: isLoading ? 0.5 : 1}}>
                                {isLoading ? 'ОБРОБКА...' : 'ЗМІНИТИ ПАРОЛЬ'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ВКЛАДКА ЗАМОВЛЕННЯ */}
                {activeTab === 'orders' && (
                    <div className="glass-panel" style={styles.panel}>
                        <h2 style={styles.panelTitle}>МОЇ ЗАМОВЛЕННЯ</h2>
                        {ordersLoading && <div style={styles.loading}>ЗАВАНТАЖЕННЯ...</div>}
                        {error && <div style={styles.errorMessage}>{error}</div>}
                        {!ordersLoading && orders.length === 0 && (
                            <div style={styles.emptyState}>
                                <p style={{ fontSize: '1.2rem', color: '#888' }}>НЕМАЄ ЗАМОВЛЕНЬ</p>
                                <p style={{ color: '#666', marginTop: '10px' }}>Поки що ви не розмістили жодного замовлення.</p>
                            </div>
                        )}
                        {!ordersLoading && orders.length > 0 && (
                            <div style={styles.ordersList}>
                                {orders.map((order) => (
                                    <div key={order.id} style={styles.orderCard}>
                                        <div style={styles.orderHeader}>
                                            <div>
                                                <h4 style={styles.orderTitle}>Замовлення #{order.id}</h4>
                                                <p style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('uk-UA')}</p>
                                            </div>
                                            <div style={{ padding: '8px 16px', background: getStatusColor(order.status), borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                {getStatusLabel(order.status)}
                                            </div>
                                        </div>
                                        <div style={styles.orderDetails}>
                                            <div style={styles.detailRow}>
                                                <div>
                                                    <span style={styles.detailLabel}>Компоненти:</span>
                                                    <div style={styles.componentNames}>
                                                        {order.component_names && order.component_names.length > 0 ? order.component_names.join(', ') : (order.component_count || 'N/A')}
                                                    </div>
                                                </div>
                                                <span style={styles.detailValue}>{order.component_count || 'N/A'}</span>
                                            </div>
                                            <div style={styles.detailRow}>
                                                <span style={styles.detailLabel}>Сума:</span>
                                                <span style={{...styles.detailValue, color: '#ff1744', fontWeight: 'bold'}}>{order.total_price || '0'} ₴</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Допоміжні функції та стилі
const getStatusColor = (status) => {
    const colors = {
        'pending': 'rgba(255, 193, 7, 0.2)',
        'processing': 'rgba(33, 150, 243, 0.2)',
        'shipped': 'rgba(76, 175, 80, 0.2)',
        'delivered': 'rgba(0, 230, 118, 0.2)',
        'cancelled': 'rgba(244, 67, 54, 0.2)'
    };
    return colors[status] || colors['pending'];
};

const getStatusLabel = (status) => {
    const labels = {
        'pending': '⏳ ОЧІКУВАННЯ',
        'processing': '⚙️ ОБРОБКА',
        'shipped': '📦 ВІДПРАВЛЕНО',
        'delivered': '✅ ДОСТАВЛЕНО',
        'cancelled': '❌ СКАСОВАНО'
    };
    return labels[status] || 'НЕВІДОМО';
};

const styles = {
    container: { minHeight: '100vh', padding: '40px 20px', paddingBottom: '60px' },
    header: { maxWidth: '1200px', margin: '0 auto 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' },
    title: { fontFamily: "'Orbitron', sans-serif", fontSize: '2rem', color: '#fff', margin: 0, letterSpacing: '2px' },
    logoutBtn: { padding: '12px 24px', background: 'rgba(244, 67, 54, 0.8)', border: '1px solid rgba(244, 67, 54, 0.5)', color: '#fff', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.3s ease', letterSpacing: '1px' },
    editBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #4caf50', color: '#4caf50', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.3s ease' },
    cancelBtn: { padding: '15px', background: 'transparent', border: '1px solid #666', borderRadius: '4px', color: '#ccc', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', flex: 1 },
    tabsContainer: { maxWidth: '1200px', margin: '0 auto 30px', display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '2px solid rgba(213, 0, 0, 0.3)', paddingBottom: '15px' },
    tabBtn: { padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ccc', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.3s ease', letterSpacing: '1px' },
    activeTab: { background: '#d50000', border: '1px solid #d50000', color: '#fff', boxShadow: '0 0 15px rgba(213, 0, 0, 0.5)' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    panel: { padding: '40px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(10, 10, 10, 0.6)' },
    panelTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: '1.5rem', color: '#fff', marginTop: 0, marginBottom: '30px', letterSpacing: '1.5px' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '20px' },
    infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(50, 50, 50, 0.3)', borderRadius: '4px', borderLeft: '3px solid #d50000' },
    label: { color: '#d50000', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px' },
    value: { color: '#e0e0e0', fontSize: '1rem', fontFamily: "'Montserrat', sans-serif" },
    form: { display: 'flex', flexDirection: 'column', gap: '25px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { padding: '14px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', transition: 'border 0.3s ease' },
    submitBtn: { padding: '15px', background: '#d50000', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', letterSpacing: '1.5px', transition: 'all 0.3s ease', boxShadow: '0 0 15px rgba(213, 0, 0, 0.3)' },
    successMessage: { padding: '15px', background: 'rgba(0, 230, 118, 0.15)', border: '1px solid rgba(0, 230, 118, 0.3)', borderRadius: '4px', color: '#00e676', fontSize: '0.95rem', textAlign: 'center', marginBottom: '20px' },
    errorMessage: { padding: '15px', background: 'rgba(244, 67, 54, 0.15)', border: '1px solid rgba(244, 67, 54, 0.3)', borderRadius: '4px', color: '#ff6b6b', fontSize: '0.95rem', textAlign: 'center', marginBottom: '20px' },
    loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '1.1rem', letterSpacing: '2px' },
    emptyState: { textAlign: 'center', padding: '60px 40px' },
    ordersList: { display: 'grid', gridTemplateColumns: '1fr', gap: '20px' },
    orderCard: { padding: '20px', background: 'rgba(50, 50, 50, 0.2)', border: '1px solid rgba(213, 0, 0, 0.2)', borderRadius: '6px', transition: 'all 0.3s ease' },
    orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
    orderTitle: { margin: '0 0 5px', color: '#fff', fontSize: '1.1rem', fontFamily: "'Orbitron', sans-serif", fontWeight: 'bold' },
    orderDate: { margin: 0, color: '#888', fontSize: '0.85rem' },
    orderDetails: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { color: '#d50000', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.5px' },
    detailValue: { color: '#e0e0e0', fontSize: '0.95rem' }
};

export default Profile;