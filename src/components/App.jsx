import React, { useState } from 'react';
import MenuHorizontal from './components/MenuHorizontal';
import NuevoConductorModal from './components/NuevoConductorModal';

export default function App() {
  const [showNuevoConductorModal, setShowNuevoConductorModal] = useState(false);

  const handleOpenNuevoConductor = () => setShowNuevoConductorModal(true);
  const handleCloseNuevoConductor = () => setShowNuevoConductorModal(false);

  return (
    <div>
      <MenuHorizontal 
        onOpenNuevoConductor={handleOpenNuevoConductor}
        // ...existing menu props
      />
      <NuevoConductorModal 
        isOpen={showNuevoConductorModal}
        onClose={handleCloseNuevoConductor}
      />
    </div>
  );
}