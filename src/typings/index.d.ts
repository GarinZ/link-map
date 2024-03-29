declare type StyleSheetModule = { [key: string]: string };
declare var __ENV__: 'development' | 'production';
declare var __TARGET__: 'chrome' | 'edge';
declare var __LOG_LEVEL__: string;
declare var __VERSION__: string;

declare module '*.scss' {
    const exports: StyleSheetModule;
    export default exports;
}

declare module '*.svg' {
    import * as React from 'react';

    export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

    const src: string;
    export default src;
}

declare module '*.bmp' {
    const path: string;
    export default path;
}

declare module '*.gif' {
    const path: string;
    export default path;
}

declare module '*.jpg' {
    const path: string;
    export default path;
}

declare module '*.jpeg' {
    const path: string;
    export default path;
}

declare module '*.png' {
    const path: string;
    export default path;
}
