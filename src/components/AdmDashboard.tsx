import React from 'react';

interface AdmDashboardProps {
  spreadsheetId: string;
}

export const AdmDashboard: React.FC<AdmDashboardProps> = ({ spreadsheetId }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">ADM IMPLANTAÇÃO</h1>
          <p className="text-gray-600 mb-4">ID da Planilha: {spreadsheetId}</p>
          <p className="text-green-600 font-semibold">✅ Componente carregado com sucesso!</p>
        </div>
      </div>
    </div>
  );
};
