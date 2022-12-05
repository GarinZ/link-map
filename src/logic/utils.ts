const lazyLogCache: any = {};
/* Log if value changed, nor more than interval/sec. */
export const logLazy = (name: string, value: any, interval: number, msg: string) => {
    const now = Date.now();
    if (!lazyLogCache[name]) lazyLogCache[name] = { stamp: now };

    const entry = lazyLogCache[name];

    if (value && value === entry.value) return;

    entry.value = value;

    if (interval > 0 && now - entry.stamp <= interval) return;

    entry.stamp = now;
    lazyLogCache[name] = entry;
    console.log(msg);
};

/**
 * Array转Object
 * @param arr 待转换数组
 * @param keyGetter 从item中获取key的方法
 * @return  转换后Object
 */
export const array2Object = <T>(
    arr: Array<T>,
    keyGetter: (item: any) => string,
): { [key: string]: T } => {
    const result: any = {};
    arr.forEach((item) => {
        const key = keyGetter(item);
        result[key] = item;
    });
    return result;
};

export const pushIfAbsentInit = (
    map: { [prop: string | number]: any },
    k: string | number,
    v: any,
) => {
    if (k in map) {
        map[k].push(v);
    } else {
        const arr = [];
        arr.push(v);
        map[k] = arr;
    }
};
