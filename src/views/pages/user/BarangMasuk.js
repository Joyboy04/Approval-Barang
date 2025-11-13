// BarangMasukPage.js
import React from 'react';
import BarangMasukForm from './BarangMasukForm';
import BarangMasukTabel from './BarangMasukTabel';

const BarangMasuk = () => {
  return (
    <div className="container-fluid p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Form Section */}
      <div className="mb-4">
        <BarangMasukForm />
      </div>
      
      {/* Table Section */}
      <div>
        <BarangMasukTabel />
      </div>
    </div>
  );
};

export default BarangMasuk;