import { useEffect, useState } from "react";
import { Table, Button, Modal, Label, TextInput, Select, Badge, Spinner, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, UsuarioCreate, UsuarioUpdate } from "../../api/usuarios";
import { getRoles } from "../../api/roles";
import { getClientes, Cliente, getCliente } from "../../api/clientes";
import Swal from "sweetalert2";

// Interfaces locally if not exported
interface Role {
    id: number;
    nombre_rol: string;
}

interface User {
    id: number;
    nombre_usuario: string;
    activo: boolean;
    rol?: Role;
    id_cliente?: number | null;
}

const UsersList = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Edit mode
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Client selection
    const [searchClient, setSearchClient] = useState("");
    const [foundClients, setFoundClients] = useState<Cliente[]>([]);
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

    // Form state
    const [formData, setFormData] = useState<UsuarioCreate>({
        nombre_usuario: "",
        correo: "pending@example.com",
        contraseña: "",
        id_rol: 0,
        activo: true,
        id_cliente: null
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // Fetch clients when search term changes (> 2 chars)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchClient.length > 2) {
                fetchClients(searchClient);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchClient]);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([getUsuarios(), getRoles()]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async (q: string) => {
        try {
            const res = await getClientes({ q, size: 5 });
            setFoundClients(res.data.items);
        } catch (error) {
            console.error("Error searching clients", error);
        }
    }

    // Load full client details if editing user has id_cliente
    const loadSelectedClient = async (clientId: number) => {
        try {
            const res = await getCliente(clientId);
            setSelectedClient(res.data);
        } catch (error) {
            console.error("Could not load associated client", error);
        }
    }

    const openModal = async (user?: User) => {
        setFormError(null);
        setSearchClient("");
        setFoundClients([]);

        if (user) {
            setEditingUser(user);
            setFormData({
                nombre_usuario: user.nombre_usuario,
                correo: "pending@example.com", // Keeping dummy as we don't display email in table yet
                contraseña: "", // Empty means no change
                id_rol: user.rol?.id || (roles.length > 0 ? roles[0].id : 0),
                activo: user.activo,
                id_cliente: user.id_cliente
            });
            if (user.id_cliente) {
                await loadSelectedClient(user.id_cliente);
            } else {
                setSelectedClient(null);
            }
        } else {
            setEditingUser(null);
            setFormData({
                nombre_usuario: "",
                correo: "pending@example.com",
                contraseña: "",
                id_rol: roles.length > 0 ? roles[0].id : 0,
                activo: true,
                id_cliente: null
            });
            setSelectedClient(null);
        }
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteUsuario(id);
                setUsers(users.filter(u => u.id !== id));
                Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setProcessing(true);

        try {
            const payload: UsuarioCreate | UsuarioUpdate = { ...formData };
            payload.id_rol = Number(payload.id_rol);
            payload.id_cliente = selectedClient ? selectedClient.id : null;

            if (editingUser) {
                // Update
                if (!payload.contraseña) delete payload.contraseña; // Don't send empty pwd
                await updateUsuario(editingUser.id, payload);
                Swal.fire('Actualizado', 'Usuario actualizado correctamente', 'success');
            } else {
                // Create
                await createUsuario(payload as UsuarioCreate);
                Swal.fire('Creado', 'Usuario creado correctamente', 'success');
            }

            setShowModal(false);
            fetchData(); // Refresh list to see updates
        } catch (error: any) {
            console.error(error);
            setFormError(error.response?.data?.detail || "Error al procesar solicitud");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Spinner /></div>;

    return (
        <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
            <div className="flex justify-between items-center mb-4">
                <h5 className="card-title">Gestión de Usuarios</h5>
                <Button color="primary" onClick={() => openModal()} className="flex items-center gap-2">
                    <Icon icon="solar:user-plus-bold" className="mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            <div className="overflow-x-auto">
                <Table hoverable>
                    <Table.Head>
                        <Table.HeadCell className="p-6">ID</Table.HeadCell>
                        <Table.HeadCell>Usuario</Table.HeadCell>
                        <Table.HeadCell>Rol</Table.HeadCell>
                        <Table.HeadCell>Cliente Asociado</Table.HeadCell>
                        <Table.HeadCell>Estado</Table.HeadCell>
                        <Table.HeadCell>Acciones</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y divide-border dark:divide-darkborder">
                        {users.map((user) => (
                            <Table.Row key={user.id}>
                                <Table.Cell className="ps-6">{user.id}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap font-medium text-dark">
                                    {user.nombre_usuario}
                                </Table.Cell>
                                <Table.Cell>{user.rol?.nombre_rol || "Sin Rol"}</Table.Cell>
                                <Table.Cell>
                                    {user.id_cliente ? (
                                        <Badge color="info" icon={() => <Icon icon="solar:link-circle-bold" className="mr-1" />}>
                                            SÍ (ID: {user.id_cliente})
                                        </Badge>
                                    ) : <span className="text-dark opacity-50">No asociado</span>}
                                </Table.Cell>
                                <Table.Cell>
                                    {user.activo
                                        ? <Badge color="success">Activo</Badge>
                                        : <Badge color="failure">Inactivo</Badge>
                                    }
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex gap-2">
                                        <Button size="xs" color="light" onClick={() => openModal(user)}>
                                            <Icon icon="solar:pen-bold" className="text-lg" />
                                        </Button>
                                        <Button size="xs" color="failure" onClick={() => handleDelete(user.id)}>
                                            <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
                                        </Button>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>

            {/* Modal Create/Edit */}
            <Modal show={showModal} onClose={() => setShowModal(false)} size="lg">
                <Modal.Header>{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {formError && <Alert color="failure">{formError}</Alert>}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="mb-2 block"><Label htmlFor="u-name" value="Nombre de Usuario" /></div>
                                <TextInput
                                    id="u-name"
                                    required
                                    value={formData.nombre_usuario}
                                    onChange={e => setFormData({ ...formData, nombre_usuario: e.target.value })}
                                />
                            </div>

                            <div>
                                <div className="mb-2 block"><Label htmlFor="u-pass" value={editingUser ? "Contraseña (Dejar vacío para no cambiar)" : "Contraseña"} /></div>
                                <TextInput
                                    id="u-pass"
                                    type="password"
                                    required={!editingUser}
                                    value={formData.contraseña}
                                    onChange={e => setFormData({ ...formData, contraseña: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 block"><Label htmlFor="u-role" value="Rol" /></div>
                            <Select
                                id="u-role"
                                required
                                value={formData.id_rol}
                                onChange={e => setFormData({ ...formData, id_rol: parseInt(e.target.value) })}
                            >
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.nombre_rol}</option>
                                ))}
                            </Select>
                        </div>

                        {/* Client Association Section */}
                        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                                <Icon icon="solar:link-minimalistic-bold" />
                                Asociar Cliente (Para Acceso Staff)
                            </h4>
                            <p className="text-xs text-gray-500 mb-2">Busca un cliente por nombre o documento para vincularlo a este usuario.</p>

                            {!selectedClient ? (
                                <div className="relative">
                                    <TextInput
                                        placeholder="Buscar cliente..."
                                        value={searchClient}
                                        onChange={e => setSearchClient(e.target.value)}
                                        icon={() => <Icon icon="solar:magnifer-linear" />}
                                    />
                                    {searchClient.length > 2 && foundClients.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                            {foundClients.map(c => (
                                                <div
                                                    key={c.id}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
                                                    onClick={() => {
                                                        setSelectedClient(c);
                                                        setFoundClients([]);
                                                        setSearchClient("");
                                                    }}
                                                >
                                                    <span className="font-bold">{c.nombre} {c.apellido}</span>
                                                    <span className="text-gray-500 ml-2">({c.documento})</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {searchClient.length > 2 && foundClients.length === 0 && (
                                        <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border rounded-md shadow-lg mt-1 p-2 text-gray-400 text-sm">
                                            No encontrado
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200 text-green-800">
                                    <div className="flex items-center gap-2">
                                        <Icon icon="solar:user-check-bold" />
                                        <span className="font-bold text-sm">{selectedClient.nombre} {selectedClient.apellido}</span>
                                        <span className="text-xs">({selectedClient.documento})</span>
                                    </div>
                                    <Button size="xs" color="failure" onClick={() => setSelectedClient(null)}>
                                        <Icon icon="solar:close-circle-bold" />
                                    </Button>
                                </div>
                            )}

                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button color="gray" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" color="primary" isProcessing={processing}>
                                {editingUser ? 'Actualizar Usuario' : 'Guardar Usuario'}
                            </Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default UsersList;
