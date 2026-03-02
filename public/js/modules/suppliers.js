import { API_BASE } from '../app.js';

const suppliers = {
    async render(container) {
        container.innerHTML = `
            <div class="module-wrapper">
                <div class="module-header d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 class="h3 font-weight-bold">Proveedores</h1>
                        <p class="text-muted">Gestión de laboratorios y distribuidores</p>
                    </div>
                    <button id="btn-add-supplier" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Nuevo Proveedor
                    </button>
                </div>

                <div class="card">
                    <div class="card-body">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Contacto</th>
                                    <th>Teléfono / Email</th>
                                    <th>Productos</th>
                                    <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="suppliers-list">
                                <!-- Loaded dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
            </div>

            <div id="modal-container"></div>

            <style>
                .module-wrapper { padding: 1.5rem; }
                .table { width: 100%; border-collapse: collapse; }
                .table th { text-align: left; padding: 1rem; border-bottom: 2px solid #edf2f7; color: #718096; font-size: 0.8rem; }
                .table td { padding: 1rem; border-bottom: 1px solid #edf2f7; }
            </style>
        `;

        await this.loadSuppliers();
        this.attachEvents();
    },

    attachEvents() {
        document.getElementById('btn-add-supplier').addEventListener('click', () => this.showSupplierForm());
    },

    async loadSuppliers() {
        const list = document.getElementById('suppliers-list');
        try {
            const resp = await fetch(`${API_BASE}/suppliers`);
            const data = await resp.json();

            if (data.length === 0) {
                list.innerHTML = '<tr><td colspan="5" class="text-center py-4">No hay proveedores registrados</td></tr>';
                return;
            }

            list.innerHTML = data.map(s => `
                <tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.contact || '-'}</td>
                    <td>
                        <div class="small">
                            <i class="fas fa-phone fa-fw"></i> ${s.phone || 'N/A'}<br>
                            <i class="fas fa-envelope fa-fw"></i> ${s.email || 'N/A'}
                        </div>
                    </td>
                    <td><span class="text-muted small">${s.products || '-'}</span></td>
                    <td>
                        <button class="btn-icon"><i class="fas fa-edit"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            list.innerHTML = '<tr><td colspan="5">Error al cargar proveedores</td></tr>';
        }
    },

    async showSupplierForm() {
        const container = document.createElement('div');
        container.id = 'supplier-modal-container';
        document.body.appendChild(container);

        container.innerHTML = `
            <div class="custom-modal-backdrop">
                <div class="custom-modal">
                    <h3 class="mb-4">Nuevo Proveedor</h3>
                    <form id="supplier-form">
                        <div class="form-group mb-4">
                            <label>Nombre del Proveedor*</label>
                            <input type="text" name="name" class="form-control" placeholder="Ej: Distribuidora Vet..." required>
                        </div>
                        <div class="form-group mb-4">
                            <label>Persona de Contacto</label>
                            <input type="text" name="contact" class="form-control" placeholder="Ej: Juan Gomez">
                        </div>
                        <div class="row mb-4">
                            <div class="col">
                                <label>Teléfono</label>
                                <input type="text" name="phone" class="form-control">
                            </div>
                            <div class="col">
                                <label>Email</label>
                                <input type="email" name="email" class="form-control">
                            </div>
                        </div>
                        <div class="form-group mb-5">
                            <label>Productos que suministra</label>
                            <textarea name="products" class="form-control" rows="2" placeholder="Ej: Vacunas, Alimento Balanceado..."></textarea>
                        </div>
                        <div class="d-flex justify-content-end gap-3 mt-2">
                            <button type="button" class="btn btn-link py-2" onclick="document.getElementById('supplier-modal-container').remove()">Cancelar</button>
                            <button type="submit" class="btn btn-primary px-4 py-2 font-weight-bold">Guardar Proveedor</button>
                        </div>
                    </form>
                </div>
            </div>
            <style>
                .custom-modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .custom-modal { background: white; padding: 2.5rem; border-radius: 16px; width: 500px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); }
                .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.85rem; color: #4a5568; }
                .form-control { width: 100%; padding: 0.8rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 0.95rem; }
                .form-control:focus { border-color: #4e73df; outline: none; box-shadow: 0 0 0 3px rgba(78, 115, 223, 0.1); }
                .row { display: flex; margin: 0 -8px; }
                .col { flex: 1; padding: 0 8px; }
                .mb-4 { margin-bottom: 1.5rem !important; }
                .mb-5 { margin-bottom: 2.5rem !important; }
                .gap-3 { gap: 1rem; }
                .font-weight-bold { font-weight: 600; }
            </style>
        `;

        document.getElementById('supplier-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const resp = await fetch(`${API_BASE}/suppliers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (resp.ok) {
                    container.remove();
                    this.loadSuppliers();
                }
            } catch (err) { alert(err.message); }
        });
    }
};

export default suppliers;
