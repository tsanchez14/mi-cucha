import { API_BASE } from '../app.js';

const sales = {
    async render(container) {
        container.innerHTML = `
            <div class="module-header mb-4">
                <h1 class="h3 font-weight-bold">Ventas y Facturación</h1>
                <p class="text-muted">Generación de comprobantes y registro de cobros</p>
            </div>

            <div class="row">
                <div class="col-md-7">
                    <div class="card">
                        <div class="card-header"><h5 class="mb-0">Punto de Venta</h5></div>
                        <div class="card-body">
                            <div class="form-group mb-4">
                                <label class="small font-weight-bold">Buscar Producto/Servicio</label>
                                <div class="input-group">
                                    <input type="text" id="item-search" class="form-control" placeholder="Nombre del producto...">
                                    <button class="btn btn-primary">Buscar</button>
                                </div>
                            </div>
                            
                            <div class="sale-cart">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Cant.</th>
                                            <th>Precio</th>
                                            <th>Subtotal</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody id="cart-list">
                                        <tr><td colspan="5" class="text-center text-muted">No hay items en la venta</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="card">
                        <div class="card-header"><h5 class="mb-0">Resumen de Venta</h5></div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span>Subtotal</span>
                                <span id="cart-subtotal">$0.00</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2 text-success">
                                <span>Descuento</span>
                                <span id="cart-discount">-$0.00</span>
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between mb-4">
                                <h4 class="font-weight-bold">Total</h4>
                                <h4 id="cart-total" class="font-weight-bold">$0.00</h4>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label class="small font-weight-bold">Medio de Pago</label>
                                <select class="form-control">
                                    <option>Efectivo</option>
                                    <option>Transferencia</option>
                                    <option>Tarjeta</option>
                                </select>
                            </div>

                            <button id="btn-complete-sale" class="btn btn-success btn-lg w-100 mt-3" disabled>
                                <i class="fas fa-check-circle"></i> Confirmar Venta
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .sale-cart { min-height: 300px; border: 1px dashed #e2e8f0; border-radius: 8px; padding: 1rem; }
                .form-control { width: 100%; padding: 0.6rem; border: 1px solid #e2e8f0; border-radius: 8px; }
                .input-group { display: flex; gap: 0.5rem; }
                .w-100 { width: 100%; }
                .btn-lg { padding: 1rem; font-size: 1.1rem; }
                .text-success { color: #16a34a; }
            </style>
        `;
    }
};

export default sales;
