document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.location.href = 'vistas/dashboard.html';
        });
    }

    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden.');
                return;
            }

            alert('Usuario registrado con éxito en el sistema.');
            location.reload();
        });
    }

    const btnEditar = document.getElementById('btnEditar');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnCancelar = document.getElementById('btnCancelar');
    const inputs = document.querySelectorAll('#perfilForm input:not([disabled])');

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

    const perfilForm = document.getElementById('perfilForm');
    if (perfilForm) {
        perfilForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Datos actualizados correctamente.');
            location.reload();
        });
    }

    const tablaProveedores = document.getElementById('tablaProveedores');
    if (tablaProveedores) {
        fetch('http://localhost:3000/proveedores')
            .then(respuesta => {
                if (!respuesta.ok) throw new Error('Error en el servidor');
                return respuesta.json();
            })
            .then(proveedores => {
                tablaProveedores.innerHTML = ''; 
                
                if (proveedores.length === 0) {
                    tablaProveedores.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay proveedores registrados.</td></tr>';
                    return;
                }

                proveedores.forEach(p => {
                    tablaProveedores.innerHTML += `
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
            .catch(error => {
                console.error(error);
                tablaProveedores.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-danger text-center fw-bold py-3">
                             No se pudo conectar al JSON Server. Asegúrate de tenerlo encendido en el puerto 3000.
                        </td>
                    </tr>
                `;
            });
    }

    const tablaAlertas = document.getElementById('tablaAlertas');
    if (tablaAlertas) {
        fetch('http://localhost:3000/productos')
            .then(respuesta => {
                if (!respuesta.ok) throw new Error('Error en el servidor');
                return respuesta.json();
            })
            .then(productos => {
                tablaAlertas.innerHTML = '';

                const existenciasBajas = productos.filter(p => p.stock_actual <= p.stock_minimo);

                if (existenciasBajas.length === 0) {
                    tablaAlertas.innerHTML = '<tr><td colspan="6" class="text-center text-success fw-bold py-4">Todo el stock de periféricos se encuentra en niveles óptimos.</td></tr>';
                    return;
                }

                existenciasBajas.forEach(p => {
                    tablaAlertas.innerHTML += `
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
            .catch(error => {
                console.error(error);
                tablaAlertas.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-danger text-center fw-bold py-3">
                             No se pudo conectar al JSON Server. Asegúrate de tenerlo encendido en el puerto 3000.
                        </td>
                    </tr>
                `;
            });
    }

});