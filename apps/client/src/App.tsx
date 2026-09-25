import { BrowserRouter } from 'react-router-dom';

import { Modal, Snackbar } from './components/index.js';
import { useSnackbar, useModal } from './hooks/index.js';
import Dashboard from './pages/Dashboard/Dashboard.js';

function ModalHost() {
  const { modal, open, requestCloseModal } = useModal(state => ({
    modal: state.modal,
    open: state.open,
    requestCloseModal: state.requestCloseModal,
  }));

  return <Modal open={open} modal={modal} onRequestClose={requestCloseModal} />;
}

function SnackbarHost() {
  const { closeSnackbar, message, open } = useSnackbar(state => ({
    closeSnackbar: state.closeSnackbar,
    message: state.message,
    open: state.open,
  }));

  return open ? <Snackbar message={message} onClose={closeSnackbar} /> : null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Dashboard />
      <SnackbarHost />
      <ModalHost />
    </BrowserRouter>
  );
}
