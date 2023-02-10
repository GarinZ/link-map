export const FILTER_OPTIONS: Fancytree.FilterOptions = {
    autoApply: true, // Re-apply last filter if lazy data is loaded
    autoExpand: true, // Expand all branches that contain matches while filtered
    counter: true, // Show a badge with number of matching child nodes near parent icons
    fuzzy: false, // Match single characters in order, e.g. 'fb' will match 'FooBar'
    hideExpandedCounter: true, // Hide counter badge if parent is expanded
    hideExpanders: false, // Hide expanders if all child nodes are hidden by filter
    highlight: true, // Highlight matches by wrapping inside <mark> tags
    leavesOnly: false, // Match end nodes only
    nodata: true, // Display a 'no data' status node if result is empty
    mode: 'dimm', // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
};

export const registerSearchEventHandler = (tree: Fancytree.Fancytree) => {
    const $searchButton = $('button#btnResetSearch');
    $('input[name=search]')
        .on('keyup', function (e) {
            const filterFunc = tree.filterNodes;
            const match: string = String($(this).val()) ?? '';
            if ((e && e.which === $.ui.keyCode.ESCAPE) || $.trim(match) === '') {
                $searchButton.trigger('click');
                return;
            }
            const n = filterFunc(match);
            $searchButton.attr('disabled');
            $('span#matches').text(`(${n} matches)`);
        })
        .focus();

    $searchButton
        .click(() => {
            $('input[name=search]').val('');
            $('span#matches').text('');
            tree.clearFilter();
        })
        .attr('disabled');
};
