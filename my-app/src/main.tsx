import React from 'react';
import { createRoot } from 'react-dom/client';
import CadastroColaborador from './pages/CadastroColaborador';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><CadastroColaborador /></React.StrictMode>,
);
