interface Store {
    tree: Fancytree.Fancytree | null;
}

export default {
    tree: null,
    focusPath: '',
} as Store;
