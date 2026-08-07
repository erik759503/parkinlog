import type { AppRole } from '@/contexts/AuthContext';

export const getRoleLabel = (role?: string | null, viewerRole?: AppRole | null) => {
  if (role === 'teste' || (role === 'dev' && viewerRole !== 'dev')) return 'Teste';

  switch (role) {
    case 'dev': return 'Desenvolvedor';
    case 'admin': return 'Administrador';
    case 'office': return 'Escritório';
    case 'gate': return 'Portaria';
    default: return '';
  }
};

export const getActorLabel = (username?: string | null, role?: string | null, viewerRole?: AppRole | null) => {
  if (role === 'teste' || (role === 'dev' && viewerRole !== 'dev')) return 'Teste';
  return username || '';
};
