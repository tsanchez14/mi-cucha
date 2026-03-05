import { API_BASE } from '../app.js';

const stock = {
    async render(container) {
        console.log('Rendering Stock Module v1.3');
        container.innerHTML = `
            <div class="module-wrapper">
                <div class="module-header d-flex justify-content-between align-items-center mb-1">
                    <div>
                        <h1 class="h3 font-weight-bold">Control de Stock</h1>
                        <p class="text-muted">Inventario de productos y suministros</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button id="btn-add-product" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Nuevo Producto
                        </button>
                    </div>
                </div>

                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card p-3 text-center">
                            <span class="text-muted small">Total Productos</span>
                            <h4 id="total-products" class="mb-0">-</h4>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card p-3 text-center border-danger-light">
                            <span class="text-danger small">Stock Bajo</span>
                            <h4 id="low-stock-count" class="text-danger mb-0">-</h4>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Stock</th>
                                    <th>Precio Venta</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="products-list">
                                <!-- Loaded dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="modal-container"></div>

            <style>
                .module-wrapper { padding: 0.25rem 0.5rem; }
                .border-danger-light { border: 1px solid #fee2e2; background: #fef2f2; }
                .text-danger { color: #dc2626; }
                .table { width: 100%; border-collapse: collapse; }
                .table th { text-align: left; padding: 1rem; border-bottom: 2px solid #edf2f7; color: #718096; font-size: 0.8rem; }
                .table td { padding: 1rem; border-bottom: 1px solid #edf2f7; }
                .badge-stock { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
                .badge-low { background: #fef2f2; color: #dc2626; }
                .badge-ok { background: #f0fdf4; color: #16a34a; }
            </style>
        `;

        await this.loadProducts();
        this.attachEvents();
    },

    attachEvents() {
        document.getElementById('btn-add-product').addEventListener('click', () => this.showProductForm());
    },

    async loadProducts() {
        const list = document.getElementById('products-list');
        try {
            const resp = await fetch(`${API_BASE}/products`);
            const products = await resp.json();

            document.getElementById('total-products').textContent = products.length;
            const lowStock = products.filter(p => p.stock <= p.min_stock);
            document.getElementById('low-stock-count').textContent = lowStock.length;

            list.innerHTML = products.map(p => `
                <tr>
                    <td><strong>${p.name}</strong><br><small class="text-muted">${p.unit}</small></td>
                    <td>${p.category || 'Gral'}</td>
                    <td>${p.stock}</td>
                    <td>$${p.sell_price}</td>
                    <td>
                        <span class="badge-stock ${p.stock <= p.min_stock ? 'badge-low' : 'badge-ok'}">
                            ${p.stock <= p.min_stock ? 'Stock Bajo' : 'Normal'}
                        </span>
                    </td>
                    <td class="text-end pe-3">
                        <div class="dropdown-actions">
                            <button class="btn-dots" onclick="window.stockModule.toggleActions(${p.id})">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div id="menu-${p.id}" class="dropdown-menu-custom text-start">
                                <button class="dropdown-item-custom" onclick="window.stockModule.editProduct(${p.id})">Editar</button>
                                <button class="dropdown-item-custom danger" onclick="window.stockModule.deleteProduct(${p.id})">Eliminar</button>
                            </div>
                        </div>
                    </td>
                </tr>
            `).join('');

            window.stockModule = this;
        } catch (e) {
            list.innerHTML = '<tr><td colspan="6">Error al cargar productos</td></tr>';
        }
    },


    toggleActions(id) {
        const menu = document.getElementById(`menu-${id}`);
        const allMenus = document.getElementsByClassName('dropdown-menu-custom');
        for (let m of allMenus) {
            if (m.id !== `menu-${id}`) m.classList.remove('show');
        }
        menu.classList.toggle('show');
    },

    async editProduct(id) {
        try {
            const resp = await fetch(`${API_BASE}/products`);
            const products = await resp.json();
            const product = products.find(p => p.id === id);
            if (product) {
                this.editingId = id;
                this.showProductForm(product);
            }
        } catch (err) { alert(err.message); }
    },

    async deleteProduct(id) {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            const resp = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
            if (resp.ok) this.loadProducts();
            else alert('Error al eliminar');
        } catch (err) { alert(err.message); }
    },

    async showProductForm(productToEdit = null) {
        const container = document.createElement('div');
        container.id = 'product-modal-container';
        document.body.appendChild(container);

        try {
            const resp = await fetch(`${API_BASE}/suppliers`);
            const suppliers = await resp.json();

            container.innerHTML = `
                <div class="custom-modal-backdrop">
                    <div class="custom-modal">
                        <h3 class="mb-4">${productToEdit ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                        <form id="product-form" autocomplete="off">
                            <div class="form-group mb-3">
                                <label>Nombre del Producto*</label>
                                <input type="text" name="name" class="form-control" placeholder="Ej: Amoxicilina 500mg" value="${productToEdit ? productToEdit.name : ''}" required>
                            </div>
                            <div class="row mb-3">
                                <div class="col-7">
                                    <label>Categoría</label>
                                    <input type="text" name="category" class="form-control" placeholder="Ej: Medicamento" value="${productToEdit ? (productToEdit.category || '') : ''}">
                                </div>
                                <div class="col-5">
                                    <label>Unidad</label>
                                    <input type="text" name="unit" class="form-control" placeholder="Ej: ml, comp, kg" value="${productToEdit ? (productToEdit.unit || '') : ''}">
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <label>Stock Inicial</label>
                                    <input type="number" name="stock" class="form-control" value="${productToEdit ? productToEdit.stock : '0'}">
                                </div>
                                <div class="col">
                                    <label>Stock Mínimo</label>
                                    <input type="number" name="min_stock" class="form-control" value="${productToEdit ? productToEdit.min_stock : '5'}">
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <label>Precio Costo ($)</label>
                                    <input type="number" step="0.01" name="cost_price" class="form-control" value="${productToEdit ? (productToEdit.cost_price || '') : ''}">
                                </div>
                                <div class="col">
                                    <label>Precio Venta ($)</label>
                                    <input type="number" step="0.01" name="sell_price" class="form-control" value="${productToEdit ? (productToEdit.sell_price || '') : ''}">
                                </div>
                            </div>
                            <div class="form-group mb-4">
                                <label>Proveedor</label>
                                <select name="supplier_id" class="form-control">
                                    <option value="">Seleccionar proveedor...</option>
                                    ${suppliers.map(s => `<option value="${s.id}" ${productToEdit && productToEdit.supplier_id == s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="d-flex justify-content-end gap-2 mt-2">
                                <button type="button" class="btn btn-link py-1 text-decoration-none" onclick="document.getElementById('product-modal-container').remove()">Cancelar</button>
                                <button type="submit" class="btn btn-primary px-3 py-2 font-weight-bold">${productToEdit ? 'Actualizar Producto' : 'Guardar Producto'}</button>
                            </div>
                        </form>
                    </div>
                </div>
                <style>
                    .custom-modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                    .custom-modal { background: white; padding: 1.75rem; border-radius: 16px; width: 440px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); }
                    .form-group label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.8rem; color: #4a5568; }
                    .form-control { width: 100%; padding: 0.7rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 0.9rem; }
                    .form-control:focus { border-color: #4e73df; outline: none; box-shadow: 0 0 0 3px rgba(78, 115, 223, 0.1); }
                    .row { display: flex; margin: 0 -8px; }
                    .col { flex: 1; padding: 0 8px; }
                    .mb-4 { margin-bottom: 1.5rem !important; }
                    .mb-5 { margin-bottom: 2.5rem !important; }
                    .gap-3 { gap: 1rem; }
                    .font-weight-bold { font-weight: 600; }
                </style>
            `;

            document.getElementById('product-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                try {
                    const url = this.editingId ? `${API_BASE}/products/${this.editingId}` : `${API_BASE}/products`;
                    const method = this.editingId ? 'PUT' : 'POST';
                    const resp = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    if (resp.ok) {
                        container.remove();
                        this.editingId = null;
                        this.loadProducts();
                    }
                } catch (err) { alert(err.message); }
            });

        } catch (e) { alert("Error: " + e.message); }
    }
};

export default stock;
