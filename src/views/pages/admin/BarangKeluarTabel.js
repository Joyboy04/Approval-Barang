import React, { useEffect, useState } from 'react';
import { db, getDocs, collection, doc, getDoc, deleteDoc, updateDoc } from '../../../firebase';
import { CButton, CCard, CCardBody, CCardHeader, CSpinner, CRow, CCol } from '@coreui/react';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import { getAuth } from 'firebase/auth';
import CIcon from '@coreui/icons-react';
import { cilArrowBottom, cilTrash, cilReload, cilCheckAlt } from '@coreui/icons';

const BarangKeluarTabel = () => {
  const [barangKeluarData, setBarangKeluarData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const auth = getAuth();
  const user = auth.currentUser;

  const fetchData = async () => {
    if (user) {
      try {
        setLoading(true);
        setError(null);
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.role === 'admin') {
            console.log('Fetching from barang-keluar collection...');
            const querySnapshot = await getDocs(collection(db, 'barang-keluar'));
            console.log('Data received:', querySnapshot.docs);
            
            const data = querySnapshot.docs.map((docSnapshot) => {
              const docData = docSnapshot.data();
              
              return {
                id: docSnapshot.id,
                itemName: docData.itemName || '',
                quantity: docData.quantity || 0,
                notes: docData.notes || '',
                status: docData.status || 'pending',
                createdBy: docData.createdBy || '',
                createdAt: docData.createdAt || '',
              };
            });
            
            console.log('Cleaned data:', data);
            setBarangKeluarData(data);
          } else {
            setError('You do not have permission to view this data.');
          }
        } else {
          setError('User role not found.');
        }
      } catch (err) {
        console.error('Detailed error:', err);
        setError('Error fetching data: ' + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setError('You need to be logged in to access this data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle Approve
  const handleApprove = async (id) => {
    Swal.fire({
      title: 'Approve this request?',
      text: 'The item will be marked as approved and removed from stock.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'No, cancel',
      confirmButtonColor: '#28a745',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Get the barang-keluar data
          const barangKeluarItem = barangKeluarData.find(item => item.id === id);
          
          if (!barangKeluarItem) {
            throw new Error('Item not found');
          }

          console.log('🔍 Looking for item:', barangKeluarItem.itemName);

          // Find the corresponding barang-masuk item by name
          const barangMasukSnapshot = await getDocs(collection(db, 'barang-masuk'));
          let barangMasukItem = null;
          let barangMasukDocId = null;

          barangMasukSnapshot.forEach((doc) => {
            const docData = doc.data();
            
            const searchName = barangKeluarItem.itemName.toLowerCase().trim();
            const docName = (docData.name || '').toLowerCase().trim();

            console.log('Comparing:', searchName, 'vs', docName);

            if (docName === searchName) {
              barangMasukItem = docData;
              barangMasukDocId = doc.id;
              console.log('✅ Match found!', doc.id);
            }
          });

          if (!barangMasukItem || !barangMasukDocId) {
            console.error('❌ Item not found in barang-masuk');
            console.error('Looking for:', barangKeluarItem.itemName);
            throw new Error(`Item "${barangKeluarItem.itemName}" not found in barang-masuk collection. Please make sure the item name matches exactly.`);
          }

          // Calculate new quantity
          const currentQuantity = barangMasukItem.quantity || 0;
          const newQuantity = currentQuantity - barangKeluarItem.quantity;

          console.log('📊 Quantity calculation:', {
            current: currentQuantity,
            removing: barangKeluarItem.quantity,
            new: newQuantity
          });

          if (newQuantity < 0) {
            Swal.fire(
              'Error!',
              `Insufficient stock available. Current stock: ${currentQuantity}, Requested: ${barangKeluarItem.quantity}`,
              'error'
            );
            return;
          }

          // Update barang-keluar status
          const barangKeluarRef = doc(db, 'barang-keluar', id);
          await updateDoc(barangKeluarRef, {
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: user.email || 'Admin',
          });

          // Update barang-masuk quantity
          const barangMasukRef = doc(db, 'barang-masuk', barangMasukDocId);
          await updateDoc(barangMasukRef, {
            quantity: newQuantity,
          });

          // Update state
          setBarangKeluarData(barangKeluarData.map(item => 
            item.id === id ? { ...item, status: 'approved' } : item
          ));

          Swal.fire(
            'Approved!',
            `Item removal approved.\nItem: ${barangKeluarItem.itemName}\nQuantity reduced from ${currentQuantity} to ${newQuantity}`,
            'success'
          );
          console.log('✅ Item approved and quantity updated:', id);
        } catch (err) {
          console.error('❌ Error approving item:', err);
          Swal.fire('Error!', 'Failed to approve item: ' + err.message, 'error');
        }
      }
    });
  };

  // Handle Reject
  const handleReject = async (id) => {
    Swal.fire({
      title: 'Reject this request?',
      text: 'The item removal request will be rejected.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'No, cancel',
      confirmButtonColor: '#dc3545',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Update status to rejected
          const docRef = doc(db, 'barang-keluar', id);
          await updateDoc(docRef, {
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedBy: user.email || 'Admin',
          });
          
          // Update state
          setBarangKeluarData(barangKeluarData.map(item => 
            item.id === id ? { ...item, status: 'rejected' } : item
          ));
          
          Swal.fire('Rejected!', 'Item removal request has been rejected.', 'success');
          console.log('Item rejected:', id);
        } catch (err) {
          console.error('Error rejecting item:', err);
          Swal.fire('Error!', 'Failed to reject item: ' + err.message, 'error');
        }
      }
    });
  };

  // Handle Delete
  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This request will be deleted permanently and cannot be recovered.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // DELETE FROM FIRESTORE
          await deleteDoc(doc(db, 'barang-keluar', id));
          
          // REMOVE FROM STATE
          setBarangKeluarData(barangKeluarData.filter(item => item.id !== id));
          
          // SHOW SUCCESS MESSAGE
          Swal.fire('Deleted!', 'Request has been successfully deleted.', 'success');
          console.log('Item deleted:', id);
        } catch (err) {
          console.error('Error deleting item:', err);
          Swal.fire('Error!', 'Failed to delete item: ' + err.message, 'error');
        }
      }
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchData();
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="badge bg-success">{status}</span>;
      case 'rejected':
        return <span className="badge bg-danger">{status}</span>;
      case 'pending':
      default:
        return <span className="badge bg-warning text-dark">{status}</span>;
    }
  };

  const columns = [
    {
      name: 'Item Name',
      selector: (row) => row.itemName,
      sortable: true,
      width: '18%',
    },
    {
      name: 'Quantity',
      selector: (row) => row.quantity,
      sortable: true,
      width: '10%',
      cell: (row) => (
        <span className="badge bg-danger">{row.quantity}</span>
      ),
    },
    {
      name: 'Notes',
      selector: (row) => row.notes,
      sortable: true,
      width: '22%',
      cell: (row) => (
        <span className="small">{row.notes}</span>
      ),
    },
    {
      name: 'Status',
      selector: (row) => row.status,
      sortable: true,
      width: '12%',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      name: 'Date',
      selector: (row) => new Date(row.createdAt).toLocaleDateString('id-ID'),
      sortable: true,
      width: '15%',
      cell: (row) => (
        <span className="small text-muted">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString('id-ID') : '-'}
        </span>
      ),
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="d-flex gap-2">
          {row.status === 'pending' && (
            <>
              <CButton 
                color="success" 
                size="sm"
                onClick={() => handleApprove(row.id)}
                title="Approve"
              >
                <CIcon icon={cilCheckAlt} />
              </CButton>
              <CButton 
                color="warning" 
                size="sm"
                onClick={() => handleReject(row.id)}
                title="Reject"
              >
                ✕
              </CButton>
            </>
          )}
          <CButton 
            color="danger" 
            size="sm"
            onClick={() => handleDelete(row.id)}
            className="d-flex align-items-center gap-2"
          >
            <CIcon icon={cilTrash} />
          </CButton>
        </div>
      ),
      width: '18%',
    },
  ];

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentData = barangKeluarData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <CCard className="shadow-sm">
      <CCardHeader className="bg-danger text-white">
        <CRow className="align-items-center">
          <CCol xs="auto">
            <h5 className="mb-0">
              <CIcon icon={cilArrowBottom} className="me-2" />
              Barang Keluar ({barangKeluarData.length})
            </h5>
          </CCol>
          <CCol className="text-end">
            <CButton
              color="light"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="d-flex align-items-center gap-2 ms-auto"
            >
              <CIcon icon={cilReload} />
              Refresh
            </CButton>
          </CCol>
        </CRow>
      </CCardHeader>
      <CCardBody>
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error!</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="text-center">
              <CSpinner color="danger" />
              <p className="mt-3 text-muted">Loading data...</p>
            </div>
          </div>
        ) : barangKeluarData.length > 0 ? (
          <DataTable
            columns={columns}
            data={currentData}
            pagination
            paginationServer
            paginationPerPage={rowsPerPage}
            paginationTotalRows={barangKeluarData.length}
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
          <div className="text-center py-5">
            <h6 className="text-muted">No records to display</h6>
            <p className="text-muted small">No barang keluar requests yet.</p>
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default BarangKeluarTabel;