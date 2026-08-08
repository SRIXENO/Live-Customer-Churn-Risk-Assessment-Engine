import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

export default function useChurnData(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    api.get(path).then(r => {
      if (active) setData(r.data.data);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [path]);

  useEffect(() => {
    return load();
  }, [load, ...deps]);

  return { data, loading, refresh: load };
}
