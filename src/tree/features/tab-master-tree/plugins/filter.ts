export const FILTER_OPTIONS: Fancytree.Extensions.Filter = {
    autoApply: true, // Re-apply last filter if lazy data is loaded
    autoExpand: false, // Expand all branches that contain matches while filtered
    counter: true, // Show a badge with number of matching child nodes near parent icons
    fuzzy: true, // Match single characters in order, e.g. 'fb' will match 'FooBar'
    hideExpandedCounter: true, // Hide counter badge if parent is expanded
    hideExpanders: true, // Hide expanders if all child nodes are hidden by filter
    highlight: true, // Highlight matches by wrapping inside <mark> tags
    leavesOnly: false, // Match end nodes only
    nodata: true, // Display a 'no data' status node if result is empty
    mode: 'hide', // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
};

export const clearHighLightFields = (node: Fancytree.FancytreeNode) => {
    node.data.aliasWithHighlight = null;
    node.data.titleWithHighlight = null;
};
