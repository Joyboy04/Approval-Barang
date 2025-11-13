import React, { useEffect, useState } from 'react';
import { db, getDocs, collection, doc, setDoc, deleteDoc } from '../../../firebase';
import { CButton, CForm, CFormInput, CFormLabel, CFormSelect, CCard, CCardBody, CCardHeader, CSpinner, CRow, CCol, CFormFeedback } from '@coreui/react';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import CIcon from '@coreui/icons-react';
import { cilUser, cilTrash, cilReload } from '@coreui/icons';

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [errors, setErrors] = useState({});
  const auth = getAuth();

  // Fetch users from Firestore
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        email: doc.data().email || '',
        role: doc.data().role || '',
        createdAt: doc.data().createdAt || '',
      }));
      setUsers(usersList);
      console.log('Users fetched:', usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire('Error!', 'Failed to fetch users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!newUser.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!newUser.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!newUser.password) {
      newErrors.password = 'Password is required';
    } else if (newUser.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!newUser.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Delete
  const handleDelete = async (id, email) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This user will be deleted permanently from both Firestore and Authentication.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#dc3545',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);

          // Delete from Firestore
          await deleteDoc(doc(db, 'users', id));

          setUsers(users.filter(user => user.id !== id));
          Swal.fire('Deleted!', 'User has been successfully deleted.', 'success');
          console.log('User deleted:', id);
        } catch (error) {
          console.error('Error deleting user:', error);
          Swal.fire('Error!', 'Failed to delete user: ' + error.message, 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Handle Create User
  const handleCreateUser = async () => {
    if (!validateForm()) {
      Swal.fire('Validation Error!', 'Please fill in all fields correctly.', 'error');
      return;
    }

    try {
      setLoading(true);

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email.trim(),
        newUser.password
      );

      const uid = userCredential.user.uid;

      // Save user data to Firestore
      await setDoc(doc(db, 'users', uid), {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        createdAt: new Date().toISOString(),
        createdBy: '',
      });

      // Add to state
      setUsers([...users, {
        id: uid,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: new Date().toISOString(),
      }]);

      Swal.fire('Success!', `User "${newUser.name}" has been created successfully with email: ${newUser.email}`, 'success');
      setNewUser({ name: '', email: '', password: '', role: '' });
      setErrors({});
      console.log('User created with UID:', uid);
    } catch (error) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }

      Swal.fire('Error!', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (rows) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchUsers();
  };

  // Define columns for DataTable
  const columns = [
    {
      name: 'Name',
      selector: (row) => row.name,
      sortable: true,
      width: '20%',
    },
    {
      name: 'Email',
      selector: (row) => row.email,
      sortable: true,
      width: '30%',
    },
    {
      name: 'Role',
      selector: (row) => (
        <span className={`badge bg-${row.role === 'admin' ? 'danger' : 'info'}`}>
          {row.role}
        </span>
      ),
      sortable: true,
      width: '15%',
    },
    {
      name: 'Created At',
      selector: (row) => new Date(row.createdAt).toLocaleDateString('id-ID'),
      sortable: true,
      width: '20%',
      cell: (row) => (
        <span className="small text-muted">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString('id-ID') : '-'}
        </span>
      ),
    },
    {
      name: 'Actions',
      cell: (row) => (
        <CButton 
          color="danger" 
          size="sm"
          onClick={() => handleDelete(row.id, row.email)}
          className="d-flex align-items-center gap-2"
        >
          <CIcon icon={cilTrash} />
          Delete
        </CButton>
      ),
      width: '15%',
    },
  ];

  // Get current page data
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentData = users.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-4">
      {/* Create User Card */}
      <CCard className="mb-4 shadow-sm">
        <CCardHeader className="bg-primary text-white">
          <h5 className="mb-0">
            <CIcon icon={cilUser} className="me-2" />
            Create New User
          </h5>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel className="fw-bold">Name <span className="text-danger">*</span></CFormLabel>
                <CFormInput
                  type="text"
                  placeholder="Enter user name"
                  value={newUser.name}
                  onChange={(e) => {
                    setNewUser({ ...newUser, name: e.target.value });
                    setErrors({ ...errors, name: '' });
                  }}
                  disabled={loading}
                  isInvalid={!!errors.name}
                />
                {errors.name && <CFormFeedback invalid>{errors.name}</CFormFeedback>}
              </CCol>

              <CCol md={6}>
                <CFormLabel className="fw-bold">Email <span className="text-danger">*</span></CFormLabel>
                <CFormInput
                  type="email"
                  placeholder="Enter email address"
                  value={newUser.email}
                  onChange={(e) => {
                    setNewUser({ ...newUser, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  disabled={loading}
                  isInvalid={!!errors.email}
                />
                {errors.email && <CFormFeedback invalid>{errors.email}</CFormFeedback>}
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel className="fw-bold">Password <span className="text-danger">*</span></CFormLabel>
                <CFormInput
                  type="password"
                  placeholder="Enter password (min 6 characters)"
                  value={newUser.password}
                  onChange={(e) => {
                    setNewUser({ ...newUser, password: e.target.value });
                    setErrors({ ...errors, password: '' });
                  }}
                  disabled={loading}
                  isInvalid={!!errors.password}
                />
                {errors.password && <CFormFeedback invalid>{errors.password}</CFormFeedback>}
              </CCol>

              <CCol md={6}>
                <CFormLabel className="fw-bold">Role <span className="text-danger">*</span></CFormLabel>
                <CFormSelect
                  value={newUser.role}
                  onChange={(e) => {
                    setNewUser({ ...newUser, role: e.target.value });
                    setErrors({ ...errors, role: '' });
                  }}
                  disabled={loading}
                  isInvalid={!!errors.role}
                >
                  <option value="">Select a role</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </CFormSelect>
                {errors.role && <CFormFeedback invalid>{errors.role}</CFormFeedback>}
              </CCol>
            </CRow>

            <CButton 
              color="primary" 
              onClick={handleCreateUser}
              disabled={loading}
              className="fw-bold"
            >
              {loading ? (
                <>
                  <CSpinner component="span" size="sm" className="me-2" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </CButton>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Users Table Card */}
      <CCard className="shadow-sm">
        <CCardHeader className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Existing Users ({users.length})</h5>
          <CButton
            color="light"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="d-flex align-items-center gap-2"
          >
            <CIcon icon={cilReload} />
            Refresh
          </CButton>
        </CCardHeader>
        <CCardBody>
          {loading && users.length === 0 ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
              <p className="mt-3 text-muted">Loading users...</p>
            </div>
          ) : users.length > 0 ? (
            <DataTable
              columns={columns}
              data={currentData}
              pagination
              paginationServer
              paginationPerPage={rowsPerPage}
              paginationTotalRows={users.length}
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handleRowsPerPageChange}
              responsive
              highlightOnHover
              striped
              dense
              customStyles={{
                headCells: {
                  style: {
                    backgroundColor: '#f8f9fa',
                    fontWeight: 'bold',
                    color: '#333',
                  },
                },
              }}
            />
          ) : (
            <p className="text-center text-muted py-5">No users found</p>
          )}
        </CCardBody>
      </CCard>
    </div>
  );
};

export default ManageUser;