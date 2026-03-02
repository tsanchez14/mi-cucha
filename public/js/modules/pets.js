import { API_BASE } from '../app.js';

const pets = {
    async render(container) {
        container.innerHTML = `
            <div class="module-wrapper">
                <div class="module-header d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 class="h3 font-weight-bold">Mascotas y Dueños</h1>
                        <p class="text-muted">Gestiona el registro de pacientes y sus propietarios</p>
                    </div>
                    <button id="btn-add-owner" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Nuevo Registro
                    </button>
                </div>

                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <div class="search-container" style="width: 100%;">
                                    <i class="fas fa-search"></i>
                                    <input type="text" id="owner-search" placeholder="Buscar por nombre de dueño o mascota...">
                                </div>
                            </div>
                            <div class="col-md-4 text-end">
                                <span id="results-count" class="text-muted small">Cargando...</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="owners-list" class="owners-grid">
                    <!-- Owners will be loaded here -->
                </div>
            </div>

            <div id="modal-container"></div>

            <style>
                .module-wrapper { padding: 1.5rem; }
                .owners-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                }
                .owner-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    border: 1px solid #edf2f7;
                    transition: transform 0.2s;
                }
                .owner-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .owner-info-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }
                .owner-name { font-weight: 700; font-size: 1.125rem; }
                .pet-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    background: #f0f4ff;
                    color: #4e73df;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    margin-right: 5px;
                    margin-bottom: 5px;
                }
                .owner-contacts {
                    font-size: 0.875rem;
                    color: #718096;
                    margin: 1rem 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .owner-actions {
                    border-top: 1px solid #edf2f7;
                    padding-top: 1rem;
                    display: flex;
                    gap: 0.5rem;
                }
                .mb-4 { margin-bottom: 1.5rem; }
                .d-flex { display: flex; }
                .justify-content-between { justify-content: space-between; }
                .align-items-center { align-items: center; }
                .row { display: flex; flex-wrap: wrap; margin: 0 -15px; }
                .col-md-8 { flex: 0 0 66.666%; padding: 0 15px; }
                .col-md-4 { flex: 0 0 33.333%; padding: 0 15px; }
            </style>
        `;

        this.attachEvents();
        await this.loadOwners();
    },

    attachEvents() {
        const searchInput = document.getElementById('owner-search');
        searchInput.addEventListener('input', (e) => {
            this.loadOwners(e.target.value);
        });

        document.getElementById('btn-add-owner').addEventListener('click', () => {
            this.showOwnerForm();
        });
    },

    async loadOwners(search = '') {
        const listContainer = document.getElementById('owners-list');
        const countLabel = document.getElementById('results-count');

        try {
            const resp = await fetch(`${API_BASE}/owners?search=${search}`);
            const owners = await resp.json();

            countLabel.textContent = `${owners.length} dueños encontrados`;

            if (owners.length === 0) {
                listContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;">No se encontraron resultados</div>';
                return;
            }

            // Load pets for each owner concurrently
            const ownersWithPets = await Promise.all(owners.map(async owner => {
                const petResp = await fetch(`${API_BASE}/owners/${owner.id}/pets`);
                owner.pets = await petResp.json();
                return owner;
            }));

            listContainer.innerHTML = ownersWithPets.map(owner => `
                <div class="owner-card">
                    <div class="owner-info-header">
                        <div class="owner-name">${owner.name}</div>
                        <button class="btn-icon" onclick="window.petsModule.editOwner(${owner.id})"><i class="fas fa-edit"></i></button>
                    </div>
                    <div class="owner-contacts">
                        <span><i class="fas fa-phone fa-fw me-2"></i> ${owner.phone || 'N/A'}</span>
                        <span><i class="fas fa-envelope fa-fw me-2"></i> ${owner.email || 'N/A'}</span>
                    </div>
                    <div class="pets-list">
                        ${owner.pets.map(pet => `
                            <span class="pet-tag">
                                <i class="fas fa-${this.getSpeciesIcon(pet.species)}"></i> ${pet.name}
                            </span>
                        `).join('')}
                    </div>
                    <div class="owner-actions">
                        <button class="btn btn-sm btn-link" onclick="window.petsModule.addPet(${owner.id})">
                            <i class="fas fa-plus"></i> Añadir Mascota
                        </button>
                        <button class="btn btn-sm btn-link" onclick="window.petsModule.viewDetails(${owner.id})">
                            Ver Detalles
                        </button>
                    </div>
                </div>
            `).join('');

            // Export to window for global access (hack for simple demos)
            window.petsModule = this;

        } catch (error) {
            listContainer.innerHTML = `Error: ${error.message}`;
        }
    },

    getSpeciesIcon(species) {
        if (!species) return 'paw';
        species = species.toLowerCase();
        if (species.includes('perro') || species.includes('can')) return 'dog';
        if (species.includes('gato') || species.includes('fel')) return 'cat';
        if (species.includes('pajaro') || species.includes('ave')) return 'crow';
        return 'paw';
    },

    showOwnerForm(ownerId = null) {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="custom-modal-backdrop">
                <div class="custom-modal">
                    <h3 class="mb-4">${ownerId ? 'Editar' : 'Nuevo'} Registro</h3>
                    <form id="owner-form">
                        <div class="form-section mb-4">
                            <p class="small font-weight-bold text-primary mb-3">DATOS DEL DUEÑO</p>
                            <div class="form-group mb-3">
                                <label>Nombre Completo*</label>
                                <input type="text" name="name" class="form-control" required>
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <label>Teléfono</label>
                                    <input type="text" name="phone" class="form-control" placeholder="Ej: 1122334455">
                                </div>
                                <div class="col">
                                    <label>Email</label>
                                    <input type="email" name="email" class="form-control" placeholder="nombre@mail.com">
                                </div>
                            </div>
                        </div>
                        
                        ${!ownerId ? `
                        <div class="form-section mb-4">
                            <p class="small font-weight-bold text-primary mb-3">DATOS DE LA MASCOTA</p>
                            <div class="form-group mb-3">
                                <label>Nombre de la Mascota*</label>
                                <input type="text" name="pet_name" class="form-control" required>
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <label>Especie*</label>
                                    <input type="text" name="species" class="form-control" placeholder="Ej: Perro" required>
                                </div>
                                <div class="col">
                                    <label>Raza</label>
                                    <input type="text" name="breed" class="form-control" placeholder="Ej: Labrador">
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <div class="d-flex justify-content-end gap-3 mt-4 pt-2">
                            <button type="button" class="btn btn-link py-2" onclick="document.getElementById('modal-container').innerHTML=''">Cancelar</button>
                            <button type="submit" class="btn btn-primary px-4 py-2 font-weight-bold">Guardar Registro</button>
                        </div>
                    </form>
                </div>
            </div>
            <style>
                .custom-modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .custom-modal { background: white; padding: 2.5rem; border-radius: 20px; width: 550px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid #f1f5f9; }
                .form-group label { display: block; margin-bottom: 0.6rem; font-weight: 600; font-size: 0.85rem; color: #4a5568; }
                .form-control { width: 100%; padding: 0.85rem 1.1rem; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 0.95rem; transition: all 0.2s; }
                .form-control:focus { border-color: #4e73df; outline: none; box-shadow: 0 0 0 3px rgba(78, 115, 223, 0.1); }
                .text-primary { color: #4e73df; font-weight: 700; letter-spacing: 0.025em; }
                .col { flex: 1; padding: 0 8px; }
                .row { margin: 0 -8px; }
                .form-section { border-radius: 12px; background: #f8fafc; padding: 1.5rem; border: 1px solid #f1f5f9; }
                .mb-4 { margin-bottom: 2rem !important; }
                .font-weight-bold { font-weight: 600; }
                .gap-3 { gap: 1rem !important; }
            </style>
        `;

        document.getElementById('owner-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                // 1. Create Owner
                const ownerResp = await fetch(`${API_BASE}/owners`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.name,
                        phone: data.phone,
                        email: data.email,
                        address: data.address || ''
                    })
                });

                if (!ownerResp.ok) throw new Error('Error al crear el dueño');
                const owner = await ownerResp.json();

                // 2. Create Pet (if it's a new registration)
                if (!ownerId && data.pet_name) {
                    const petResp = await fetch(`${API_BASE}/pets`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            owner_id: owner.id,
                            name: data.pet_name,
                            species: data.species,
                            breed: data.breed,
                            age: null,
                            weight: null
                        })
                    });
                    if (!petResp.ok) throw new Error('Dueño creado, pero hubo un error al crear la mascota');
                }

                container.innerHTML = '';
                this.loadOwners();
            } catch (err) { alert(err.message); }
        });
    },

    addPet(ownerId) {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="custom-modal-backdrop">
                <div class="custom-modal">
                    <h3>Nueva Mascota</h3>
                    <form id="pet-form">
                        <input type="hidden" name="owner_id" value="${ownerId}">
                        <div class="form-group mb-3">
                            <label>Nombre de la Mascota*</label>
                            <input type="text" name="name" class="form-control" required>
                        </div>
                        <div class="form-group mb-3">
                            <label>Especie (Perro, Gato, etc.)</label>
                            <input type="text" name="species" class="form-control">
                        </div>
                        <div class="form-group mb-3">
                            <label>Raza</label>
                            <input type="text" name="breed" class="form-control">
                        </div>
                        <div class="form-group mb-3">
                            <label>Edad</label>
                            <input type="number" name="age" class="form-control">
                        </div>
                        <div class="d-flex justify-content-end gap-2">
                            <button type="button" class="btn btn-link" onclick="document.getElementById('modal-container').innerHTML=''">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
            <style>
                .custom-modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .custom-modal { background: white; padding: 2.5rem; border-radius: 20px; width: 480px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
                .form-group label { display: block; margin-bottom: 0.6rem; font-weight: 600; font-size: 0.85rem; color: #4a5568; }
                .form-control { width: 100%; padding: 0.85rem 1.1rem; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 0.95rem; }
                .gap-3 { gap: 1rem !important; }
            </style>
        `;

        document.getElementById('pet-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const resp = await fetch(`${API_BASE}/pets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (resp.ok) {
                    container.innerHTML = '';
                    this.loadOwners();
                }
            } catch (err) { alert(err.message); }
        });
    }
};

export default pets;
