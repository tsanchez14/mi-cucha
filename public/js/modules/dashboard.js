import { API_BASE } from '../app.js';

const dashboard = {
    async render(container) {
        const stats = await this.fetchStats();

        container.innerHTML = `
            <div class="dashboard-header mb-4">
                <h1 class="h3 font-weight-bold">Resumen de Hoy</h1>
                <p class="text-muted">Bienvenido al sistema Veterasky</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon bg-primary-light text-primary">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Turnos de Hoy</span>
                        <span class="stat-value">${stats.appointmentsToday}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-warning-light text-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Stock Bajo</span>
                        <span class="stat-value">${stats.lowStockItems}</span>
                    </div>
                    <style>
                        .bg-warning-light { background-color: #fff9db; }
                        .text-warning { color: #fcc419; }
                    </style>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-success-light text-success">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Ventas del Día</span>
                        <span class="stat-value">$${stats.salesToday}</span>
                    </div>
                    <style>
                        .bg-success-light { background-color: #ebfbee; }
                        .text-success { color: #40c057; }
                        .bg-primary-light { background-color: #e7f5ff; }
                    </style>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Turnos de Hoy</h5>
                            <a href="#appointments" class="btn btn-sm btn-link">Ver todos</a>
                        </div>
                        <div class="card-body">
                            ${this.renderAppointmentsList(stats.todayAppointmentsList)}
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Alertas de Stock</h5>
                        </div>
                        <div class="card-body">
                            ${this.renderStockAlerts(stats.lowStockList)}
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                }
                .stat-info {
                    display: flex;
                    flex-direction: column;
                }
                .stat-label {
                    font-size: 0.875rem;
                    color: #718096;
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #2d3748;
                }
                .list-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid #edf2f7;
                }
                .list-item:last-child { border-bottom: none; }
                .item-main { flex: 1; }
                .item-title { font-weight: 600; font-size: 0.9375rem; }
                .item-sub { font-size: 0.8125rem; color: #718096; }
                .badge-time { background: #edf2f7; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
                .stock-alert { color: #e53e3e; font-weight: 600; font-size: 0.8125rem; }
            </style>
        `;
    },

    async fetchStats() {
        // Mocking for now until specific dashboard endpoints are ready
        // In real app, we would have a /api/dashboard endpoint
        try {
            const [aptResp, prodResp] = await Promise.all([
                fetch(`${API_BASE}/appointments`),
                fetch(`${API_BASE}/products/low-stock`)
            ]);

            const appointments = await aptResp.json();
            const lowStockList = await prodResp.json();

            const todayStr = new Date().toISOString().split('T')[0];
            const todayAppointments = appointments.filter(a => a.date === todayStr);

            return {
                appointmentsToday: todayAppointments.length,
                lowStockItems: lowStockList.length,
                salesToday: 0, // Placeholder
                todayAppointmentsList: todayAppointments,
                lowStockList: lowStockList
            };
        } catch (e) {
            return {
                appointmentsToday: 0,
                lowStockItems: 0,
                salesToday: 0,
                todayAppointmentsList: [],
                lowStockList: []
            };
        }
    },

    renderAppointmentsList(list) {
        if (list.length === 0) return '<p class="text-muted text-center py-3">No hay turnos para hoy</p>';
        return list.map(apt => `
            <div class="list-item">
                <div class="badge-time">${apt.time}</div>
                <div class="item-main">
                    <div class="item-title">${apt.pet_name} (${apt.owner_name})</div>
                    <div class="item-sub">${apt.reason}</div>
                </div>
                <div class="item-action">
                    <button class="btn-icon"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        `).join('');
    },

    renderStockAlerts(list) {
        if (list.length === 0) return '<p class="text-muted text-center py-3">Stock en niveles normales</p>';
        return list.map(item => `
            <div class="list-item">
                <div class="item-main">
                    <div class="item-title">${item.name}</div>
                    <div class="item-sub">Quedan: ${item.stock} ${item.unit}</div>
                </div>
                <div class="stock-alert">Bajo!</div>
            </div>
        `).join('');
    }
};

export default dashboard;
