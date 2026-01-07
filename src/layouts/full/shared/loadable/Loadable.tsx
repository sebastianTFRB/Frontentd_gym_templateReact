import React, { Suspense } from 'react';
import { Spinner } from 'flowbite-react';

const Loader = () => (
    <div className="fixed top-0 left-0 z-50 w-full h-full flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <Spinner aria-label="Loading..." size="xl" color="warning" />
    </div>
);

const Loadable = (Component: React.LazyExoticComponent<any>) => (props: any) => (
    <Suspense fallback={<Loader />}>
        <Component {...props} />
    </Suspense>
);

export default Loadable;
