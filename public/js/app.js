// Main App Router and State Management

const API_BASE = '/api';

const app = {
    modules: {},
    currentModule: null,

    async init() {
        this.container = document.getElementById('module-container');
        this.navItems = document.querySelectorAll('.nav-item');

        this.initRouter();
        this.loadModuleFromHash();

        console.log('App initialized');
    },

    initRouter() {
        window.addEventListener('hashchange', () => this.loadModuleFromHash());

        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const module = item.dataset.module;
                // Sidebar active state handled here if needed, or by hashchange
            });
        });
    },

    async loadModuleFromHash() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        this.setActiveNavItem(hash);

        // Show loader
        this.container.innerHTML = `
            <div class="loader-container">
                <div class="loader"></div>
            </div>
        `;

        try {
            const moduleName = hash;
            if (!this.modules[moduleName]) {
                const module = await import(`./modules/${moduleName}.js?v=${new Date().getTime()}`);
                this.modules[moduleName] = module.default;
            }

            this.currentModule = this.modules[moduleName];
            await this.currentModule.render(this.container);
        } catch (error) {
            console.error('Error loading module:', error);
            this.container.innerHTML = `<div class="error-msg">Error al cargar el módulo: ${hash}</div>`;
        }
    },

    setActiveNavItem(hash) {
        this.navItems.forEach(item => {
            if (item.dataset.module === hash) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());

export default app;
export { API_BASE };
