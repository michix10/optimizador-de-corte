import React, { useState } from 'react';

interface GitHubTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (token: string) => void;
}

const GitHubTokenModal: React.FC<GitHubTokenModalProps> = ({ isOpen, onClose, onSave }) => {
  const [token, setToken] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (token.trim()) {
      onSave(token.trim());
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Token de Acceso de GitHub
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Para exportar a un repositorio de GitHub, se necesita un Token de Acceso Personal (PAT). La aplicación lo usará para crear un repositorio privado en tu cuenta.
        </p>
        <div className="space-y-2">
            <label htmlFor="github-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tu Token de Acceso Personal
            </label>
            <input
                id="github-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="ghp_..."
            />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          El token se guardará en el almacenamiento de tu navegador. 
          <a 
            href="https://github.com/settings/tokens/new?scopes=repo&description=OptimizadorDeCorte"
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {' '}Crea un nuevo token aquí
          </a> con el permiso `repo`.
        </p>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!token.trim()}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Guardar y Exportar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitHubTokenModal;
