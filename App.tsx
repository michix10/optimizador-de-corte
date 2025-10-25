import React, { useState, useCallback, useEffect, useRef } from 'react';
import PieceInput from './components/PieceInput';
import PieceList from './components/PieceList';
import ResultDisplay from './components/ResultDisplay';
import SummaryDisplay from './components/SummaryDisplay';
import GitHubTokenModal from './components/GitHubTokenModal';
// FIX: Import EdgeBanding as it is now part of the Piece type.
import { Piece, Panel, EdgeBanding, Offcut, Rotation } from './types';
import { optimizeCuts } from './services/optimizer';
import { PANEL_WIDTH, PANEL_HEIGHT } from './constants';
import Configuration from './components/Configuration';

interface OffcutsDisplayProps {
  panels: Panel[];
}

interface OffcutSummaryItem {
    width: number;
    height: number;
    quantity: number;
}

const OffcutsDisplay: React.FC<OffcutsDisplayProps> = ({ panels }) => {
    const MIN_OFFCUT_SIZE = 1; // Do not show tiny slivers of waste

    const summary = React.useMemo(() => {
        const offcutMap = new Map<string, OffcutSummaryItem>();
        const allOffcuts = panels.flatMap(p => p.offcuts);

        for (const offcut of allOffcuts) {
            if (offcut.width < MIN_OFFCUT_SIZE || offcut.height < MIN_OFFCUT_SIZE) {
                continue;
            }
            
            const w = Math.min(offcut.width, offcut.height);
            const h = Math.max(offcut.width, offcut.height);

            const key = `${w.toFixed(1)}x${h.toFixed(1)}`;
            
            if (offcutMap.has(key)) {
                offcutMap.get(key)!.quantity++;
            } else {
                offcutMap.set(key, {
                    width: w,
                    height: h,
                    quantity: 1,
                });
            }
        }
        return Array.from(offcutMap.values()).sort((a,b) => (b.width * b.height) - (a.width * a.height));
    }, [panels]);

    if (summary.length === 0) {
        return null;
    }

    return (
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Lista de Retales (Sobrantes)</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Medidas (cm)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Cantidad
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {summary.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="font-mono text-sm">
                                        {item.width.toFixed(1)} x {item.height.toFixed(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-medium">{item.quantity}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Nota: Se muestran los sobrantes rectangulares que pueden ser reutilizables. No se incluyen desperdicios muy pequeños.
            </p>
        </div>
    );
};


const App: React.FC = () => {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  const [sawKerf, setSawKerf] = useState(0.3); // Default 3mm saw kerf
  const [hasSavedProject, setHasSavedProject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('githubToken') || '');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isExportingToGithub, setIsExportingToGithub] = useState(false);

  useEffect(() => {
    // Check for a saved project on initial load
    if (localStorage.getItem('savedPieces')) {
      setHasSavedProject(true);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);

    if (theme === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(current => {
      if (current === 'system') return 'light';
      if (current === 'light') return 'dark';
      return 'system';
    });
  };
  
  const getThemeTitle = () => {
    if (theme === 'system') return 'Cambiar a modo claro';
    if (theme === 'light') return 'Cambiar a modo oscuro';
    return 'Usar tema del sistema';
  }

  const handleAddPiece = (width: number, height: number, quantity: number, widthBanding: EdgeBanding, heightBanding: EdgeBanding, rotation: Rotation) => {
    const newPieces: Piece[] = Array.from({ length: quantity }, () => ({
      id: crypto.randomUUID(),
      width,
      height,
      widthBanding,
      heightBanding,
      rotation,
    }));
    setPieces(prevPieces => [...prevPieces, ...newPieces]);
  };

  const handleRemovePiece = (id: string) => {
    setPieces(prevPieces => prevPieces.filter(p => p.id !== id));
  };
  
  const handleUpdatePiece = (id: string, updates: Partial<Pick<Piece, 'widthBanding' | 'heightBanding' | 'rotation'>>) => {
    setPieces(currentPieces =>
      currentPieces.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleOptimize = useCallback(() => {
    if (pieces.length === 0) return;
    setIsLoading(true);
    setPanels([]); // Clear previous results
    
    // Use setTimeout to allow UI to update to loading state before blocking
    setTimeout(() => {
        try {
            const resultPanels = optimizeCuts(pieces, PANEL_WIDTH, PANEL_HEIGHT, sawKerf);
            setPanels(resultPanels);
        } catch (error) {
            console.error("Optimization failed:", error);
            alert("Ocurrió un error durante la optimización.");
        } finally {
            setIsLoading(false);
        }
    }, 50);
  }, [pieces, sawKerf]);
  
  const handleSaveProject = () => {
    if (pieces.length > 0) {
      localStorage.setItem('savedPieces', JSON.stringify(pieces));
      setHasSavedProject(true);
      alert('Proyecto guardado en el navegador.');
    } else {
      alert('No hay piezas para guardar.');
    }
  };

  const handleLoadProject = () => {
    const saved = localStorage.getItem('savedPieces');
    if (saved) {
      if (confirm('Esto reemplazará la lista de piezas actual con el proyecto guardado en el navegador. ¿Continuar?')) {
        setPieces(JSON.parse(saved));
      }
    } else {
      alert('No hay ningún proyecto guardado en el navegador.');
    }
  };

  const handleClearPieces = () => {
    if (pieces.length > 0 && confirm('¿Estás seguro de que quieres eliminar todas las piezas de la lista?')) {
      setPieces([]);
      setPanels([]);
    }
  };

  const handleExportProject = () => {
    if (pieces.length === 0) {
      alert('No hay piezas para exportar.');
      return;
    }
    const dataStr = JSON.stringify(pieces, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `proyecto_corte_${new Date().toISOString().slice(0, 10)}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (pieces.length > 0 && !confirm('Esto reemplazará la lista de piezas actual. ¿Continuar?')) {
        event.target.value = ''; // Reset file input
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File is not readable');
        const importedPieces = JSON.parse(text);
        
        // Basic validation
        if (Array.isArray(importedPieces) && importedPieces.every(p => 'width' in p && 'height' in p && 'id' in p)) {
            setPieces(importedPieces);
            setPanels([]);
            alert('Proyecto importado correctamente.');
        } else {
            throw new Error('El formato del fichero no es válido.');
        }

      } catch (error) {
        alert(`Error al importar el fichero: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        event.target.value = ''; // Reset file input to allow re-importing the same file
      }
    };
    reader.readAsText(file);
  };
  
    const handleSaveToken = (token: string) => {
        localStorage.setItem('githubToken', token);
        setGithubToken(token);
        setIsTokenModalOpen(false);
        // Immediately trigger export after saving token
        handleGitHubExport(token); 
    };
    
    const handleClearToken = () => {
      if (confirm('¿Quieres olvidar tu token de GitHub? Tendrás que volver a introducirlo la próxima vez.')) {
        localStorage.removeItem('githubToken');
        setGithubToken('');
      }
    }

    const handleGitHubExport = async (tokenOverride?: string) => {
        const token = tokenOverride || githubToken;
        if (!token) {
            setIsTokenModalOpen(true);
            return;
        }

        if (pieces.length === 0) {
          alert('No hay piezas para exportar.');
          return;
        }
        
        setIsExportingToGithub(true);

        try {
            const userResponse = await fetch('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!userResponse.ok) {
              if (userResponse.status === 401) throw new Error('Token de GitHub no válido o expirado.');
              throw new Error(`Error al verificar el usuario: ${userResponse.statusText}`);
            }
            const userData = await userResponse.json();
            const owner = userData.login;

            const repoName = `proyecto-opticorte-${new Date().toISOString().slice(0, 10)}`;
            const repoDescription = `Datos del proyecto exportados desde el Optimizador de Corte de Tableros el ${new Date().toLocaleString()}.`;

            const createRepoResponse = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: repoName,
                    description: repoDescription,
                    private: true
                })
            });

            if (createRepoResponse.status === 422) {
                throw new Error(`El repositorio '${repoName}' ya existe en tu cuenta de GitHub.`);
            }
            if (!createRepoResponse.ok) {
                throw new Error(`No se pudo crear el repositorio de GitHub: ${createRepoResponse.statusText}`);
            }
            const repoData = await createRepoResponse.json();
            
            // btoa fails on non-ASCII characters. This is a robust way to handle UTF-8.
            const base64Encode = (str: string) => btoa(unescape(encodeURIComponent(str)));

            const readmeContent = `# Proyecto Optimizador de Corte\n\nEste repositorio fue generado automáticamente por la aplicación Optimizador de Corte de Tableros.\n\n## Datos del Proyecto\n\nPuedes importar este proyecto de vuelta a la aplicación guardando el siguiente bloque de código como un fichero \`.json\` y usando la opción "Importar desde Fichero".\n\n\`\`\`json\n${JSON.stringify(pieces, null, 2)}\n\`\`\`\n`;

            const createFileResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/README.md`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: 'Commit inicial del proyecto',
                    content: base64Encode(readmeContent)
                })
            });

            if (!createFileResponse.ok) {
                throw new Error('No se pudo crear el fichero README.md en el repositorio.');
            }

            alert(`¡Proyecto exportado con éxito! Puedes verlo en: ${repoData.html_url}`);

        } catch (error) {
            alert(`Error al exportar a GitHub: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            if (error instanceof Error && error.message.includes('Token')) {
                localStorage.removeItem('githubToken');
                setGithubToken('');
            }
        } finally {
            setIsExportingToGithub(false);
        }
    };

  const allPlacedPieces = panels.flatMap(panel => panel.pieces);
  
  const handlePrint = () => {
    window.print();
  };


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <GitHubTokenModal isOpen={isTokenModalOpen} onClose={() => setIsTokenModalOpen(false)} onSave={handleSaveToken} />
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30 no-print">
        <div className="max-w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <h1 className="text-2xl font-bold leading-tight">
                  Optimizador de Corte de Tableros
                </h1>
            </div>
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors"
                aria-label={getThemeTitle()}
                title={getThemeTitle()}
            >
                {theme === 'light' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                )}
                {theme === 'dark' && (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )}
                {theme === 'system' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17.674l.065-.065a2.25 2.25 0 013.182 0l.065.065a2.25 2.25 0 003.182 0l.065-.065a2.25 2.25 0 013.182 0l.065.065m-11.488 0A2.25 2.25 0 015.25 15h.001a2.25 2.25 0 012.25 2.25.002.002 0 00.002.002 2.25 2.25 0 012.25 2.25v.001a2.25 2.25 0 01-2.25-2.25H7.5a2.25 2.25 0 01-2.25-2.25v-.001z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 000-18h.008c4.97 0 9 4.03 9 9s-4.03 9-9 9H12z" />
                    </svg>
                )}
            </button>
          </div>
        </div>
      </header>
      <div className="flex flex-col lg:flex-row">
        <aside className="w-full lg:w-96 lg:fixed top-16 left-0 lg:h-screen-minus-header p-6 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 no-print">
           <div className="space-y-6">
              <PieceInput onAddPiece={handleAddPiece} />
              <Configuration sawKerf={sawKerf} setSawKerf={setSawKerf} />
              <PieceList pieces={pieces} onRemovePiece={handleRemovePiece} onUpdatePiece={handleUpdatePiece} />
               <div className="space-y-2">
                <button
                    onClick={handleOptimize}
                    disabled={pieces.length === 0 || isLoading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5M3 12l6.414 6.414a2 2 0 002.828 0L18 12M3 12l6.414-6.414a2 2 0 012.828 0L18 12" />
                    </svg>
                    {isLoading ? 'Optimizando...' : 'Optimizar Corte'}
                  </button>
                  <fieldset className="border-t border-b border-gray-200 dark:border-gray-700">
                    <legend className="sr-only">Gestión de Proyecto</legend>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                       <div className="py-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Guardado en Navegador</span>
                            <div className="flex items-center space-x-2">
                                <button onClick={handleSaveProject} title="Guardar en Navegador" aria-label="Guardar en Navegador" className="flex justify-center items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50" disabled={pieces.length === 0}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586L7.707 10.293zM3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>
                                </button>
                                 <button onClick={handleLoadProject} title="Cargar desde Navegador" aria-label="Cargar desde Navegador" className="flex justify-center items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50" disabled={!hasSavedProject}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 110 14H5.414l2.293-2.293a1 1 0 11-1.414-1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L3.586 17H11a5 5 0 100-10H5.414l2.293 2.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" /></svg>
                                </button>
                            </div>
                       </div>
                        <div className="py-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Importar / Exportar Fichero</span>
                             <div className="flex items-center space-x-2">
                                <input type="file" ref={fileInputRef} onChange={handleImportProject} accept=".json" className="hidden" />
                                <button onClick={handleImportClick} title="Importar desde Fichero (.json)" aria-label="Importar desde Fichero" className="flex justify-center items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                </button>
                                <button onClick={handleExportProject} title="Exportar a Fichero (.json)" aria-label="Exportar a Fichero" className="flex justify-center items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50" disabled={pieces.length === 0}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                             </div>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</span>
                             <div className="flex items-center space-x-2">
                                <button onClick={() => handleGitHubExport()} title="Exportar a GitHub" aria-label="Exportar a GitHub" className="flex justify-center items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50" disabled={pieces.length === 0 || isExportingToGithub}>
                                    {isExportingToGithub ? (
                                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.218.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .266.18.577.688.482A10.001 10.001 0 0020 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" /></svg>
                                    )}
                                </button>
                                {githubToken && (
                                <button onClick={handleClearToken} title="Olvidar Token de GitHub" aria-label="Olvidar Token de GitHub" className="flex justify-center items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                </button>
                                )}
                             </div>
                        </div>
                    </div>
                  </fieldset>
                  <button onClick={handleClearPieces} title="Limpiar Lista" aria-label="Limpiar Lista" className="w-full flex justify-center items-center py-2 px-4 border border-red-500 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-400 disabled:text-gray-400" disabled={pieces.length === 0}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    Limpiar Todo
                  </button>
              </div>
            </div>
        </aside>
        <main className="flex-1 lg:ml-96 p-6">
            {isLoading ? (
                <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-200 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                        <svg className="animate-spin h-10 w-10 text-indigo-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Calculando la disposición óptima...</p>
                    </div>
                </div>
            ) : (
              <>
                {panels.length > 0 && (
                  <div className="flex justify-end mb-4 no-print">
                    <button
                      onClick={handlePrint}
                      className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                      </svg>
                      Imprimir / Guardar PDF
                    </button>
                  </div>
                )}
                <div className="printable-content">
                    <ResultDisplay panels={panels} sawKerf={sawKerf} />
                    <SummaryDisplay pieces={allPlacedPieces} />
                    <OffcutsDisplay panels={panels} />
                </div>
              </>
            )}
        </main>
      </div>
      <style>{`
        .h-screen-minus-header {
          height: calc(100vh - 64px); /* Adjust 64px to your header's height */
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .printable-content > div {
            page-break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #e5e7eb; /* gray-200 */
            margin-top: 1.5rem !important;
          }
          /* Reset dark mode for printing */
          .dark body {
            background: #fff !important;
          }
          .dark h1, .dark h2, .dark h3, .dark p, .dark th, .dark td, .dark span {
            color: #1f2937 !important; /* gray-800 */
          }
          .dark thead {
             background-color: #f9fafb !important; /* gray-50 */
          }
          .dark div[class*="border-gray-700"], .dark div[class*="divide-gray-700"] {
            border-color: #e5e7eb !important; /* gray-200 */
          }
          /* Keep intentional colors */
          .bg-black {
            background-color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-black span, .bg-black div, .text-white {
            color: #fff !important;
          }
          .bg-gray-300 {
             background-color: #d1d5db !important; /* gray-300 */
             -webkit-print-color-adjust: exact;
             print-color-adjust: exact;
          }
           .absolute[class*="bg-gray-400"] {
            background-color: rgba(156, 163, 175, 0.3) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
