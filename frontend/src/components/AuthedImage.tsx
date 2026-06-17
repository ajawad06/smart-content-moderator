import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Spinner } from './ui';

/**
 * Renders an image from a token-protected endpoint. A plain <img src> can't send
 * the Authorization header, so we fetch the bytes via axios and use an object URL.
 */
export function AuthedImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['image', src],
    queryFn: async () => {
      const res = await api.get<Blob>(src, { responseType: 'blob' });
      return URL.createObjectURL(res.data);
    },
    staleTime: Infinity,
    gcTime: 0,
  });

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className ?? ''}`}>
        <Spinner className="h-5 w-5 text-slate-400" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-xs text-slate-400 ${className ?? ''}`}>
        unavailable
      </div>
    );
  }
  return <img src={data} alt={alt} className={className} />;
}
