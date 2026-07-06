'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function withAuth(WrappedComponent) {
  return function ProtectedComponent(props) {
    const { data: session, status } = useSession();
    const [checked, setChecked] = useState(false);
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return;

      if (status === 'unauthenticated') {
        router.push('/login');
      } else if (status === 'authenticated') {
        setChecked(true);
      }
    }, [status, router]);

    if (status === 'loading' || !checked) return null;

    return <WrappedComponent {...props} />;
  };
}

export default withAuth;
