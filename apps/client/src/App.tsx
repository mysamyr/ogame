import { BrowserRouter } from 'react-router-dom';

import { Modal, Snackbar } from './components/index.js';
import { useSnackbar, useModal } from './hooks/index.js';
import Dashboard from './pages/Dashboard/Dashboard.js';

export default function App() {
  const { open: modalOpen, modal, requestCloseModal } = useModal();
  const { open: snackbarOpen, message, closeSnackbar } = useSnackbar();

  return (
    <BrowserRouter>
      <Dashboard />

      {snackbarOpen && <Snackbar message={message} onClose={closeSnackbar} />}
      <Modal
        open={modalOpen}
        modal={modal}
        onRequestClose={requestCloseModal}
      />
    </BrowserRouter>
  );
}
