const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    verificarProteccionRutas();
    initAuth();
    initPerfil();
    initDashboard();
    initProductos();          
    initCRUD();               
    initFormularioProducto(); 
    initMovimientos();        
    initLogout();
});

function verificarProteccionRutas() {
    const estaEnRaiz = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');

    if (!estaEnRaiz && !usuarioLogueado) {
        window.location.href = '../index.html';
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

function initProductos() {
    const contenedorTarjetas = document.getElementById('contenedor-tarjetas');
    const buscarNombre = document.getElementById('buscar-nombre');
    const filtrarCategoria = document.getElementById('filtrar-categoria');

    if (!contenedorTarjetas) return;

    let todosLosProductos = [];

    const renderizarTarjetas = (productos) => {
        contenedorTarjetas.innerHTML = '';
        if (productos.length === 0) {
            contenedorTarjetas.innerHTML = '<div class="col-12 text-center text-white-50 py-5">No se encontraron productos con esos criterios.</div>';
            return;
        }
        productos.forEach(p => {
            let stock = p.stock_actual !== undefined ? p.stock_actual : p.stock;
            contenedorTarjetas.innerHTML += `
                <div class="col-md-4 col-lg-3">
                    <div class="card card-custom h-100 p-3 border-secondary">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title text-white fw-bold">${p.nombre}</h5>
                            <h6 class="card-subtitle mb-3 text-music">${p.categoria}</h6>
                            <div class="mt-auto">
                                <p class="card-text text-white-50 m-0 small">Precio:</p>
                                <p class="card-text text-white fw-bold fs-5">$${p.precio}</p>
                                <p class="card-text text-white-50 m-0 small">Stock disponible: <span class="${stock <= 5 ? 'text-danger fw-bold' : 'text-success'}">${stock} unds</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    };

    fetch(`${API_URL}/productos`)
        .then(res => res.json())
        .then(data => {
            todosLosProductos = data;
            renderizarTarjetas(data);
        })
        .catch(err => console.error("Error cargando productos:", err));

    const filtrarProductos = () => {
        const textoBusqueda = buscarNombre ? buscarNombre.value.toLowerCase() : '';
        const categoriaSeleccionada = filtrarCategoria ? filtrarCategoria.value : 'todas';

        const filtrados = todosLosProductos.filter(p => {
            const coincideNombre = p.nombre.toLowerCase().includes(textoBusqueda);
            const coincideCategoria = categoriaSeleccionada === 'todas' || p.categoria === categoriaSeleccionada;
            return coincideNombre && coincideCategoria;
        });
        renderizarTarjetas(filtrados);
    };

    if (buscarNombre) buscarNombre.addEventListener('input', filtrarProductos);
    if (filtrarCategoria) filtrarCategoria.addEventListener('change', filtrarProductos);
}



function initCRUD() {
    const tablaCrud = document.getElementById('tablaCrud');
    if (!tablaCrud) return;

    const cargarTablaCrud = () => {
        fetch(`${API_URL}/productos`)
            .then(res => res.json())
            .then(productos => {
                tablaCrud.innerHTML = '';
                if (productos.length === 0) {
                    tablaCrud.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No hay productos registrados en el sistema.</td></tr>';
                    return;
                }
                productos.forEach(p => {
                    let stock = p.stock_actual !== undefined ? p.stock_actual : p.stock;
                    tablaCrud.innerHTML += `
                        <tr>
                            <td class="text-white-50 font-monospace">${p.id}</td>
                            <td class="text-white fw-bold">${p.nombre}</td>
                            <td><span class="badge bg-secondary bg-opacity-25 text-white border border-secondary-subtle">${p.categoria}</span></td>
                            <td class="text-white">$${p.precio}</td>
                            <td class="text-white">${stock}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-warning me-1" onclick="editarProducto('${p.id}')">Editar</button>
                                <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto('${p.id}')">Eliminar</button>
                            </td>
                        </tr>
                    `;
                });
            });
    };
    cargarTablaCrud();
    
    window.editarProducto = (id) => {
        window.location.href = `actualizarproducto.html?id=${id}`;
    };

    window.eliminarProducto = (id) => {
        if(confirm('¿Está seguro de que desea eliminar este registro tecnológico de forma permanente?')) {
            fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' })
                .then(() => cargarTablaCrud())
                .catch(err => alert("Error al eliminar el producto."));
        }
    };

    window.abrirFormularioCrear = () => {
        window.location.href = 'agregarproductos.html';
    };

    window.abrirFormularioActualizar = () => { 
        alert("Por favor, utilice el botón 'Editar' en la fila del producto específico que desea modificar."); 
    };

    window.ejecutarEliminar = () => { 
        alert("Por favor, utilice el botón 'Eliminar' en la fila del producto específico."); 
    };
}


function initFormularioProducto() {
    const formProducto = document.getElementById('form-producto');
    if (!formProducto) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productoId = urlParams.get('id');
    
    const inputId = document.getElementById('producto-id');
    const inputNombre = document.getElementById('nombre');
    const selectCategoria = document.getElementById('categoria');
    const inputPrecio = document.getElementById('precio');
    const inputStock = document.getElementById('stock');
    const btnCancelarProducto = document.getElementById('btn-cancelar');

    if (btnCancelarProducto) {
        btnCancelarProducto.style.display = 'inline-block';
        btnCancelarProducto.addEventListener('click', () => {
            window.location.href = 'crud.html';
        });
    }

    if (productoId && window.location.pathname.includes('actualizarproducto')) {
        fetch(`${API_URL}/productos/${productoId}`)
            .then(res => res.json())
            .then(p => {
                inputId.value = p.id;
                inputNombre.value = p.nombre;
                selectCategoria.value = p.categoria;
                inputPrecio.value = p.precio;
                inputStock.value = p.stock_actual !== undefined ? p.stock_actual : p.stock;
            })
            .catch(err => alert("Error al cargar los datos del producto."));
    }

    formProducto.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const productoData = {
            nombre: inputNombre.value,
            categoria: selectCategoria.value,
            precio: parseFloat(inputPrecio.value),
            stock_actual: parseInt(inputStock.value),
            stock_minimo: 5,
            marca: "Genérica" 
        };

        let url = `${API_URL}/productos`;
        let method = 'POST';

        if (productoId || inputId.value) {
            url += `/${productoId || inputId.value}`;
            method = 'PUT';
        }

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productoData)
        })
        .then(res => {
            if(!res.ok) throw new Error("Error en la petición");
            alert(method === 'POST' ? 'Registro tecnológico añadido correctamente.' : 'Datos del producto actualizados.');
            window.location.href = 'crud.html';
        })
        .catch(err => console.error(err));
    });
}


function initMovimientos() {
    const formMovimiento = document.getElementById('form-movimiento');
    const selectProducto = document.getElementById('select-producto');
    const tablaStock = document.getElementById('tabla-stock');

    if (!formMovimiento && !tablaStock) return;

    const cargarDatosMovimientos = () => {
        fetch(`${API_URL}/productos`)
            .then(res => res.json())
            .then(productos => {
                // Llenar el selector
                if (selectProducto) {
                    selectProducto.innerHTML = '<option value="">Seleccione un producto...</option>';
                    productos.forEach(p => {
                        let stock = p.stock_actual !== undefined ? p.stock_actual : p.stock;
                        selectProducto.innerHTML += `<option value="${p.id}" data-stock="${stock}">${p.nombre} (Disponibles: ${stock})</option>`;
                    });
                }
                
                // Llenar la tabla de estado actual
                if (tablaStock) {
                    tablaStock.innerHTML = '';
                    if(productos.length === 0){
                        tablaStock.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay datos en bodega.</td></tr>';
                    }
                    productos.forEach(p => {
                        let stock = p.stock_actual !== undefined ? p.stock_actual : p.stock;
                        tablaStock.innerHTML += `
                            <tr>
                                <td class="text-white-50 font-monospace">${p.id}</td>
                                <td class="text-white fw-bold">${p.nombre}</td>
                                <td><span class="badge bg-secondary bg-opacity-25 text-white border border-secondary-subtle">${p.categoria}</span></td>
                                <td class="text-white">${stock}</td>
                            </tr>
                        `;
                    });
                }
            });
    };

    cargarDatosMovimientos();

    if (formMovimiento) {
        formMovimiento.addEventListener('submit', (e) => {
            e.preventDefault();
            const prodId = selectProducto.value;
            const tipo = document.getElementById('tipo-movimiento').value;
            const cant = parseInt(document.getElementById('cantidad').value);

            if(!prodId || !tipo || isNaN(cant) || cant <= 0) {
                alert("Por favor, ingrese datos válidos para procesar el movimiento.");
                return;
            }

            const opcionSeleccionada = selectProducto.options[selectProducto.selectedIndex];
            let stockActual = parseInt(opcionSeleccionada.getAttribute('data-stock'));

            let nuevoStock = tipo === 'entrada' ? stockActual + cant : stockActual - cant;

            if (nuevoStock < 0) {
                alert('Operación rechazada: No hay suficiente stock en bodega para realizar este despacho.');
                return;
            }

            fetch(`${API_URL}/productos/${prodId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock_actual: nuevoStock, stock: nuevoStock })
            })
            .then(res => {
                if(!res.ok) throw new Error("Fallo en la actualización");
                alert(`Movimiento procesado con éxito. Nuevo stock en sistema: ${nuevoStock}`);
                document.getElementById('cantidad').value = '';
                document.getElementById('tipo-movimiento').value = '';
                cargarDatosMovimientos(); 
            })
            .catch(err => console.error(err));
        });
    }
}