document.addEventListener('DOMContentLoaded', () => {
    verificarProteccionRutas();
    initAuth();
    initPerfil();
    initDashboard();
    initLogout();
});

const API_URL = 'http://localhost:3000';

function verificarProteccionRutas() {
    const estaEnRaiz = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');

    if (!estaEnRaiz && !usuarioLogueado) {
        window.location.href = '../index.html';
    }
}

function initAuth() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            fetch(`${API_URL}/usuarios`)
                .then(res => res.json())
                .then(usuarios => {
                    const usuarioValido = usuarios.find(u => u.correo === email && u.contrasena === password);
                    
                    if (usuarioValido) {
                        localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioValido));
                        window.location.href = 'vistas/dashboard.html';
                    } else {
                        alert('Credenciales incorrectas. Intenta de nuevo.');
                    }
                })
                .catch(err => console.error('Error al conectar con la base de datos:', err));
        });
    }

    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('regNombre').value.trim();
            const apellido = document.getElementById('regApellido').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden.');
                return;
            }

            fetch(`${API_URL}/usuarios`)
                .then(res => res.json())
                .then(usuarios => {
                    const existeUsuario = usuarios.some(u => u.correo === email);
                    
                    if (existeUsuario) {
                        alert('Este correo electrónico ya se encuentra registrado.');
                        return;
                    }

                    const nuevoUsuario = {
                        nombre: `${nombre} ${apellido}`,
                        correo: email,
                        contrasena: password
                    };

                    return fetch(`${API_URL}/usuarios`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(nuevoUsuario)
                    });
                })
                .then(res => {
                    if (!res) return;
                    if (!res.ok) throw new Error('No se pudo registrar el usuario.');
                    alert('Usuario registrado con éxito en el sistema.');
                    location.reload();
                })
                .catch(err => alert(err.message));
        });
    }
}

function initPerfil() {
    const perfilForm = document.getElementById('perfilForm');
    if (!perfilForm) return; 

    const btnEditar = document.getElementById('btnEditar');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnCancelar = document.getElementById('btnCancelar');
    const inputs = document.querySelectorAll('#perfilForm input:not([disabled])');

    const datosSesion = localStorage.getItem('usuarioLogueado');
    if (datosSesion) {
        const usuario = JSON.parse(datosSesion);
        if(document.getElementById('perfilEmail')) document.getElementById('perfilEmail').value = usuario.correo;
        if(document.getElementById('perfilNombre')) document.getElementById('perfilNombre').value = usuario.nombre || '';
    }

    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            inputs.forEach(input => input.removeAttribute('readonly'));
            btnEditar.classList.add('d-none');
            btnGuardar.classList.remove('d-none');
            btnCancelar.classList.remove('d-none');
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            inputs.forEach(input => input.setAttribute('readonly', true));
            btnEditar.classList.remove('d-none');
            btnGuardar.classList.add('d-none');
            btnCancelar.classList.add('d-none');
        });
    }

    perfilForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const usuarioActualizado = JSON.parse(localStorage.getItem('usuarioLogueado'));
        usuarioActualizado.nombre = document.getElementById('perfilNombre').value.trim();
        usuarioActualizado.correo = document.getElementById('perfilEmail').value.trim();

        fetch(`${API_URL}/usuarios/${usuarioActualizado.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuarioActualizado)
        })
        .then(res => {
            if(!res.ok) throw new Error('No se pudieron guardar los cambios en la API');
            localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioActualizado));
            alert('Datos actualizados correctamente en tu perfil y base de datos.');
            location.reload();
        })
        .catch(err => alert(err.message));
    });
}

function initDashboard() {
    const tablaProveedores = document.getElementById('tablaProveedores');
    if (tablaProveedores) {
        cargarProveedores(tablaProveedores);
    }

    const tablaAlertas = document.getElementById('tablaAlertas');
    if (tablaAlertas) {
        cargarAlertasStock(tablaAlertas);
    }
}

function cargarProveedores(tabla) {
    fetch(`${API_URL}/proveedores`)
        .then(respuesta => {
            if (!respuesta.ok) throw new Error('Error en el servidor');
            return respuesta.json();
        })
        .then(proveedores => {
            tabla.innerHTML = ''; 
            
            if (proveedores.length === 0) {
                tabla.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay proveedores registrados.</td></tr>';
                return;
            }

            proveedores.forEach(p => {
                tabla.innerHTML += `
                    <tr>
                        <td class="text-white-50 font-monospace">${p.nit}</td>
                        <td class="fw-bold text-white">${p.nombre_empresa}</td>
                        <td>${p.direccion}</td>
                        <td class="text-white">${p.telefono}</td>
                        <td><a href="mailto:${p.correo}" class="text-decoration-none text-music">${p.correo}</a></td>
                        <td><span class="badge bg-secondary bg-opacity-25 text-white border border-secondary-subtle">${p.categoria}</span></td>
                    </tr>
                `;
            });
        })
        .catch(() => {
            tabla.innerHTML = msgErrorServidor();
        });
}

function cargarAlertasStock(tabla) {
    fetch(`${API_URL}/productos`)
        .then(respuesta => {
            if (!respuesta.ok) throw new Error('Error en el servidor');
            return respuesta.json();
        })
        .then(productos => {
            tabla.innerHTML = '';

            const existenciasBajas = productos.filter(p => p.stock_actual <= p.stock_minimo);

            if (existenciasBajas.length === 0) {
                tabla.innerHTML = '<tr><td colspan="6" class="text-center text-success fw-bold py-4">Todo el stock de periféricos se encuentra en niveles óptimos.</td></tr>';
                return;
            }

            existenciasBajas.forEach(p => {
                tabla.innerHTML += `
                    <tr class="table-danger-custom">
                        <td class="text-white-50 font-monospace">${p.id}</td>
                        <td class="fw-bold text-white">${p.nombre}</td>
                        <td><span class="badge bg-dark text-white border border-secondary">${p.marca}</span></td>
                        <td class="text-danger-highlight">${p.stock_actual} unidades</td>
                        <td>${p.stock_minimo} unidades</td>
                        <td><span class="badge bg-danger p-2 text-white">Reposición Urgente</span></td>
                    </tr>
                `;
            });
        })
        .catch(() => {
            tabla.innerHTML = msgErrorServidor();
        });
}

function initLogout() {
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('usuarioLogueado');
            window.location.href = '../index.html';
        });
    }
}

function msgErrorServidor() {
    return `
        <tr>
            <td colspan="6" class="text-danger text-center fw-bold py-3">
                 No se pudo conectar al JSON Server. Recuerda levantar tu archivo: json-server --watch db.json --port 3000
            </td>
        </tr>
    `;
}